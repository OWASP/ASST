'use strict';
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { runRules } = require('../../core/rule-engine');
const { parseInline, applyInlineSuppressions, writeBaseline, loadBaseline, compareWithBaseline } = require('../../core/suppress');
const { LegacyCore } = require('../../core/legacy');
const { FileCache } = require('../../core/file-cache');
const { walkProject } = require('../../core/walker');

function ctxFor(files) {
  const lines = Object.fromEntries(Object.entries(files).map(([k, v]) => [k, v.split('\n')]));
  return {
    files: Object.keys(files).map((rel) => ({ rel, name: path.basename(rel), ext: path.extname(rel).slice(1) })),
    linesOf: (rel) => lines[rel],
    textOf: (rel) => files[rel],
    lineOf: (rel, n) => (lines[rel] || [])[n - 1] || '',
  };
}

const META = { title: 'T', category: 'A05:2025', cwe: 'CWE-95', severity: 'critical', confidence: 'high', message: 'msg' };

test('rule engine runs line, file and project rules', () => {
  const ctx = ctxFor({ 'a.php': '<?php\neval($x);\n// eval($y);', 'b.js': 'eval(1)' });
  const rules = [
    { ...META, id: 'L1', kind: 'line', extensions: ['php'], pattern: /\beval\s*\(/, unless: /^\s*\/\// },
    { ...META, id: 'F1', kind: 'file', extensions: ['js'], check: (f) => (f.text.includes('eval') ? [{ line: 1, message: 'js eval' }] : []) },
    { ...META, id: 'P1', kind: 'project', check: () => [{ message: 'project level', severity: 'info' }] },
    { ...META, id: 'BAD', kind: 'file', extensions: ['php'], check: () => { throw new Error('boom'); } },
  ];
  const { findings, errors } = runRules(rules, ctx);
  assert.deepStrictEqual(findings.map((f) => [f.ruleId, f.file, f.line]), [['L1', 'a.php', 2], ['F1', 'b.js', 1], ['P1', null, null]]);
  assert.strictEqual(findings[1].message, 'js eval');
  assert.strictEqual(findings[2].severity, 'info');
  assert.ok(findings[0].fingerprint);
  assert.deepStrictEqual(errors.map((e) => e.ruleId), ['BAD']);
});

test('inline suppressions apply to the same line or a comment line above', () => {
  assert.deepStrictEqual(parseInline('x(); // asst-ignore[PHP-A, PHP-B] reviewed'), { rules: ['PHP-A', 'PHP-B'] });
  assert.deepStrictEqual(parseInline('# asst-ignore'), { rules: [] });
  const src = { 'a.php': ['$a = q($x); // asst-ignore[R1]', '// asst-ignore', '$b = q($x);', '$c = q($x); // asst-ignore[R9]'] };
  const lineOf = (file, n) => src[file][n - 1] || '';
  const mk = (line, ruleId = 'R1') => ({ ruleId, file: 'a.php', line });
  const { kept, suppressed } = applyInlineSuppressions([mk(1), mk(3), mk(4)], lineOf);
  assert.deepStrictEqual(suppressed.map((f) => f.line), [1, 3]);
  assert.deepStrictEqual(kept.map((f) => f.line), [4]);
});

test('baseline marks new/unchanged findings and lists fixed ones', () => {
  const file = path.join(os.tmpdir(), `asst-baseline-test-${process.pid}.json`);
  writeBaseline(file, [{ fingerprint: 'aaa', ruleId: 'R', file: 'x', line: 1, title: 't' }, { fingerprint: 'bbb', ruleId: 'R', file: 'y', line: 2, title: 't' }]);
  const current = [{ fingerprint: 'aaa' }, { fingerprint: 'ccc' }];
  const { fixed } = compareWithBaseline(current, loadBaseline(file));
  assert.deepStrictEqual(current.map((f) => f.baseline), ['unchanged', 'new']);
  assert.deepStrictEqual(fixed.map((f) => f.fingerprint), ['bbb']);
  fs.unlinkSync(file);
});

test('legacy line matching keeps v1 semantics while reading each file once', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-legacy-'));
  try {
    fs.writeFileSync(path.join(root, 'q.php'), [
      '<?php',
      '$r = mysqli_query($con, $sql);',
      '$r = mysqli_query($con,',
      '  $sql);',
      '$x = 1; $y = 2; $z = 3;',
    ].join('\n'));
    const project = walkProject(root);
    const cache = new FileCache();
    const core = new LegacyCore({ config: { user: {}, scanPath: root, htmlPath: path.join(root, 'r.html'), asstRoot: root, debug: false, quiet: true }, project, cache });
    const file = path.join(root, 'q.php');
    assert.deepStrictEqual(core.findLineInFile('mysqli_query( ,$', file, true, true), [2]);
    // checkIfIncompleteCodeLine + notifyOnlyIfIncompleteCodeLineDetected reports the unfinished line only
    assert.deepStrictEqual(core.findLineInFile('mysqli_query(', file, true, true, false, false, '', '', false, null, true, false, true), [3]);
    assert.strictEqual(core.findLinesInFile(['$x', '$z'], file), 2);
    assert.deepStrictEqual(core.findLinesInFile(['$x', '$z'], file, true), [5, 5]);
    assert.strictEqual(cache.reads, 1);
    assert.match(core.docUrl('langs/php/docs/a b.pdf'), /^file:\/\/.*a%20b\.pdf$/);
    core.initReport();
    core.findLineInFile('$x', file, false, false, false, false, '<b>msg</b>', '', true);
    assert.match(core.html.join(''), /&lt;b&gt;msg&lt;\/b&gt;/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
