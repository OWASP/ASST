'use strict';
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parseArgs, CliError, helpText } = require('../../core/cli');
const { walkProject, globToRegExp } = require('../../core/walker');
const { FileCache } = require('../../core/file-cache');
const { createFinding, dedupe, compareFindings, atLeastSeverity, atLeastConfidence, fingerprint } = require('../../core/finding');
const ansi = require('../../core/ansi');
const { runFile } = require('../../core/shell');

function tmpTree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-tree-'));
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return root;
}

test('cli parses long, short, inline and repeatable options', () => {
  const o = parseArgs(['--path', '../Shop', '-f', 'html,json', '--fail-on=high', '-x', 'a/**', '--exclude', 'b', '--no-db', '--no-color', '--php-bin', '']);
  assert.deepStrictEqual(o, { path: '../Shop', format: 'html,json', failOn: 'high', exclude: ['a/**', 'b'], noDb: true, color: false, phpBin: '' });
  assert.throws(() => parseArgs(['--bogus']), CliError);
  assert.throws(() => parseArgs(['stray']), CliError);
  assert.throws(() => parseArgs(['--path']), /needs a value/);
  assert.match(helpText('2.0.0'), /--fail-on/);
});

test('walker skips VCS and dependency folders, honours excludes and ASST itself', () => {
  const root = tmpTree({
    'index.php': '<?php echo 1;',
    'vendor/lib/x.php': '<?php',
    'node_modules/m/i.js': '',
    '.git/HEAD': 'ref',
    'tests/a.php': '<?php',
    'ASST/main.js': '',
    'src/Deep/File.PHP': '<?php',
  });
  try {
    const r = walkProject(root, { exclude: ['tests/**'], skipPaths: [path.join(root, 'ASST')] });
    assert.deepStrictEqual(r.files.map((f) => f.rel), ['index.php', 'src/Deep/File.PHP']);
    assert.strictEqual(r.files[1].ext, 'php');
    const reasons = Object.fromEntries(r.skipped.map((s) => [s.rel, s.reason]));
    assert.strictEqual(reasons.vendor, 'dependencies');
    assert.strictEqual(reasons['.git'], 'vcs');
    assert.strictEqual(reasons.ASST, 'asst');
    const withVendor = walkProject(root, { includeVendor: true, skipPaths: [path.join(root, 'ASST')] });
    assert.ok(withVendor.files.some((f) => f.rel === 'vendor/lib/x.php'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('glob patterns match basenames anywhere and anchored paths', () => {
  assert.ok(globToRegExp('*.min.js').test('assets/js/app.min.js'));
  assert.ok(globToRegExp('tests/**').test('tests/unit/a.php'));
  assert.ok(!globToRegExp('tests/**').test('src/tests.php'));
  assert.ok(globToRegExp('cache/').test('var/cache'));
});

test('file cache reads once, strips BOM/CR and flags binary files', () => {
  const root = tmpTree({ 'a.php': '﻿<?php\r\necho 1;\r\n', 'b.bin': Buffer.from([0x50, 0x00, 0x51]) });
  try {
    const cache = new FileCache();
    const a = path.join(root, 'a.php');
    assert.deepStrictEqual(cache.lines(a), ['<?php', 'echo 1;', '']);
    cache.lines(a);
    assert.strictEqual(cache.reads, 1);
    assert.strictEqual(cache.line(a, 2), 'echo 1;');
    assert.strictEqual(cache.get(path.join(root, 'b.bin')).binary, true);
    assert.strictEqual(new FileCache({ maxBytes: 3 }).get(a).tooLarge, true);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('finding model validates, orders and dedupes', () => {
  const base = { ruleId: 'PHP-X', title: 'X', message: 'm', severity: 'high', file: 'a.php', line: 3 };
  assert.throws(() => createFinding({ ...base, severity: 'urgent' }));
  const a = createFinding({ ...base, trace: [1, 2] });
  const b = createFinding({ ...base, trace: [1] });
  const c = createFinding({ ...base, severity: 'critical', line: 9 });
  assert.strictEqual(dedupe([a, b]).length, 1);
  assert.strictEqual(dedupe([a, b])[0].trace.length, 1);
  assert.deepStrictEqual([b, c].sort(compareFindings).map((f) => f.severity), ['critical', 'high']);
  assert.ok(atLeastSeverity('critical', 'high') && !atLeastSeverity('low', 'medium'));
  assert.ok(atLeastConfidence('high', 'medium') && !atLeastConfidence('low', 'medium'));
  assert.strictEqual(fingerprint('R', 'a.php', '  echo  $x; '), fingerprint('R', 'a.php', 'echo $x;'));
});

test('ansi styling can be disabled and stripped', () => {
  const was = ansi.isEnabled();
  ansi.setEnabled(true);
  const s = ansi.paint('hi', 'red', 'bold');
  assert.notStrictEqual(s, 'hi');
  assert.strictEqual(ansi.strip(s), 'hi');
  ansi.setEnabled(false);
  assert.strictEqual(ansi.paint('hi', 'red'), 'hi');
  ansi.setEnabled(was);
  assert.strictEqual(''.red, undefined, 'no String.prototype extensions');
});

test('shell helper runs without a shell and reports missing executables', () => {
  const ok = runFile(process.execPath, ['-e', 'process.stdout.write("x y")']);
  assert.deepStrictEqual(ok, { ok: true, stdout: 'x y', error: null });
  const missing = runFile(path.join(os.tmpdir(), 'definitely-missing-binary-asst'), ['-v']);
  assert.strictEqual(missing.ok, false);
  assert.match(missing.error, /not found/);
  assert.strictEqual(runFile('', []).ok, false);
});
