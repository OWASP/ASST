'use strict';
/*
 * Opt-in live checks (--url) and the php.ini audit.
 * A local HTTP server plays a misconfigured site and records every request it receives.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const { resolveTarget, isLocalAddress, normalizeBase } = require('../../core/live/target');
const { LiveClient } = require('../../core/live/client');
const { runLiveChecks, fileKind, parseCookie, listingCandidates } = require('../../core/live');
const { phpIniAudit } = require('../../langs/php/runtime/checks');

const REPO = path.join(__dirname, '..', '..');

/** A deliberately misconfigured "site" under /app/. */
function startSite() {
  const requests = [];
  const server = http.createServer((req, res) => {
    requests.push({ method: req.method, url: req.url });
    const common = { server: 'Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.0.30', 'x-powered-by': 'PHP/8.0.30' };
    const send = (status, headers, body) => {
      res.writeHead(status, { ...common, ...headers });
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const origin = req.headers.origin;
    const cors = origin ? { 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true' } : {};
    switch (req.url) {
      case '/app':
        return send(301, { location: '/app/' }, '');
      case '/app/':
        return send(200, { 'content-type': 'text/html; charset=UTF-8', 'set-cookie': ['PHPSESSID=abc123; path=/', 'theme=dark; path=/; SameSite=Lax; HttpOnly'], ...cors },
          '<!DOCTYPE html><html><body><br />\n<b>Warning</b>:  Undefined array key "id" in <b>C:\\xampp\\htdocs\\app\\index.php</b> on line <b>3</b><br />\n<h1>Shop</h1></body></html>');
      case '/app/backup.sql':
        return send(200, { 'content-type': 'application/sql' }, '-- MySQL dump 10.13\nCREATE TABLE users (id int, password varchar(64));\nINSERT INTO users VALUES (1, \'s3cret-row\');\n');
      case '/app/.env':
        return send(200, { 'content-type': 'text/plain' }, 'APP_ENV=production\nDB_PASSWORD=live-secret-value\n');
      case '/app/composer.json':
        return send(403, { 'content-type': 'text/html' }, '<html><title>403 Forbidden</title></html>');
      case '/app/assets/':
        return send(200, { 'content-type': 'text/html' }, '<html><head><title>Index of /app/assets</title></head><body><h1>Index of /app/assets</h1></body></html>');
      default:
        return send(404, { 'content-type': 'text/html' }, '<html><body><h1>Not Found</h1><hr><address>Apache/2.4.58 (Win64) OpenSSL/3.1.3 PHP/8.0.30 Server at 127.0.0.1 Port 80</address></body></html>');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, requests, base: `http://127.0.0.1:${server.address().port}/app` }));
  });
}

const notices = () => {
  const list = [];
  return { list, add: (kind, message) => list.push({ kind, message }) };
};

test('targets: local and private networks only, unless --allow-remote', async () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.20.0.5', '192.168.1.10', '::1', 'fd12:3456::1', '::ffff:127.0.0.1']) assert.ok(isLocalAddress(ip), ip);
  for (const ip of ['8.8.8.8', '169.254.169.254', '172.32.0.1', '100.64.0.1', 'fe80::1', '2001:db8::1']) assert.ok(!isLocalAddress(ip), ip);

  const remote = await resolveTarget('http://93.184.216.34/');
  assert.strictEqual(remote.ok, false);
  assert.match(remote.reason, /--allow-remote/);
  assert.strictEqual((await resolveTarget('http://93.184.216.34/', { allowRemote: true })).ok, true);
  assert.strictEqual((await resolveTarget('http://169.254.169.254/latest/')).ok, false, 'cloud metadata addresses are refused');
  assert.strictEqual((await resolveTarget('ftp://127.0.0.1/')).ok, false);
  assert.strictEqual((await resolveTarget('http://user:pw@127.0.0.1/')).ok, false);
  assert.strictEqual((await resolveTarget('not a url')).ok, false);
  const viaDns = await resolveTarget('http://intranet.test/app', { lookup: async () => [{ address: '192.168.10.20', family: 4 }] });
  assert.strictEqual(viaDns.ok, true);
  assert.strictEqual(viaDns.address, '192.168.10.20', 'the vetted address is pinned for the connection');
  assert.strictEqual(viaDns.url.href, 'http://intranet.test/app/');
  const rebinding = await resolveTarget('http://evil.test/', { lookup: async () => [{ address: '127.0.0.1', family: 4 }, { address: '8.8.8.8', family: 4 }] });
  assert.strictEqual(rebinding.ok, false, 'every resolved address must be local');
  assert.strictEqual(normalizeBase(new URL('http://localhost/app/index.php?x=1')).href, 'http://localhost/app/');
});

