'use strict';
/*
 * Supply chain (lock files, bundled libraries, OSV, lifecycles) and secrets detection.
 *
 * Token-shaped test values are assembled at run time (prefix + filler) so this
 * repository never contains a contiguous provider token.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const semver = require('../../core/supply/semver');
const { parseComposerLock, parsePackageLock, parseYarnLock, readLockFiles } = require('../../core/supply/lockfiles');
const { identify } = require('../../core/supply/jslibs');
const osv = require('../../core/supply/osv');
const eol = require('../../core/supply/eol');
const { scanSupplyChain } = require('../../core/supply');
const { lifecycle } = require('../../core/lifecycle');
const { scanSecrets, mask } = require('../../core/secrets');

const REPO = path.join(__dirname, '..', '..');
const tmp = (name) => fs.mkdtempSync(path.join(os.tmpdir(), `asst-${name}-`));
const fill = (n, alphabet = 'aB3dE5gH7jK9mN2pQ4sT6vW8yZ') => Array.from({ length: n }, (_, i) => alphabet[(i * 7 + 3) % alphabet.length]).join('');
const fileOf = (rel) => ({ rel, name: path.posix.basename(rel), ext: (path.posix.extname(rel) || '').slice(1).toLowerCase() });

test('version comparison and OSV range evaluation', () => {
  assert.strictEqual(semver.compare('1.12.4', '3.5.0'), -1);
  assert.strictEqual(semver.compare('v6.5.2', '6.5.2'), 0);
  assert.strictEqual(semver.compare('3.0.0-rc.1', '3.0.0'), -1);
  assert.strictEqual(semver.compare('4.17.21', '4.17.3'), 1);
  const ranges = [{ introduced: '0' }, { fixed: '1.5.0' }, { introduced: '2.0.0' }, { fixed: '2.2.0' }];
  assert.strictEqual(semver.affectedBy('1.2.0', ranges), true);
  assert.strictEqual(semver.affectedBy('1.7.0', ranges), false);
  assert.strictEqual(semver.affectedBy('2.1.9', ranges), true);
  assert.strictEqual(semver.affectedBy('2.2.0', ranges), false);
  assert.strictEqual(semver.affectedBy('dev-main', ranges), false);
  assert.strictEqual(semver.affectedBy('1.0.0', [{ introduced: '0' }, { last_affected: '1.0.0' }]), true);
});

test('composer.lock, package-lock.json (v1/v3) and yarn.lock are read with locations', () => {
  const composer = JSON.stringify({
    packages: [{ name: 'acme/http', version: 'v2.1.0', abandoned: 'acme/http2' }],
    'packages-dev': [{ name: 'phpunit/phpunit', version: '9.6.0' }],
  }, null, 4);
  const c = parseComposerLock(composer, 'composer.lock');
  assert.deepStrictEqual(c.map((p) => [p.name, p.version, p.dev, p.abandoned]), [['acme/http', '2.1.0', false, 'acme/http2'], ['phpunit/phpunit', '9.6.0', true, null]]);
  assert.ok(c[0].line > 1);

  const v3 = JSON.stringify({ lockfileVersion: 3, packages: { '': { name: 'app' }, 'node_modules/lodash': { version: '4.17.20' }, 'node_modules/a/node_modules/@scope/b': { version: '1.0.0', dev: true }, 'node_modules/linked': { link: true } } }, null, 2);
  assert.deepStrictEqual(parsePackageLock(v3, 'package-lock.json').map((p) => [p.name, p.version, p.dev]), [['lodash', '4.17.20', false], ['@scope/b', '1.0.0', true]]);

  const v1 = JSON.stringify({ lockfileVersion: 1, dependencies: { minimist: { version: '1.2.0', dependencies: { inner: { version: '0.1.0', dev: true } } } } }, null, 2);
  assert.deepStrictEqual(parsePackageLock(v1, 'package-lock.json').map((p) => [p.name, p.version, p.dev]), [['minimist', '1.2.0', false], ['inner', '0.1.0', true]]);

  const yarn1 = '# yarn lockfile v1\n\n"@babel/core@^7.0.0", "@babel/core@^7.1.0":\n  version "7.12.3"\n  resolved "https://registry.yarnpkg.com/x"\n\nlodash@^4.17.0:\n  version "4.17.15"\n';
  assert.deepStrictEqual(parseYarnLock(yarn1, 'yarn.lock').map((p) => [p.name, p.version, p.line]), [['@babel/core', '7.12.3', 3], ['lodash', '4.17.15', 7]]);
  const berry = '__metadata:\n  version: 6\n\n"lodash@npm:^4.17.0":\n  version: 4.17.21\n  resolution: "lodash@npm:4.17.21"\n\n"app@workspace:.":\n  version: 0.0.0-use.local\n';
  assert.deepStrictEqual(parseYarnLock(berry, 'yarn.lock').map((p) => [p.name, p.version]), [['lodash', '4.17.21']]);
});

test('Composer dev packages installed in a deployment are detected', () => {
  const root = tmp('devinstall');
  fs.writeFileSync(path.join(root, 'composer.lock'), JSON.stringify({ packages: [], 'packages-dev': [{ name: 'phpunit/phpunit', version: '9.6.0' }] }));
  fs.mkdirSync(path.join(root, 'vendor', 'composer'), { recursive: true });
  fs.writeFileSync(path.join(root, 'vendor', 'composer', 'installed.json'), JSON.stringify({ packages: [], dev: true, 'dev-package-names': ['phpunit/phpunit'] }));
  const project = { root, files: [{ rel: 'composer.lock', name: 'composer.lock', ext: 'lock', abs: path.join(root, 'composer.lock') }] };
  const res = readLockFiles(project, (f) => fs.readFileSync(f.abs, 'utf8'));
  assert.deepStrictEqual(res.devInstalls.map((d) => [d.lock, d.file, d.names]), [['composer.lock', 'vendor/composer/installed.json', ['phpunit/phpunit']]]);
});

test('bundled JavaScript libraries are recognized from banners, markers and file names', () => {
  const pick = (name, text) => identify(name, text).map((l) => `${l.npm}@${l.version}`);
  assert.deepStrictEqual(pick('jquery.min.js', '/*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license */'), ['jquery@1.12.4']);
  assert.deepStrictEqual(pick('jquery.js', '/*!\n * jQuery JavaScript Library v3.7.1\n */'), ['jquery@3.7.1']);
  assert.deepStrictEqual(pick('plugin.js', '/* Requires jQuery v1.7.2 or later */'), [], 'a plugin that mentions jQuery is not jQuery');
  assert.deepStrictEqual(pick('ui.js', '/*! jQuery UI - v1.12.1 - 2016-09-14 */'), ['jquery-ui@1.12.1']);
  assert.deepStrictEqual(pick('b.js', '/*!\n * Bootstrap v3.3.7 (http://getbootstrap.com)\n */'), ['bootstrap@3.3.7']);
  assert.deepStrictEqual(pick('a.js', '/**\n * @license AngularJS v1.8.3\n */'), ['angular@1.8.3']);
  assert.deepStrictEqual(pick('tinymce.min.js', '// 4.9.11\n!function(){var tinymce={majorVersion:"4",minorVersion:"9.11"}}'), ['tinymce@4.9.11']);
  assert.deepStrictEqual(pick('jquery-3.4.1.min.js', '!function(){}'), ['jquery@3.4.1']);
  assert.deepStrictEqual(pick('lodash.min.js', '/**\n * @license\n * Lodash lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE\n */'), [], 'Lodash banner mentions Underscore without being Underscore');
});

