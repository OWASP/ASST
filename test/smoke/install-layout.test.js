'use strict';
/*
 * Install-compatibility smoke test: the README / video instructions must keep working.
 *   1. ASST folder next to the project in htdocs, run "node main.js" inside ASST.
 *   2. (v2) Run by absolute path from another working directory.
 *   3. (v2) Folder kept as "ASST-main" (GitHub zip download name).
 */
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isV2, createLayout, runNode, cleanup } = require('./layout');

const V2 = isV2();

function assertReport(reportFile, output) {
  assert.ok(fs.existsSync(reportFile), `report.html should exist at ${reportFile}\n${output}`);
  const html = fs.readFileSync(reportFile, 'utf8');
  assert.match(html, /ASST/);
  assert.match(html, /login\.php/, 'report should reference scanned project files');
}

test('documented layout: "node main.js" inside the ASST folder', () => {
  const layout = createLayout();
  try {
    const r = runNode(['main.js'], layout.asst);
    assert.strictEqual(r.status, 0, `exit code ${r.status}\n${r.stdout}\n${r.stderr}`);
    assertReport(path.join(layout.asst, 'report.html'), r.stdout + r.stderr);
  } finally {
    cleanup(layout);
  }
});

test('absolute path to main.js from another working directory', { skip: !V2 && 'available from v2' }, () => {
  const layout = createLayout();
  try {
    const r = runNode([path.join(layout.asst, 'main.js')], layout.root);
    assert.strictEqual(r.status, 0, `exit code ${r.status}\n${r.stdout}\n${r.stderr}`);
    assertReport(path.join(layout.asst, 'report.html'), r.stdout + r.stderr);
  } finally {
    cleanup(layout);
  }
});

test('ASST folder named "ASST-main"', { skip: !V2 && 'available from v2' }, () => {
  const layout = createLayout({ asstFolderName: 'ASST-main' });
  try {
    const r = runNode(['main.js'], layout.asst);
    assert.strictEqual(r.status, 0, `exit code ${r.status}\n${r.stdout}\n${r.stderr}`);
    assertReport(path.join(layout.asst, 'report.html'), r.stdout + r.stderr);
  } finally {
    cleanup(layout);
  }
});
