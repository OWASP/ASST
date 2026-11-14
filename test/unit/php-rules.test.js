'use strict';
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parsePhp } = require('../../langs/php/taint/parse');
const { runAstRules } = require('../../langs/php/rules/ast-rules');
const { htaccessRules, exposedFiles } = require('../../langs/php/rules/project-rules');
const { csrfForms, domRules, httpUrls } = require('../../langs/php/rules/text-rules');
const { classifyPassword } = require('../../langs/php/runtime/checks');
const { lifecycle } = require('../../core/lifecycle');
const { RULES } = require('../../langs/php/rules/registry');
const html = require('../../core/report/html');

const ast = (code) => parsePhp(`<?php\n${code}`).ast;
const ruleIds = (code) => runAstRules(ast(code)).map((h) => `${h.ruleId}@${h.line}`);

test('execution after redirect is reported only when code keeps running', () => {
  assert.deepStrictEqual(ruleIds("if (!$ok) { header('Location: /login'); }\necho 'secret';"), ['PHP-EAR-001@2']);
  assert.deepStrictEqual(ruleIds("if (!$ok) { header('Location: /login'); exit; }\necho 'secret';"), []);
  assert.deepStrictEqual(ruleIds("header('Location: /login');\ndie;"), []);
  assert.deepStrictEqual(ruleIds("function go() { header('Location: /x'); }"), []);
  assert.deepStrictEqual(ruleIds("header('Content-Type: text/plain');\necho 'x';"), []);
});

test('cryptography, configuration and secrets rules', () => {
  assert.deepStrictEqual(ruleIds("$h = md5($_POST['password']);"), ['PHP-CRYPTO-001@2']);
  assert.deepStrictEqual(ruleIds('$h = md5($file_contents);'), []);
  assert.deepStrictEqual(ruleIds('$token = sha1(mt_rand());'), ['PHP-CRYPTO-002@2']);
  assert.deepStrictEqual(ruleIds('$token = bin2hex(random_bytes(16));'), []);
  assert.deepStrictEqual(ruleIds("if ($hash == $_COOKIE['hash']) {}"), ['PHP-CRYPTO-003@2']);
  assert.deepStrictEqual(ruleIds("if ($hash === null) {}"), []);
  assert.deepStrictEqual(ruleIds("ini_set('display_errors', 1);"), ['PHP-CONF-001@2']);
  assert.deepStrictEqual(ruleIds("ini_set('display_errors', '0');"), []);
  assert.deepStrictEqual(ruleIds("$r = mysqli_query($c, $q) or die(mysqli_error($c));"), ['PHP-ERR-001@2']);
  assert.deepStrictEqual(ruleIds("$d->loadXML($x, LIBXML_NOENT | LIBXML_DTDLOAD);"), ['PHP-XXE-001@2']);
  assert.deepStrictEqual(ruleIds("$c = mysqli_connect('db', 'app', 'Sup3r-Secret');"), ['PHP-SECRET-001@2']);
  assert.deepStrictEqual(ruleIds("$c = mysqli_connect('localhost', 'root', '');"), []);
  assert.deepStrictEqual(ruleIds("$c = new PDO($dsn, $u, getenv('DB_PASS'));"), []);
});

test('session fixation requires a login without session_regenerate_id', () => {
  const login = "if (password_verify($_POST['pw'], $row['hash'])) {\n$_SESSION['user_id'] = $row['id'];\n}";
  assert.deepStrictEqual(ruleIds(login), ['PHP-AUTH-001@3']);
  assert.deepStrictEqual(ruleIds(`session_regenerate_id(true);\n${login}`), []);
});

test('templates: CSRF forms, DOM XSS and plain HTTP', () => {
  const file = (name) => ({ name, ext: name.split('.').pop(), rel: name });
  assert.strictEqual(csrfForms(file('a.php'), '<form method="POST" action="x">\n<input name="q"></form>').length, 1);
  assert.strictEqual(csrfForms(file('a.php'), '<form method="post"><input type="hidden" name="csrf_token" value="1"></form>').length, 0);
  assert.strictEqual(csrfForms(file('a.blade.php'), '<form method="post">@csrf</form>').length, 0);
  assert.strictEqual(csrfForms(file('a.php'), '<form action="search"></form>').length, 0, 'GET forms need no token');
  assert.strictEqual(domRules(file('a.js'), "el.innerHTML = '<b>static</b>';").length, 0);
  assert.strictEqual(domRules(file('a.js'), 'var n = location.hash;\nel.innerHTML = n;').length, 1);
  assert.strictEqual(httpUrls(file('a.php'), ['<script src="http://cdn.evil.test/x.js">', '<svg xmlns="http://www.w3.org/2000/svg">', '<a href="http://partner.com/">']).length, 1);
});

