'use strict';
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadConfig, ConfigError } = require('../../core/config');
const { normalizeDbConfig } = require('../../langs/php/runtime/db');

const REPO = path.resolve(__dirname, '..', '..');

function tempAsst(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-cfg-'));
  const asst = path.join(root, 'htdocs', 'ASST');
  fs.mkdirSync(asst, { recursive: true });
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(asst, name), content);
  fs.writeFileSync(path.join(asst, 'package.json'), JSON.stringify({ version: '9.9.9' }));
  return { root, asst };
}

function v1File(name) {
  try {
    return execFileSync('git', ['-C', REPO, 'show', `v1.0.0:${name}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (_) {
    return null; // shallow clones without tags
  }
}

test('unmodified v1.0 config files load and resolve against the ASST folder', (t) => {
  const cfg = v1File('config.js');
  const php = v1File('config_php_lang.js');
  if (!cfg || !php) return t.skip('v1.0.0 tag not available in this clone');
  const { root, asst } = tempAsst({ 'config.js': cfg, 'config_php_lang.js': php });
  try {
    const config = loadConfig({}, {}, asst);
    assert.strictEqual(config.language, 'php');
    assert.strictEqual(config.scanPath, path.join(root, 'htdocs', 'ProjectFolderToScan'));
    assert.strictEqual(config.htmlPath, path.join(asst, 'report.html'));
    assert.deepStrictEqual(config.formats, ['html']);
    assert.strictEqual(config.version, '9.9.9');
    const db = normalizeDbConfig(config.languageConfig.php, {}, {});
    assert.strictEqual(db.enabled, true);
    assert.strictEqual(db.userTable.name, 'user');
    assert.strictEqual(db.adminTable.saltColumn, 'salt');
    assert.strictEqual(config.languageConfig.php.PHP_EXE_BIN_PATH, 'C:\\xampp\\php\\php.exe');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('absolute scan paths and command-line options take precedence', () => {
  const { root, asst } = tempAsst({ 'config.js': 'module.exports = { DEFAULT_PROJECT_PATH_TO_SCAN: "../Shop/", USED_PROGRAMMING_LANGUAGE: "PHP" };' });
  try {
    const abs = path.join(root, 'elsewhere');
    assert.strictEqual(loadConfig({ path: abs }, {}, asst).scanPath, abs);
    const outDir = path.join(root, 'out');
    const c = loadConfig({ format: 'html,json', out: outDir }, {}, asst);
    assert.deepStrictEqual(c.formats, ['html', 'json']);
    assert.strictEqual(c.htmlPath, path.join(outDir, 'report.html'));
    assert.strictEqual(loadConfig({}, {}, asst).scanPath, path.join(root, 'htdocs', 'Shop'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('invalid language and format produce friendly configuration errors', () => {
  const { root, asst } = tempAsst({ 'config.js': 'module.exports = { USED_PROGRAMMING_LANGUAGE: "cobol" };' });
  try {
    assert.throws(() => loadConfig({}, {}, asst), ConfigError);
    assert.throws(() => loadConfig({ lang: 'php', format: 'pdf' }, {}, asst), /Unknown report format/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('database password can come from the environment and --no-db disables checks', () => {
  const php = { IS_DBMS_USED: true, YOUR_WEBAPP_DBMS_PASSWORD: 'from-file' };
  assert.strictEqual(normalizeDbConfig(php, { ASST_DB_PASSWORD: 'from-env' }).password, 'from-env');
  assert.strictEqual(normalizeDbConfig(php, {}).password, 'from-file');
  assert.strictEqual(normalizeDbConfig(php, {}, { noDb: true }).enabled, false);
  assert.strictEqual(normalizeDbConfig({ IS_DBMS_USED: false }, {}).enabled, false);
});
