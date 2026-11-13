'use strict';
/*
 * Runtime checks: PHP / libxml versions through the configured PHP binary, and
 * read-only database inspection (password storage format, salts, server version).
 */
const { runPhp } = require('../../../core/shell');
const { lifecycle } = require('../../../core/lifecycle');

function versionLess(a, b) {
  const pa = String(a).split('.').map((x) => parseInt(x, 10) || 0);
  const pb = String(b).split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0);
  }
  return false;
}

/** @returns {{env:object|null, hits:Array, notice:string|null}} */
function phpRuntime(phpBin, today) {
  if (!phpBin) return { env: null, hits: [], notice: null };
  const res = runPhp(phpBin, "echo json_encode(['php'=>PHP_VERSION,'libxml'=>defined('LIBXML_DOTTED_VERSION')?LIBXML_DOTTED_VERSION:null,'os'=>PHP_OS_FAMILY]);");
  if (!res.ok) return { env: null, hits: [], notice: `PHP runtime checks skipped: ${res.error} (set PHP_EXE_BIN_PATH in config_php_lang.js, or use --php-bin)` };
  let env;
  try {
    env = JSON.parse(res.stdout.slice(res.stdout.indexOf('{')));
  } catch (_) {
    return { env: null, hits: [], notice: 'PHP runtime checks skipped: unexpected output from the PHP binary.' };
  }
  const hits = [];
  const lc = lifecycle('php', env.php, today);
  env.phpLifecycle = lc;
  if (lc.status === 'eol') {
    hits.push({ ruleId: 'PHP-COMP-001', message: `PHP ${env.php} reached end of life on ${lc.eol}; it no longer receives security fixes. Upgrade to a supported PHP version.` });
  } else if (lc.status === 'security-only') {
    hits.push({ ruleId: 'PHP-COMP-001', severity: 'info', message: `PHP ${env.php} receives security fixes only, until ${lc.eol}. Plan the upgrade to a newer PHP version.` });
  }
  if (env.libxml) {
    if (versionLess(env.libxml, '2.9.0')) hits.push({ ruleId: 'PHP-COMP-002', severity: 'high', message: `libxml ${env.libxml} loads external XML entities by default. Upgrade PHP/libxml (2.9.0 or newer).` });
    else if (versionLess(env.libxml, '2.9.4')) hits.push({ ruleId: 'PHP-COMP-002', severity: 'low', message: `libxml ${env.libxml} has known security fixes in later 2.9.x releases.` });
  }
  return { env, hits, notice: null };
}

/** Classifies a stored password from its length and first 7 characters. */
function classifyPassword(profile) {
  const p = profile.prefix || '';
  const len = profile.length;
  if (/^\$2[abxy]\$/.test(p)) return { kind: 'bcrypt', ok: true };
  if (/^\$argon2/.test(p)) return { kind: 'argon2', ok: true };
  if (/^\$[56]\$/.test(p)) return { kind: 'sha-crypt', ok: true };
  if (/^\$1\$/.test(p)) return { kind: 'md5-crypt', ok: false, rule: 'PHP-DB-002' };
  if (/^\$[PH]\$/.test(p)) return { kind: 'phpass (iterated MD5)', ok: false, rule: 'PHP-DB-002', severity: 'medium' };
  if (/^\*[0-9A-F]{6}$/.test(p) && len === 41) return { kind: 'MySQL PASSWORD()', ok: false, rule: 'PHP-DB-002' };
  const hexNames = { 32: 'MD5', 40: 'SHA-1', 56: 'SHA-224', 64: 'SHA-256', 96: 'SHA-384', 128: 'SHA-512' };
  if (/^[0-9a-f]{7}$/i.test(p) && hexNames[len]) return { kind: hexNames[len], ok: false, rule: 'PHP-DB-002', fast: true };
  if (/^[A-Za-z0-9+/]{7}$/.test(p) && [24, 28, 44, 64, 88].includes(len)) return { kind: 'base64-encoded digest', ok: false, rule: 'PHP-DB-002', fast: true, severity: 'medium' };
  if (len < 20) return { kind: 'plain text', ok: false, rule: 'PHP-DB-001' };
  return { kind: 'unknown', ok: true };
}

async function databaseChecks(db, today) {
  const hits = [];
  const env = {};
  try {
    const info = await db.serverInfo();
    env.database = info;
    const product = info.product;
    const version = (info.version.match(/^\d+(\.\d+)*/) || [''])[0];
    const lc = lifecycle(product, version, today);
    env.database.lifecycle = lc;
    if (lc.status === 'eol') hits.push({ ruleId: 'PHP-COMP-003', message: `${product === 'mariadb' ? 'MariaDB' : 'MySQL'} ${version} reached end of life on ${lc.eol}. Upgrade the database server.` });
  } catch (err) {
    env.databaseError = err.message;
  }
  const tables = [{ label: 'user', t: db.cfg.userTable }];
  if (db.cfg.adminTable.name && db.cfg.adminTable.name !== db.cfg.userTable.name) tables.push({ label: 'admin', t: db.cfg.adminTable });
  env.passwordStorage = [];
  for (const { label, t } of tables) {
    if (!t.name || !t.passwordColumn) continue;
    let profile;
    try {
      profile = await db.passwordProfile(t.name, t.passwordColumn);
    } catch (err) {
      env.passwordStorage.push({ table: t.name, error: err.message });
      continue;
    }
    if (!profile) {
      env.passwordStorage.push({ table: t.name, error: 'no rows with a stored password' });
      continue;
    }
    const cls = classifyPassword(profile);
    env.passwordStorage.push({ table: t.name, column: t.passwordColumn, kind: cls.kind });
    if (!cls.ok) {
      const where = `${t.name}.${t.passwordColumn} (${label} table)`;
      const msg = cls.rule === 'PHP-DB-001'
        ? `Values in ${where} do not look like password hashes. Store passwords with password_hash() and check them with password_verify().`
        : `Passwords in ${where} are stored as ${cls.kind}. Re-hash them with password_hash() (bcrypt or argon2id) on the next login.`;
      hits.push({ ruleId: cls.rule, severity: cls.severity, message: msg });
    }
    if (cls.fast && t.saltColumn) {
      const dup = await db.hasDuplicateValues(t.name, t.saltColumn).catch(() => false);
      if (dup) hits.push({ ruleId: 'PHP-DB-003', message: `Several rows in ${t.name}.${t.saltColumn} share the same salt. password_hash() generates a unique salt automatically.` });
    }
  }
  return { env, hits };
}

module.exports = { phpRuntime, databaseChecks, classifyPassword, versionLess };