test('the live client only sends GET and HEAD, only to the checked host, within its budget', async () => {
  const { server, requests, base } = await startSite();
  try {
    const target = await resolveTarget(base);
    const client = new LiveClient({ target, maxRequests: 3, minIntervalMs: 0 });
    await assert.rejects(client.fetch(target.url.href, { method: 'POST' }), /only send GET and HEAD/);
    await assert.rejects(client.fetch(target.url.href, { method: 'PUT' }), /only send GET and HEAD/);
    await assert.rejects(client.fetch('http://example.com/'), /stay on 127\.0\.0\.1/);
    assert.strictEqual((await client.fetch(target.url.href)).status, 200);
    assert.strictEqual((await client.fetch(target.url.href, { method: 'HEAD' })).status, 200);
    assert.strictEqual((await client.fetch(`${target.url.href}x`)).status, 404);
    assert.strictEqual(await client.fetch(target.url.href), null, 'requests beyond the budget are not sent');
    assert.deepStrictEqual(requests.map((r) => r.method), ['GET', 'HEAD', 'GET']);
  } finally {
    server.close();
  }
});

test('live checks find headers, cookies, CORS, versions, errors, files and listings without copying content', async () => {
  const { server, requests, base } = await startSite();
  try {
    const n = notices();
    const project = { files: ['index.php', 'backup.sql', '.env', 'composer.json', 'assets/js/app.js', 'includes/db.php', 'includes/index.php'].map((rel) => ({ rel })) };
    const res = await runLiveChecks({ url: base, project, exposed: ['backup.sql', '.env', 'composer.json'], pages: [], notices: n, clientOptions: { minIntervalMs: 0 } });
    const rules = res.hits.map((h) => h.ruleId).sort();
    assert.deepStrictEqual(rules, ['LIVE-COOKIE-001', 'LIVE-CORS-001', 'LIVE-ERR-001', 'LIVE-HDR-001', 'LIVE-INFO-001']);
    assert.strictEqual(res.hits.find((h) => h.ruleId === 'LIVE-CORS-001').severity, 'high');
    const cookie = res.hits.find((h) => h.ruleId === 'LIVE-COOKIE-001');
    assert.match(cookie.message, /"PHPSESSID"/);
    assert.strictEqual(cookie.severity, 'medium');
    assert.ok(!res.hits.some((h) => /"theme"/.test(h.message)), 'a cookie with HttpOnly and SameSite is fine on HTTP');
    assert.match(res.hits.find((h) => h.ruleId === 'LIVE-INFO-001').message, /Apache\/2\.4\.58/);
    assert.deepStrictEqual(res.confirmedFiles.map((c) => [c.file, c.kind, c.severity]).sort(), [['.env', 'env', 'critical'], ['backup.sql', 'dump', 'critical']]);
    assert.deepStrictEqual(res.listings.map((l) => l.dir), ['assets'], 'only folders without an index page are tried');
    assert.strictEqual(res.info.php, '8.0.30');
    assert.ok(requests.every((r) => r.method === 'GET' || r.method === 'HEAD'), 'only GET and HEAD');
    assert.ok(requests.length <= 60);
    assert.deepStrictEqual(res.info.methods, ['GET']);
    const everything = JSON.stringify(res);
    for (const secret of ['live-secret-value', 's3cret-row', 'abc123']) assert.ok(!everything.includes(secret), `response content (${secret}) never reaches the results`);
  } finally {
    server.close();
  }
});

test('helpers: file kinds, cookies and listing candidates', () => {
  assert.strictEqual(fileKind('.git/HEAD'), 'git');
  assert.strictEqual(fileKind('config/.env.production'), 'env');
  assert.strictEqual(fileKind('db/backup.sql.gz'), 'dump');
  assert.strictEqual(fileKind('config.php.bak'), 'backup');
  assert.strictEqual(fileKind('phpinfo.php'), 'phpinfo');
  assert.deepStrictEqual(parseCookie('PHPSESSID=x; path=/; HttpOnly; SameSite=Strict'), { name: 'PHPSESSID', httpOnly: true, secure: false, sameSite: 'Strict', deleted: false });
  assert.strictEqual(parseCookie('a=deleted; expires=Thu, 01 Jan 1970 00:00:01 GMT').deleted, true);
  const dirs = listingCandidates([{ rel: 'index.php' }, { rel: 'uploads/a.jpg' }, { rel: 'admin/index.php' }, { rel: 'admin/lib/x.php' }, { rel: '.git/config' }], 5);
  assert.deepStrictEqual(dirs, ['uploads', 'admin/lib']);
});

