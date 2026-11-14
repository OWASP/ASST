'use strict';
/*
 * End-to-end check of the PHP analysis against the annotated fixture corpus:
 * every "@expect CWE-x" must be reported on its line, and *.safe.* files must be clean.
 */
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { loadExpectations } = require('../helpers/expectations');

const REPO = path.resolve(__dirname, '..', '..');

function scan(dir, extra = []) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-fixture-scan-'));
  const r = spawnSync(process.execPath, [path.join(REPO, 'main.js'), '--path', dir, '--format', 'json', '--out', out, '--no-db', '--php-bin', '', '--quiet', '--no-color', ...extra], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
  fs.rmSync(out, { recursive: true, force: true });
  return report;
}

function checkCorpus(dir) {
  const truth = loadExpectations(dir);
  const report = scan(dir);
  const missing = truth.expectations.filter((e) => !report.findings.some((f) => f.file === e.file && f.line === e.line && e.cwes.includes(f.cwe)));
  const inSafe = report.findings.filter((f) => f.file && /\.safe\.[^/]+$/.test(f.file));
  return { truth, report, missing, inSafe };
}

test('every annotated sink in the PHP fixture corpus is reported', () => {
  const { missing } = checkCorpus(path.join(REPO, 'test', 'fixtures', 'php'));
  assert.deepStrictEqual(missing.map((m) => `${m.file}:${m.line} ${m.cwes.join('|')}`), []);
});

test('safe fixtures produce no findings at the default threshold', () => {
  const { inSafe } = checkCorpus(path.join(REPO, 'test', 'fixtures', 'php'));
  assert.deepStrictEqual(inSafe.map((f) => `${f.file}:${f.line} ${f.ruleId}`), []);
});

test('vulnerable sample application: line, file and project level expectations', () => {
  const dir = path.join(REPO, 'test', 'fixtures', 'php-vulnerable-app');
  const { truth, report, missing } = checkCorpus(dir);
  assert.deepStrictEqual(missing.map((m) => `${m.file}:${m.line}`), []);
  for (const e of truth.fileLevel) assert.ok(report.findings.some((f) => f.file === e.file && e.cwes.includes(f.cwe)), `${e.file} ${e.cwes}`);
  for (const cwe of truth.projectLevel) assert.ok(report.findings.some((f) => f.cwe === cwe), `project-level ${cwe}`);
  assert.strictEqual(report.schema, 'asst-report/1');
  const sqli = report.findings.find((f) => f.ruleId === 'PHP-SQLI-001');
  assert.ok(sqli.trace.length >= 1 && /\$_POST/.test(sqli.trace[0].note), 'taint trace starts at the request source');
  assert.ok(sqli.snippet && sqli.snippet.lines.length > 0, 'code snippet included');
});

test('hardened sample application has no medium or higher findings', () => {
  const report = scan(path.join(REPO, 'test', 'fixtures', 'php-safe-app'), ['--min-severity', 'medium']);
  assert.deepStrictEqual(report.findings.map((f) => `${f.file}:${f.line} ${f.ruleId}`), []);
});

test('--fail-on sets a non-zero exit code for CI', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-failon-'));
  const r = spawnSync(process.execPath, [path.join(REPO, 'main.js'), '--path', path.join(REPO, 'test', 'fixtures', 'php-vulnerable-app'), '--format', 'json', '--out', out, '--no-db', '--php-bin', '', '--quiet', '--fail-on', 'critical'], { encoding: 'utf8' });
  fs.rmSync(out, { recursive: true, force: true });
  assert.strictEqual(r.status, 1);
});

test('cross-file analysis: includes, define() paths, helpers in other files', () => {
  const dir = path.join(REPO, 'test', 'fixtures', 'php-crossfile');
  const { report, missing } = checkCorpus(dir);
  assert.deepStrictEqual(missing.map((m) => `${m.file}:${m.line} ${m.cwes.join('|')}`), []);
  const xss = report.findings.filter((f) => f.ruleId === 'PHP-XSS-001');
  assert.deepStrictEqual(xss.map((f) => `${f.file}:${f.line}`), ['view.php:4'], 'e() from another file is recognized as escaping');
  const sqli = report.findings.find((f) => f.ruleId === 'PHP-SQLI-001');
  assert.strictEqual(sqli.file, 'lib/helpers.php');
  assert.ok(sqli.entryPoints.includes('index.php'), 'sink in a helper is linked to the entry script');
  const cmd = report.findings.find((f) => f.ruleId === 'PHP-CMDI-001');
  assert.ok(cmd && cmd.trace.some((t) => /\$_GET\['dir'\]/.test(t.note)), 'value set in an included file reaches the sink');
});

for (const [name, framework] of [['laravel', 'Laravel'], ['wordpress-plugin', 'WordPress'], ['symfony', 'Symfony/Twig']]) {
  test(`framework pack: ${framework}`, () => {
    const dir = path.join(REPO, 'test', 'fixtures', name);
    const { truth, report, missing } = checkCorpus(dir);
    assert.deepStrictEqual(missing.map((m) => `${m.file}:${m.line} ${m.cwes.join('|')}`), []);
    for (const e of truth.fileLevel) assert.ok(report.findings.some((f) => f.file === e.file && e.cwes.includes(f.cwe)), `${e.file} ${e.cwes}`);
    assert.ok(report.environment.frameworks && Object.prototype.hasOwnProperty.call(report.environment.frameworks, framework), `${framework} detected`);
    const unexpected = report.findings.filter((f) => f.file && f.line && ['PHP-SQLI-001', 'PHP-XSS-001', 'PHP-XSS-002', 'PHP-REDIR-001', 'PHP-CSRF-001'].includes(f.ruleId) &&
      !truth.expectations.some((e) => e.file === f.file && e.line === f.line));
    assert.deepStrictEqual(unexpected.map((f) => `${f.file}:${f.line} ${f.ruleId}`), [], 'no findings on protected code');
  });
}
