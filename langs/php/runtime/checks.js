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
const onDate = (d) => (typeof d === 'string' ? ` on ${d}` : '');

/** php.ini directives read for the configuration audit. */
const INI_KEYS = [
  'display_errors', 'display_startup_errors', 'log_errors', 'expose_php', 'allow_url_include', 'allow_url_fopen',
  'session.cookie_httponly', 'session.cookie_secure', 'session.cookie_samesite', 'session.use_strict_mode',
  'session.use_only_cookies', 'session.use_trans_sid', 'open_basedir', 'disable_functions', 'enable_dl', 'zend.assertions',
];

const RUNTIME_SNIPPET = [
  "$i = function_exists('ini_get_all') ? ini_get_all(null, false) : [];",
  '$o = [];',
  `foreach ([${INI_KEYS.map((k) => `'${k}'`).join(',')}] as $k) { $o[$k] = array_key_exists($k, $i) ? $i[$k] : null; }`,
  "echo json_encode(['php'=>PHP_VERSION,'libxml'=>defined('LIBXML_DOTTED_VERSION')?LIBXML_DOTTED_VERSION:null,'os'=>PHP_OS_FAMILY,'ini'=>$o,'iniFile'=>php_ini_loaded_file() ?: null]);",
].join(' ');

/** PHP-COMP-001 for a PHP version (from the PHP binary, or from the X-Powered-By header of the live site). */
function phpLifecycleHits(version, today, source = '') {
  const lc = lifecycle('php', version, today);
  const hits = [];
  if (lc.status === 'eol') {
    hits.push({ ruleId: 'PHP-COMP-001', message: `PHP ${version}${source} reached end of life${onDate(lc.eol)}; it no longer receives security fixes. Upgrade to a supported PHP version.` });
  } else if (lc.status === 'security-only') {
    hits.push({ ruleId: 'PHP-COMP-001', severity: 'info', message: `PHP ${version}${source} receives security fixes only${typeof lc.eol === 'string' ? `, until ${lc.eol}` : ''}. Plan the upgrade to a newer PHP version.` });
  }
  return { lc, hits };
}

const isOn = (v) => v !== null && v !== undefined && /^(1|on|true|yes|stdout|stderr)$/i.test(String(v).trim());
const COMMAND_FUNCTIONS = ['exec', 'system', 'shell_exec', 'passthru', 'proc_open', 'popen'];

/**
 * Audits php.ini values read through the PHP command-line binary.
 * @param {object} ini directive -> value (strings, null when unset)
 * @param {string|null} iniFile loaded php.ini path
 */
function phpIniAudit(ini, iniFile) {
  if (!ini || typeof ini !== 'object') return [];
  const where = iniFile ? ` (${iniFile})` : ' (no php.ini file is loaded, so PHP\'s built-in defaults apply)';
  const hits = [];
  if (isOn(ini.display_errors) || isOn(ini.display_startup_errors)) {
    const which = ['display_errors', 'display_startup_errors'].filter((k) => isOn(ini[k])).map((k) => `${k} = On`).join(' and ');
    hits.push({
      ruleId: 'PHP-INI-001',
      message: `php.ini sets ${which}${where}. Warnings and errors, with file paths and code details, are shown to visitors. Use display_errors = Off and log_errors = On in production${ini.log_errors !== null && !isOn(ini.log_errors) ? '; log_errors is off as well, so errors are not recorded anywhere' : ''}.`,
    });
  }
  if (isOn(ini.allow_url_include)) {
    hits.push({ ruleId: 'PHP-INI-002', message: `php.ini sets allow_url_include = On${where}. An include or require with an attacker-controlled path can then run code from another server. Set it to Off.` });
  }
  if (isOn(ini.expose_php)) {
    hits.push({ ruleId: 'PHP-INI-003', message: `php.ini sets expose_php = On${where}, so every response carries the exact PHP version. Set it to Off.` });
  }
  const session = [];
  let sessionSeverity = 'low';
  if (!isOn(ini['session.cookie_httponly'])) {
    session.push('session.cookie_httponly is Off (scripts can read the session cookie)');
    sessionSeverity = 'medium';
  }
  if (!isOn(ini['session.use_strict_mode'])) {
    session.push('session.use_strict_mode is Off (session ids that the server never issued are accepted, which enables session fixation)');
    sessionSeverity = 'medium';
  }
  if (ini['session.use_only_cookies'] !== null && !isOn(ini['session.use_only_cookies'])) {
    session.push('session.use_only_cookies is Off (session ids are accepted from URLs)');
    sessionSeverity = 'medium';
  }
  if (isOn(ini['session.use_trans_sid'])) {
    session.push('session.use_trans_sid is On (session ids are added to links)');
    sessionSeverity = 'medium';
  }
  if (!ini['session.cookie_samesite']) session.push('session.cookie_samesite is not set (use Lax or Strict)');
  if (!isOn(ini['session.cookie_secure'])) session.push('session.cookie_secure is Off (turn it on when the site is served over HTTPS)');
  if (session.length) {
    hits.push({ ruleId: 'PHP-INI-004', severity: sessionSeverity, message: `Session settings in php.ini${where}: ${session.join('; ')}.` });
  }
  const hardening = [];
  if (!ini.open_basedir) hardening.push('open_basedir is not set (PHP can read files outside the site folder)');
  const disabled = String(ini.disable_functions || '').split(',').map((s) => s.trim().toLowerCase());
  const enabled = COMMAND_FUNCTIONS.filter((fn) => !disabled.includes(fn));
  if (enabled.length === COMMAND_FUNCTIONS.length) hardening.push(`disable_functions does not disable command execution (${COMMAND_FUNCTIONS.join(', ')}); disable them if the application does not run system commands`);
  if (isOn(ini.allow_url_fopen)) hardening.push('allow_url_fopen is On (turn it off if the application does not open URLs with file functions)');
  if (isOn(ini.enable_dl)) hardening.push('enable_dl is On');
  if (String(ini['zend.assertions']) === '1') hardening.push('zend.assertions = 1 is a development setting (use -1 in production)');
  if (hardening.length) {
    hits.push({ ruleId: 'PHP-INI-005', confidence: 'medium', message: `Optional hardening in php.ini${where}: ${hardening.join('; ')}.` });
  }
  return hits;
}

function phpRuntime(phpBin, today) {
  if (!phpBin) return { env: null, hits: [], notice: null };
  const res = runPhp(phpBin, RUNTIME_SNIPPET);
  if (!res.ok) return { env: null, hits: [], notice: `PHP runtime checks skipped: ${res.error} (set PHP_EXE_BIN_PATH in config_php_lang.js, or use --php-bin)` };
  let env;
  try {
    env = JSON.parse(res.stdout.slice(res.stdout.indexOf('{')));
  } catch (_) {
    return { env: null, hits: [], notice: 'PHP runtime checks skipped: unexpected output from the PHP binary.' };
  }
  const { lc, hits } = phpLifecycleHits(env.php, today);
  env.phpLifecycle = lc;
  hits.push(...phpIniAudit(env.ini, env.iniFile));
  delete env.ini; // only the findings are reported, not the whole configuration
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
    if (lc.status === 'eol') hits.push({ ruleId: 'PHP-COMP-003', message: `${product === 'mariadb' ? 'MariaDB' : 'MySQL'} ${version} reached end of life${onDate(lc.eol)}. Upgrade the database server.` });
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

module.exports = { phpRuntime, phpIniAudit, phpLifecycleHits, databaseChecks, classifyPassword, versionLess, INI_KEYS };