test('php.ini audit: development settings are reported, production settings are not', () => {
  const xampp = {
    display_errors: '1', display_startup_errors: '1', log_errors: '1', expose_php: '1', allow_url_include: '', allow_url_fopen: '1',
    'session.cookie_httponly': '', 'session.cookie_secure': '0', 'session.cookie_samesite': '', 'session.use_strict_mode': '0',
    'session.use_only_cookies': '1', 'session.use_trans_sid': '0', open_basedir: null, disable_functions: '', enable_dl: '', 'zend.assertions': '1',
  };
  const hits = phpIniAudit(xampp, 'C:\\xampp\\php\\php.ini');
  assert.deepStrictEqual(hits.map((h) => h.ruleId), ['PHP-INI-001', 'PHP-INI-003', 'PHP-INI-004', 'PHP-INI-005']);
  assert.strictEqual(hits.find((h) => h.ruleId === 'PHP-INI-004').severity, 'medium');
  assert.match(hits[0].message, /C:\\xampp\\php\\php\.ini/);

  const production = {
    display_errors: 'Off', display_startup_errors: '0', log_errors: '1', expose_php: '0', allow_url_include: '0', allow_url_fopen: '0',
    'session.cookie_httponly': '1', 'session.cookie_secure': '1', 'session.cookie_samesite': 'Lax', 'session.use_strict_mode': '1',
    'session.use_only_cookies': '1', 'session.use_trans_sid': '0', open_basedir: '/var/www/:/tmp/', disable_functions: 'exec,system,shell_exec,passthru,proc_open,popen', enable_dl: '0', 'zend.assertions': '-1',
  };
  assert.deepStrictEqual(phpIniAudit(production, '/etc/php/8.4/fpm/php.ini'), []);
  assert.deepStrictEqual(phpIniAudit({ ...production, allow_url_include: 'On' }, null).map((h) => h.ruleId), ['PHP-INI-002']);
});

function run(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(REPO, 'main.js'), ...args], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => resolve({ code, out, err }));
  });
}

test('end to end: --url confirms static findings and adds live findings (GET/HEAD only)', async () => {
  const { server, requests, base } = await startSite();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-live-'));
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-live-out-'));
  try {
    fs.writeFileSync(path.join(root, 'index.php'), '<?php\necho "Shop";\n');
    fs.writeFileSync(path.join(root, 'backup.sql'), '-- MySQL dump\nCREATE TABLE users (id int);\n');
    fs.writeFileSync(path.join(root, '.env'), 'APP_ENV=production\n');
    fs.mkdirSync(path.join(root, 'assets'));
    fs.writeFileSync(path.join(root, 'assets', 'app.js'), 'console.log(1);\n');
    const r = await run(['--path', root, '--url', base, '--format', 'json,sarif', '--out', out, '--no-db', '--php-bin', '', '--quiet', '--no-color']);
    assert.strictEqual(r.code, 0, r.err);
    const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
    const backup = report.findings.find((f) => f.ruleId === 'PHP-FILE-001' && f.file === 'backup.sql');
    assert.strictEqual(backup.severity, 'critical', 'a downloadable dump becomes critical');
    assert.match(backup.message, /Confirmed by the live check/);
    assert.ok(backup.url.endsWith('/app/backup.sql'));
    const rules = new Set(report.findings.map((f) => f.ruleId));
    for (const id of ['LIVE-HDR-001', 'LIVE-CORS-001', 'LIVE-COOKIE-001', 'LIVE-INFO-001', 'LIVE-ERR-001']) assert.ok(rules.has(id), id);
    assert.ok(rules.has('PHP-COMP-001'), 'without a PHP binary, the PHP version from the web server is checked');
    assert.deepStrictEqual(report.environment.live.methods.filter((m) => m !== 'GET' && m !== 'HEAD'), []);
    assert.ok(requests.every((q) => q.method === 'GET' || q.method === 'HEAD'));
    const sarif = JSON.parse(fs.readFileSync(path.join(out, 'report.sarif'), 'utf8'));
    assert.ok(sarif.runs[0].results.some((x) => x.properties.url && x.ruleId === 'LIVE-CORS-001'));

    const refused = await run(['--path', root, '--url', 'http://93.184.216.34/', '--format', 'json', '--out', out, '--no-db', '--php-bin', '', '--quiet', '--no-color']);
    assert.strictEqual(refused.code, 0);
    const again = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
    assert.ok(again.notices.some((x) => /Live checks skipped: .*--allow-remote/.test(x.message)));
    assert.ok(!again.findings.some((f) => /^LIVE-/.test(f.ruleId)));
  } finally {
    server.close();
  }
});
