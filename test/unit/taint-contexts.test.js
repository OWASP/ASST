'use strict';
const test = require('node:test');
const assert = require('assert');
const V = require('../../core/taint/value');
const ctx = require('../../core/taint/contexts');
const { allowlist, replaceEffect } = require('../../langs/php/taint/regex');
const { analyzeFile } = require('../../langs/php/taint');

const src = () => V.source('src', '$_GET[x]', 1);
const q = (...parts) => V.concat(parts.map((p) => (typeof p === 'string' ? V.constant(p) : p)));

test('SQL context: quoting and escaping decide safety', () => {
  const escaped = V.sanitize(src(), { enc: { sql: true } }, 1, 'escape');
  assert.strictEqual(ctx.sql(q("WHERE a='", escaped, "'")).length, 0, 'escaped value inside quotes is safe');
  assert.strictEqual(ctx.sql(q('WHERE a=', escaped)).length, 1, 'escaped value without quotes is still injectable');
  assert.strictEqual(ctx.sql(q('LIMIT ', V.sanitize(src(), { allowed: '0123456789' }, 1, 'digits'))).length, 0);
  assert.strictEqual(ctx.sql(q("WHERE a='", V.sanitize(src(), { removeChars: "'" }, 1, 'strip'), "'")).length, 0);
});

test('HTML context: encoding is enough for text and quoted attributes only', () => {
  const enc = V.sanitize(src(), { enc: { html: true, htmlQuotes: true } }, 1, 'htmlspecialchars');
  const run = (...parts) => ctx.html(q(...parts), ctx.initialHtmlState()).unsafe.length;
  assert.strictEqual(run('<p>', enc, '</p>'), 0);
  assert.strictEqual(run('<a title="', enc, '">'), 0);
  assert.strictEqual(run('<a title=', enc, '>'), 1, 'unquoted attribute');
  assert.strictEqual(run('<div onclick="x(\'', enc, '\')">'), 1, 'event handler: entities are decoded before JS runs');
  assert.strictEqual(run('<script>var s = \'', enc, '\';</script>'), 0, 'JS string in a script block');
  assert.strictEqual(run('<script>setTimeout(\'', enc, '\');</script>'), 1, 'string executed as code');
  assert.strictEqual(run('<a href="', enc, '">'), 1, 'javascript: URLs survive HTML encoding');
  assert.strictEqual(run('<', enc, ' x>'), 1, 'tag name position');
  assert.strictEqual(run('<p>', src(), '</p>'), 1);
});

test('shell, LDAP and path contexts', () => {
  assert.strictEqual(ctx.shell(q('ls ', V.sanitize(src(), { enc: { shell: true } }, 1, 'escapeshellarg'))).length, 0);
  assert.strictEqual(ctx.shell(q("ls '", V.sanitize(src(), { enc: { sql: true } }, 1, 'addslashes'), "'")).length, 1, 'addslashes does not protect shell strings');
  assert.strictEqual(ctx.ldap(q('(uid=', V.sanitize(src(), { enc: { ldap: true } }, 1, 'ldap_escape'), ')')).length, 0);
  assert.strictEqual(ctx.path(q('uploads/', V.sanitize(src(), { removeChars: '/\\' }, 1, 'basename'))).length, 0);
  assert.strictEqual(ctx.path(q('uploads/', src())).length, 1);
});

test('regex analysis of allow-lists and replacements', () => {
  assert.strictEqual(allowlist('/^[a-z0-9_]+$/i').includes('Z'), true);
  assert.strictEqual(allowlist('/^[a-z]+$/').includes("'"), false);
  assert.strictEqual(allowlist('/[a-z]+/'), null, 'unanchored pattern is not an allow-list');
  assert.strictEqual(allowlist('/^.*$/'), null);
  assert.deepStrictEqual(replaceEffect("/'/", ''), { removeChars: "'" });
  assert.ok(replaceEffect('/[^a-zA-Z0-9]/', '').allowed.includes('7'));
  assert.ok(replaceEffect('/\\W/si', '').allowed.includes('_'));
  assert.strictEqual(replaceEffect('/x/', 'y'), null);
});

test('interpreter: control flow, guards and reachability', () => {
  const hits = (code, opts) => analyzeFile(`<?php\n${code}`, 'x.php', opts).hits.map((h) => `${h.rule}@${h.line}`);
  assert.deepStrictEqual(hits("$a = $_GET['a'];\nif (!ctype_digit($a)) { exit; }\necho $a;"), []);
  assert.deepStrictEqual(hits("$a = $_GET['a'];\nif ($x) { $a = 'safe'; }\necho $a;"), ['PHP-XSS-001@4']);
  assert.deepStrictEqual(hits("$a = $_GET['a'];\nexit;\necho $a;"), []);
  assert.deepStrictEqual(hits("$a = $_GET['a'] == 'x' ? 'one' : 'two';\necho $a;"), []);
  assert.deepStrictEqual(hits("class In { private $v; function __construct() { $this->v = $_GET['v']; } function get() { return $this->v; } }\n$i = new In();\nsystem('ls ' . $i->get());"), ['PHP-CMDI-001@4']);
  assert.deepStrictEqual(hits("$q = sprintf(\"SELECT * FROM t WHERE id=%d\", $_GET['id']);\nmysqli_query($c, $q);"), []);
  assert.deepStrictEqual(hits("$s = $_SESSION['x'];\nmysqli_query($c, \"SELECT $s\");"), [], 'session data is not a source by default');
  assert.deepStrictEqual(hits("$s = $_SESSION['x'];\nmysqli_query($c, \"SELECT $s\");", { secondOrder: true }), ['PHP-SQLI-001@3']);
});