test('lifecycle data with dates and booleans', () => {
  const data = {
    asOf: '2026-01-01',
    products: {
      lib: [
        { cycle: '3', eol: false, support: true },
        { cycle: '2', eol: false, support: '2025-06-01' },
        { cycle: '1', eol: true, support: false },
      ],
    },
  };
  const day = new Date('2026-06-01T00:00:00Z');
  assert.strictEqual(lifecycle('lib', '3.1.0', day, data).status, 'supported');
  assert.strictEqual(lifecycle('lib', '2.0.0', day, data).status, 'security-only');
  assert.strictEqual(lifecycle('lib', '1.12.4', day, data).status, 'eol');
  assert.strictEqual(lifecycle('lib', '9.0.0', day, data).status, 'unknown');
});

function fakeOsv(store) {
  const calls = { batch: 0, vulns: 0 };
  return {
    calls,
    async postJson(url, body) {
      assert.ok(url.endsWith('/querybatch'));
      calls.batch++;
      for (const q of body.queries) assert.deepStrictEqual(Object.keys(q).sort(), ['package', 'version'], 'only package and version are sent');
      return { results: body.queries.map((q) => ({ vulns: (store.byPackage[q.package.name] || []).map((id) => ({ id })) })) };
    },
    async getJson(url) {
      calls.vulns++;
      return store.vulns[decodeURIComponent(url.split('/').pop())];
    },
  };
}

