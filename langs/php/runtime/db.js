'use strict';
/*
 * Read-only database inspection used by the PHP plugin (MySQL / MariaDB).
 *
 * Privacy and safety by design:
 *   - one connection per scan, closed at the end
 *   - identifiers from the config are escaped (escapeId); no values are interpolated
 *   - password hashes are never fetched: only LENGTH() and the first 7 characters
 *     (enough to recognize bcrypt/argon2 prefixes) leave the database
 *   - salt uniqueness is checked with an aggregate query instead of loading all rows
 * A read-only database user is sufficient (SELECT on the configured tables).
 */

function normalizeDbConfig(php = {}, env = process.env, cli = {}) {
  const enabled = php.IS_DBMS_USED === true && !cli.noDb;
  return {
    enabled,
    type: String(php.DBMS || 'mysql').toLowerCase(),
    host: env.ASST_DB_HOST || php.YOUR_WEBAPP_DBMS_SERVER_IP || '127.0.0.1',
    port: Number(env.ASST_DB_PORT || php.YOUR_WEBAPP_DBMS_PORT || 3306),
    database: env.ASST_DB_NAME || php.YOUR_WEBAPP_DBMS_DB_NAME || '',
    user: env.ASST_DB_USER || php.YOUR_WEBAPP_DBMS_USERNAME || 'root',
    password: env.ASST_DB_PASSWORD !== undefined ? env.ASST_DB_PASSWORD : (php.YOUR_WEBAPP_DBMS_PASSWORD || ''),
    userTable: {
      name: php.YOUR_WEBAPP_DBMS_USER_TABLE_NAME || '',
      passwordColumn: php.YOUR_WEBAPP_DBMS_USER_TABLE_PASSWORD_COLUMN_NAME || '',
      saltColumn: php.YOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME || '',
    },
    adminTable: {
      name: php.YOUR_WEBAPP_DBMS_ADMIN_TABLE_NAME || '',
      passwordColumn: php.YOUR_WEBAPP_DBMS_ADMIN_TABLE_PASSWORD_COLUMN_NAME || '',
      saltColumn: php.YOUR_WEBAPP_DBMS_ADMIN_TABLE_SALT_COLUMN_NAME || '',
    },
  };
}

class PhpDatabase {
  constructor(dbConfig, { connectTimeout = 5000 } = {}) {
    this.cfg = dbConfig;
    this.connectTimeout = connectTimeout;
    this.conn = null;
    this.error = null;
  }

  get supported() {
    return this.cfg.type === 'mysql' || this.cfg.type === 'mariadb';
  }

  /** @returns {Promise<boolean>} */
  async connect() {
    if (this.conn) return true;
    if (!this.cfg.enabled) { this.error = 'database checks are disabled'; return false; }
    if (!this.supported) { this.error = `DBMS "${this.cfg.type}" is not supported yet (MySQL/MariaDB only)`; return false; }
    let mysql;
    try {
      mysql = require('mysql2/promise');
    } catch (err) {
      this.error = 'mysql2 module is not installed (run "npm install")';
      return false;
    }
    try {
      this.conn = await mysql.createConnection({
        host: this.cfg.host,
        port: this.cfg.port,
        user: this.cfg.user,
        password: this.cfg.password,
        database: this.cfg.database,
        connectTimeout: this.connectTimeout,
        multipleStatements: false,
      });
      return true;
    } catch (err) {
      this.error = `${err.code || 'ERROR'}: ${err.message}`;
      this.conn = null;
      return false;
    }
  }

  id(name) {
    // backtick-quote identifiers, supporting "schema.table"
    return String(name).split('.').map((part) => '`' + part.replace(/`/g, '``') + '`').join('.');
  }

  async query(sql, params = []) {
    if (!this.conn) throw new Error('not connected');
    const [rows] = await this.conn.query(sql, params);
    return rows;
  }

  /** Length and 7-char prefix of one stored password value: {length, prefix} | null */
  async passwordProfile(table, column) {
    if (!table || !column) return null;
    const c = this.id(column);
    const rows = await this.query(
      `SELECT CHAR_LENGTH(${c}) AS len, LEFT(${c}, 7) AS prefix FROM ${this.id(table)} WHERE ${c} IS NOT NULL AND ${c} <> '' ORDER BY ${c} DESC LIMIT 1`,
    );
    if (!rows.length) return null;
    return { length: Number(rows[0].len), prefix: String(rows[0].prefix) };
  }

  /** Length of one stored value (e.g. a salt) or null. */
  async valueLength(table, column) {
    if (!table || !column) return null;
    const c = this.id(column);
    const rows = await this.query(`SELECT CHAR_LENGTH(${c}) AS len FROM ${this.id(table)} WHERE ${c} IS NOT NULL AND ${c} <> '' LIMIT 1`);
    return rows.length ? Number(rows[0].len) : null;
  }

  /** True when at least two rows share the same non-empty value in the column. */
  async hasDuplicateValues(table, column) {
    if (!table || !column) return false;
    const c = this.id(column);
    const rows = await this.query(
      `SELECT ${c} AS v FROM ${this.id(table)} WHERE ${c} IS NOT NULL AND ${c} <> '' GROUP BY ${c} HAVING COUNT(*) > 1 LIMIT 1`,
    );
    return rows.length > 0;
  }

  /** {version, product: 'mysql'|'mariadb', innodb} */
  async serverInfo() {
    const rows = await this.query('SELECT VERSION() AS v');
    const version = String(rows[0].v);
    let innodb = null;
    try {
      const r = await this.query("SHOW VARIABLES LIKE 'innodb_version'");
      if (r.length) innodb = String(r[0].Value);
    } catch (_) { /* optional */ }
    return { version, product: /mariadb/i.test(version) ? 'mariadb' : 'mysql', innodb };
  }

  async close() {
    if (this.conn) {
      try { await this.conn.end(); } catch (_) { /* ignore */ }
      this.conn = null;
    }
  }
}

module.exports = { PhpDatabase, normalizeDbConfig };
