'use strict';
const test = require('node:test');
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const Ajv = require('ajv');

const REPO = path.resolve(__dirname, '..', '..');
const APP = path.join(REPO, 'test', 'fixtures', 'php-vulnerable-app');

function scan(dir, out, extra = []) {
  const r = spawnSync(process.execPath, [path.join(REPO, 'main.js'), '--path', dir, '--out', out, '--no-db', '--php-bin', '', '--quiet', '--no-color', ...extra], { encoding: 'utf8' });
  assert.ok(r.status === 0 || r.status === 1, r.stderr || r.stdout);
  return r;
}

test('all report formats are written next to each other', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-reports-'));
  try {
    scan(APP, out, ['--format', 'html,json,sarif,md']);
    for (const f of ['report.html', 'report.json', 'report.sarif', 'report.md']) assert.ok(fs.existsSync(path.join(out, f)), f);
    const md = fs.readFileSync(path.join(out, 'report.md'), 'utf8');
    assert.match(md, /## OWASP ASST security report/);
    assert.match(md, /SQL injection/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('SARIF output validates against the SARIF 2.1.0 schema', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-sarif-'));
  try {
    scan(APP, out, ['--format', 'sarif']);
    const sarif = JSON.parse(fs.readFileSync(path.join(out, 'report.sarif'), 'utf8'));
    const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false, logger: false });
    const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(REPO, 'test', 'schemas', 'sarif-schema-2.1.0.json'), 'utf8')));
    assert.ok(validate(sarif), JSON.stringify(validate.errors && validate.errors.slice(0, 5)));
    const run = sarif.runs[0];
    assert.strictEqual(run.tool.driver.name, 'OWASP ASST');
    const sqli = run.results.find((r) => r.ruleId === 'PHP-SQLI-001');
    assert.ok(sqli.locations[0].physicalLocation.region.startLine > 0);
    assert.ok(sqli.partialFingerprints['asst/v1']);
    const rule = run.tool.driver.rules[sqli.ruleIndex];
    assert.strictEqual(rule.id, 'PHP-SQLI-001');
    assert.ok(Number(rule.properties['security-severity']) >= 7);
    assert.ok(rule.properties.tags.includes('CWE-89'));
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('HTML report: inline script is allowed only by its hash', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-html-'));
  try {
    scan(APP, out, ['--format', 'html']);
    const html = fs.readFileSync(path.join(out, 'report.html'), 'utf8');
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)[1];
    const hash = crypto.createHash('sha256').update(script).digest('base64');
    assert.ok(html.includes(`script-src 'sha256-${hash}'`));
    assert.ok(!/https?:\/\/(?!cwe\.mitre\.org|github\.com)[^"' ]+\.(js|css)/.test(html), 'no external scripts or styles');
    assert.match(html, /data-sev="critical"/);
    assert.match(html, /A05:2025 Injection/);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('baseline: findings are marked new/unchanged and fixed ones are listed', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-baseline-'));
  try {
    const project = path.join(work, 'app');
    fs.cpSync(APP, project, { recursive: true });
    const baseline = path.join(work, 'asst-baseline.json');
    scan(project, path.join(work, 'out1'), ['--format', 'json', '--update-baseline', baseline]);
    assert.ok(fs.existsSync(baseline));
    fs.writeFileSync(path.join(project, 'tools', 'ping.php'), "<?php\necho 'ping disabled';\n");
    fs.writeFileSync(path.join(project, 'new.php'), "<?php\necho $_GET['x'];\n");
    scan(project, path.join(work, 'out2'), ['--format', 'json,md', '--baseline', baseline]);
    const report = JSON.parse(fs.readFileSync(path.join(work, 'out2', 'report.json'), 'utf8'));
    assert.ok(report.fixed.some((f) => f.ruleId === 'PHP-CMDI-001'), 'command injection reported as fixed');
    const added = report.findings.filter((f) => f.baseline === 'new');
    assert.deepStrictEqual(added.map((f) => `${f.file}:${f.ruleId}`), ['new.php:PHP-XSS-001']);
    assert.ok(report.findings.filter((f) => f.baseline === 'unchanged').length > 5);
    assert.match(fs.readFileSync(path.join(work, 'out2', 'report.md'), 'utf8'), /1 new/);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
});

test('asst-ignore comments suppress a finding and are counted', () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-ignore-'));
  try {
    fs.writeFileSync(path.join(work, 'a.php'), "<?php\n// asst-ignore[PHP-XSS-001] value is a fixed menu label\necho $_GET['label'];\necho $_GET['other'];\n");
    scan(work, path.join(work, 'out'), ['--format', 'json']);
    const report = JSON.parse(fs.readFileSync(path.join(work, 'out', 'report.json'), 'utf8'));
    assert.deepStrictEqual(report.findings.filter((f) => f.ruleId === 'PHP-XSS-001').map((f) => f.line), [4]);
    assert.strictEqual(report.summary.suppressed, 1);
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
});