test('OSV lookups send only package coordinates, and answers are cached', async () => {
  const store = {
    byPackage: { 'acme/http': ['GHSA-test-0001'] },
    vulns: {
      'GHSA-test-0001': {
        id: 'GHSA-test-0001', summary: 'Header injection', aliases: ['CVE-2099-0001'], database_specific: { severity: 'HIGH' },
        affected: [{ package: { ecosystem: 'Packagist', name: 'acme/http' }, ranges: [{ type: 'ECOSYSTEM', events: [{ introduced: '0' }, { fixed: '2.4.0' }] }] }],
      },
    },
  };
  const client = fakeOsv(store);
  const cacheFile = path.join(tmp('osv'), 'osv.json');
  const pkgs = [{ ecosystem: 'Packagist', name: 'acme/http', version: '2.1.0' }, { ecosystem: 'Packagist', name: 'acme/clean', version: '1.0.0' }, { ecosystem: 'WordPress', name: 'wordpress', version: '6.0' }];
  const res = await osv.lookup(pkgs, { cacheFile, client });
  const adv = res.get('Packagist|acme/http|2.1.0');
  assert.strictEqual(adv.length, 1);
  assert.strictEqual(adv[0].severity, 'high');
  assert.deepStrictEqual(adv[0].aliases, ['CVE-2099-0001']);
  assert.strictEqual(osv.fixedFor(adv[0], '2.1.0'), '2.4.0');
  assert.deepStrictEqual(res.get('Packagist|acme/clean|1.0.0'), []);
  assert.ok(!res.has('WordPress|wordpress|6.0'), 'only npm and Packagist are queried');
  await osv.lookup(pkgs, { cacheFile, client });
  assert.deepStrictEqual(client.calls, { batch: 1, vulns: 1 }, 'second lookup is served from the cache');
});

test('lifecycle refresh normalizes endoflife.date answers and caches them', async () => {
  const cacheFile = path.join(tmp('eol'), 'eol.json');
  let calls = 0;
  const client = { async getJson(url) { calls++; assert.ok(/endoflife\.date\/api\/\w+\.json$/.test(url)); return [{ cycle: 3, eol: false, support: true, latest: '3.7.1', releaseDate: 'x' }]; } };
  const data = await eol.refresh({ cacheFile, client, products: ['jquery'] });
  assert.deepStrictEqual(data.products.jquery, [{ cycle: '3', eol: false, support: true, lts: false, latest: '3.7.1' }]);
  await eol.refresh({ cacheFile, client, products: ['jquery'] });
  assert.strictEqual(calls, 1);
});

test('supply chain findings: advisories, end of life, dev installs and abandoned packages (offline)', async () => {
  const root = tmp('supply');
  fs.mkdirSync(path.join(root, 'js'));
  fs.writeFileSync(path.join(root, 'js', 'jquery.min.js'), '/*! jQuery v1.12.4 | (c) jQuery Foundation | jquery.org/license */\n!function(){}();\n');
  fs.writeFileSync(path.join(root, 'composer.lock'), JSON.stringify({ packages: [{ name: 'acme/old', version: '1.0.0', abandoned: true }], 'packages-dev': [{ name: 'phpunit/phpunit', version: '9.6.0' }] }, null, 4));
  fs.mkdirSync(path.join(root, 'vendor', 'composer'), { recursive: true });
  fs.writeFileSync(path.join(root, 'vendor', 'composer', 'installed.json'), JSON.stringify({ dev: true, 'dev-package-names': ['phpunit/phpunit'] }));
  const files = ['js/jquery.min.js', 'composer.lock'].map((rel) => ({ ...fileOf(rel), abs: path.join(root, rel) }));
  const notes = [];
  const res = await scanSupplyChain({
    project: { root, files },
    readText: (f) => fs.readFileSync(f.abs, 'utf8'),
    config: { online: false, asstRoot: tmp('asstroot') },
    notices: { add: (kind, message) => notes.push(message) },
    today: new Date('2026-11-13T00:00:00Z'),
  });
  const ids = res.hits.map((h) => `${h.ruleId} ${h.file}`).sort();
  assert.deepStrictEqual(ids, ['DEP-001 js/jquery.min.js', 'DEP-002 js/jquery.min.js', 'DEP-003 composer.lock', 'DEP-004 composer.lock']);
  const vuln = res.hits.find((h) => h.ruleId === 'DEP-001');
  assert.match(vuln.message, /CVE-2020-11022/);
  assert.match(vuln.message, /Upgrade to 3\.5\.0 or later/);
  assert.strictEqual(res.inventory.packages.length, 3);
  assert.ok(notes.some((n) => /--online/.test(n)), 'offline runs explain how to check lock files');
});

