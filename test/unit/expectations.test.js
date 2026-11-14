'use strict';
const test = require('node:test');
const assert = require('assert');
const path = require('path');
const { parseAnnotations, loadExpectations } = require('../helpers/expectations');

test('parses single and alternative @expect annotations', () => {
  const text = [
    '<?php',
    '$r = mysqli_query($c, "SELECT $id"); // @expect CWE-89',
    '$d = file_get_contents($u); // @expect CWE-918|CWE-22 conf=medium',
    '<input value="<?= $q ?>"> <!-- @expect CWE-79 -->',
  ].join('\n');
  assert.deepStrictEqual(parseAnnotations(text), [
    { line: 2, cwes: ['CWE-89'], conf: null },
    { line: 3, cwes: ['CWE-918', 'CWE-22'], conf: 'medium' },
    { line: 4, cwes: ['CWE-79'], conf: null },
  ]);
});

test('fixture corpus has expectations and safe counterparts', () => {
  const truth = loadExpectations(path.join(__dirname, '..', 'fixtures', 'php'));
  assert.ok(truth.expectations.length >= 30, 'expected at least 30 annotated sinks');
  assert.ok(truth.safeFiles.length >= 20, 'expected at least 20 safe fixtures');
  for (const safe of truth.safeFiles) {
    assert.ok(!truth.expectations.some((e) => e.file === safe), `${safe} must not carry @expect annotations`);
  }
});

test('vulnerable app sidecar expectations are loaded', () => {
  const truth = loadExpectations(path.join(__dirname, '..', 'fixtures', 'php-vulnerable-app'));
  assert.ok(truth.fileLevel.some((e) => e.file === 'backup.sql'));
  assert.ok(truth.projectLevel.includes('CWE-548'));
});