test('.htaccess hardening and exposed files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-hta-'));
  try {
    const project = { root, files: [{ rel: 'dump.sql', name: 'dump.sql' }, { rel: 'robots.txt', name: 'robots.txt' }], skipped: [{ rel: '.git', reason: 'vcs' }] };
    assert.deepStrictEqual(htaccessRules(project, { usesPhp: true }).map((h) => h.ruleId), ['PHP-HTA-001', 'PHP-HTA-002']);
    fs.writeFileSync(path.join(root, '.htaccess'), 'Options -Indexes\nRewriteEngine On\nRewriteCond %{HTTPS} off\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\n');
    assert.deepStrictEqual(htaccessRules(project, { usesPhp: true }), []);
    assert.deepStrictEqual(exposedFiles(project).map((h) => h.ruleId).sort(), ['PHP-FILE-001', 'PHP-FILE-002']);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('stored passwords are classified by format, never by reading the hash', () => {
  assert.strictEqual(classifyPassword({ prefix: '$2y$10$', length: 60 }).ok, true);
  assert.strictEqual(classifyPassword({ prefix: '$argon2', length: 97 }).ok, true);
  assert.strictEqual(classifyPassword({ prefix: '5f4dcc3', length: 32 }).kind, 'MD5');
  assert.strictEqual(classifyPassword({ prefix: 'e38ad21', length: 64 }).kind, 'SHA-256');
  assert.strictEqual(classifyPassword({ prefix: 'hunter2', length: 7 }).rule, 'PHP-DB-001');
});

test('lifecycle data marks end-of-life runtimes', () => {
  const day = new Date('2026-11-13T00:00:00Z');
  assert.strictEqual(lifecycle('php', '8.0.30', day).status, 'eol');
  assert.strictEqual(lifecycle('php', '8.2.10', day).status, 'security-only');
  assert.strictEqual(lifecycle('php', '8.4.1', day).status, 'supported');
  assert.strictEqual(lifecycle('mysql', '8.0.35', day).status, 'eol');
  assert.strictEqual(lifecycle('mariadb', '10.11.6', day).status, 'supported');
});

test('rule registry is complete and maps to OWASP 2025', () => {
  for (const r of RULES) {
    assert.match(r.category, /^A(0[1-9]|10):2025$/, r.id);
    assert.match(r.cwe, /^CWE-\d+$/, r.id);
    assert.ok(['critical', 'high', 'medium', 'low', 'info'].includes(r.severity), r.id);
    assert.ok(r.pdf && fs.existsSync(path.join(__dirname, '..', '..', r.pdf)), `${r.id} PDF guide exists`);
  }
});

test('HTML report escapes file names and code', () => {
  const model = {
    asstRoot: path.join(__dirname, '..', '..'),
    tool: { version: 't' },
    scan: { root: '/x', finishedAt: new Date().toISOString(), filesScanned: 1 },
    summary: { total: 1, bySeverity: { high: 1 }, hidden: 0, suppressed: 0 },
    environment: {},
    notices: [],
    findings: [{ ruleId: 'R', title: '<b>t</b>', category: 'A05:2025', cwe: 'CWE-79', severity: 'high', confidence: 'high',
      file: '"><img src=x onerror=alert(1)>.php', line: 1, message: '<script>alert(1)</script>', trace: [{ line: 1, note: '<i>' }],
      snippet: { startLine: 1, lines: ['<?php echo "</script><script>alert(2)</script>";'] }, pdf: null }],
  };
  const out = html.render(model);
  assert.ok(!/<img src=x/.test(out) && !/<script>alert/.test(out) && !/<b>t<\/b>/.test(out));
  assert.match(out, /&lt;script&gt;alert\(1\)/);
});

test('every rule links to an existing guide section', () => {
  const { loadGuides, pickGuides } = require('../../core/guides');
  const guides = loadGuides(path.join(__dirname, '..', '..', 'langs', 'php', 'guides'));
  for (const r of RULES) assert.ok(guides.has(r.guide), `${r.id} -> ${r.guide}`);
  for (const n of require('../../langs/php/notices')) assert.ok(guides.has(n.guide), `notice -> ${n.guide}`);
  const picked = pickGuides(guides, ['injection#sql-injection']);
  assert.match(picked['injection#sql-injection'].html, /<pre><code class="language-php">/);
  assert.match(picked['injection#sql-injection'].html, /target="_blank" rel="noopener noreferrer"/);
});