test('secrets: provider tokens are found and masked; placeholders and examples are not', () => {
  const ghToken = `gh${'p'}_${fill(36)}`;
  const awsId = `AK${'IA'}${'QWERTYUIOPASDFGH'}`;
  const slack = `xo${'xb'}-${fill(12, '0123456789')}-${fill(24)}`;
  const stripe = `sk${'_live'}_${fill(24)}`;
  const text = [
    '<?php',
    `$github = '${ghToken}';`,
    `define('AWS_KEY', '${awsId}');`,
    `$slack = "${slack}";`,
    `$stripe = new StripeClient('${stripe}');`,
    "$doc = 'AKIAIOSFODNN7EXAMPLE';",
    "$password = 'changeme';",
    "$label = 'Password';",
    `$db_password = 'Pr0d-${fill(8)}!';`,
    '-----BEGIN RSA PRIVATE KEY-----',
    'MIIEowIBAAKCAQEA',
    '-----END RSA PRIVATE KEY-----',
  ].join('\n');
  const hits = scanSecrets(fileOf('app/config.php'), text);
  assert.deepStrictEqual(hits.map((h) => h.line), [2, 3, 4, 5, 9, 10]);
  for (const h of hits) {
    assert.strictEqual(h.ruleId, 'SECRET-001');
    for (const secret of [ghToken, awsId, slack, stripe]) assert.ok(!h.message.includes(secret), 'messages never contain the secret');
  }
  assert.strictEqual(hits.find((h) => h.line === 2).confidence, 'high');
  assert.strictEqual(hits.find((h) => h.line === 9).confidence, 'medium');
  assert.ok(hits.find((h) => h.line === 2).message.includes(`gh${'p'}_****`), 'the token type stays visible');
  assert.strictEqual(hits.find((h) => h.line === 2).redact, ghToken);
  assert.ok(hits.find((h) => h.line === 10).redact.includes('MIIEowIBAAKCAQEA'), 'private key lines are masked in snippets');

  assert.deepStrictEqual(scanSecrets(fileOf('tests/ConfigTest.php'), `<?php $t = '${ghToken}';`).map((h) => h.confidence), ['low'], 'test code is low confidence');
  assert.deepStrictEqual(scanSecrets(fileOf('.env.example'), 'DB_PASSWORD=secret-value-here-123\n'), []);
  assert.deepStrictEqual(scanSecrets(fileOf('.env'), 'APP_ENV=local\nDB_PASSWORD=\nMAIL_PASSWORD=null\nDB_PASSWORD=${DB_PASS}\n'), []);
  assert.deepStrictEqual(scanSecrets(fileOf('.env'), `DB_PASSWORD=Pr0d-${fill(10)}\n`).map((h) => h.line), [1]);
  assert.deepStrictEqual(scanSecrets(fileOf('config/app.yml'), `db:\n  password: Hx8!${fill(6)}\n  user: root\n`).map((h) => h.line), [2]);
  assert.deepStrictEqual(scanSecrets(fileOf('photo.png'), ghToken), [], 'binary and unknown file types are skipped');
  assert.match(mask('abcdefghij'), /^\*+ \(10 characters\)$/);
});

test('detected secrets never appear in any report format', () => {
  const root = tmp('secret-report');
  const token = `gh${'p'}_${fill(36)}`;
  const pass = `Pr0d-${fill(9)}!`;
  fs.writeFileSync(path.join(root, 'index.php'), [
    '<?php',
    `$con = mysqli_connect('localhost', 'shop', '${pass}', 'shop');`,
    `$token = '${token}';`,
    "$id = $_GET['id'];",
    'mysqli_query($con, "SELECT * FROM t WHERE id = $id");',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(root, '.env'), `APP_ENV=production\nDB_PASSWORD=${pass}\n`);
  const out = tmp('secret-out');
  const r = spawnSync(process.execPath, [path.join(REPO, 'main.js'), '--path', root, '--out', out, '--format', 'html,json,sarif,md', '--no-db', '--php-bin', '', '--quiet', '--no-color'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
  const rules = report.findings.map((f) => f.ruleId);
  assert.ok(rules.includes('SECRET-001') && rules.includes('PHP-SECRET-001') && rules.includes('PHP-SQLI-001'), rules.join(','));
  for (const name of ['report.html', 'report.json', 'report.sarif', 'report.md']) {
    const text = fs.readFileSync(path.join(out, name), 'utf8');
    assert.ok(!text.includes(token), `${name} must not contain the token`);
    assert.ok(!text.includes(pass), `${name} must not contain the password`);
  }
  assert.ok(!r.stdout.includes(token) && !r.stdout.includes(pass), 'console output must not contain secrets');
});
