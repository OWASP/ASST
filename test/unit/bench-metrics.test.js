'use strict';
const test = require('node:test');
const assert = require('assert');
const { scoreLineLevel, scoreFileLevel } = require('../../bench/lib/metrics');
const { compareBaseline, baselineFrom } = require('../../bench/run');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('line-level scoring counts TP, FN and FP per CWE', () => {
  const truth = {
    expectations: [
      { file: 'a.php', line: 3, cwes: ['CWE-89'] },
      { file: 'b.php', line: 2, cwes: ['CWE-918', 'CWE-22'] },
      { file: 'c.php', line: 5, cwes: ['CWE-79'] },
    ],
    fileLevel: [],
  };
  const findings = [
    { file: 'a.php', line: 3, cwe: 'CWE-89' },          // TP
    { file: 'b.php', line: 2, cwe: 'CWE-22' },          // TP via alternative
    { file: 'safe.php', line: 1, cwe: 'CWE-79' },       // FP
    { file: 'safe.php', line: 1, cwe: 'CWE-79' },       // duplicate FP counted once
    { file: 'x.php', line: 1, cwe: 'CWE-1004' },        // out of scope, ignored
  ];
  const { perCwe, overall } = scoreLineLevel(truth, findings);
  assert.strictEqual(perCwe['CWE-89'].tp, 1);
  assert.strictEqual(perCwe['CWE-918'].tp, 1);
  assert.strictEqual(perCwe['CWE-79'].fn, 1);
  assert.strictEqual(perCwe['CWE-79'].fp, 1);
  assert.strictEqual(perCwe['CWE-1004'], undefined);
  assert.strictEqual(overall.tp, 2);
  assert.strictEqual(overall.fp, 1);
  assert.strictEqual(overall.fn, 1);
  assert.ok(Math.abs(overall.f1 - 2 / 3) < 1e-9);
});

test('file-level scoring handles good/bad cases and directory scope', () => {
  const cases = [
    { file: 'bad1.php', cwe: 'CWE-89', vulnerable: true },
    { file: 'bad2.php', cwe: 'CWE-89', vulnerable: true },
    { file: 'good.php', cwe: 'CWE-89', vulnerable: false },
    { file: 'mod', scope: 'dir', cwe: 'CWE-98', vulnerable: true },
  ];
  const findings = [
    { file: 'bad1.php', line: 4, cwe: 'CWE-89' },
    { file: 'good.php', line: 4, cwe: 'CWE-89' },
    { file: 'mod/index.php', line: 9, cwe: 'CWE-98' },
  ];
  const { perCwe } = scoreFileLevel(cases, findings);
  assert.deepStrictEqual(
    { tp: perCwe['CWE-89'].tp, fp: perCwe['CWE-89'].fp, fn: perCwe['CWE-89'].fn, tn: perCwe['CWE-89'].tn },
    { tp: 1, fp: 1, fn: 1, tn: 0 },
  );
  assert.strictEqual(perCwe['CWE-98'].tp, 1);
});

test('baseline comparison flags regressions beyond tolerance', () => {
  const results = { datasets: { fixtures: { versions: { head: { metrics: { overall: { f1: 0.5 }, perCwe: { 'CWE-89': { f1: 0.9 } } } } } } } };
  const file = path.join(os.tmpdir(), `asst-baseline-${process.pid}.json`);
  fs.writeFileSync(file, JSON.stringify(baselineFrom(results)));
  assert.deepStrictEqual(compareBaseline(results, file), []);
  results.datasets.fixtures.versions.head.metrics.perCwe['CWE-89'].f1 = 0.8;
  assert.strictEqual(compareBaseline(results, file).length, 1);
  fs.unlinkSync(file);
});
