'use strict';
/*
 * Precision / recall / F1 computation for ASST benchmarks.
 *
 * A "finding" is {file, line|null, cwe} with file relative to the dataset root (posix).
 * Two truth shapes are supported:
 *  - line-level  (fixtures): expectations [{file, line, cwes:[alternatives]}] + safe files
 *  - file-level  (SARD, DVWA): cases [{file, cwe, vulnerable:boolean, scope:'file'|'dir'}]
 */

function emptyCounts() {
  return { tp: 0, fp: 0, fn: 0, tn: 0 };
}

function ratio(a, b) {
  return b === 0 ? null : a / b;
}

function finalize(counts) {
  const precision = ratio(counts.tp, counts.tp + counts.fp);
  const recall = ratio(counts.tp, counts.tp + counts.fn);
  const f1 = precision === null || recall === null || precision + recall === 0
    ? (counts.tp === 0 && (counts.fp > 0 || counts.fn > 0) ? 0 : null)
    : (2 * precision * recall) / (precision + recall);
  return { ...counts, precision, recall, f1 };
}

function bump(table, cwe, key) {
  if (!table[cwe]) table[cwe] = emptyCounts();
  table[cwe][key] += 1;
}

function summarize(table) {
  const perCwe = {};
  const total = emptyCounts();
  for (const cwe of Object.keys(table).sort(cweSort)) {
    perCwe[cwe] = finalize(table[cwe]);
    for (const k of Object.keys(total)) total[k] += table[cwe][k];
  }
  return { perCwe, overall: finalize(total) };
}

function cweSort(a, b) {
  return Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, ''));
}

/** Line-level scoring for annotated fixtures. */
function scoreLineLevel(truth, findings) {
  const table = {};
  const inScope = new Set();
  for (const e of truth.expectations) e.cwes.forEach((c) => inScope.add(c));
  for (const e of truth.fileLevel || []) e.cwes.forEach((c) => inScope.add(c));

  const relevant = findings.filter((f) => inScope.has(f.cwe));
  const matched = new Set();

  const expectations = [
    ...truth.expectations.map((e) => ({ ...e })),
    ...(truth.fileLevel || []).map((e) => ({ ...e, line: null })),
  ];

  for (const exp of expectations) {
    let hit = -1;
    relevant.forEach((f, idx) => {
      if (hit !== -1 || f.file !== exp.file || !exp.cwes.includes(f.cwe)) return;
      if (exp.line === null || f.line === null || f.line === undefined || f.line === exp.line) hit = idx;
    });
    if (hit !== -1) {
      bump(table, exp.cwes[0], 'tp');
      // a finding may satisfy several alternatives on the same line; mark all identical keys
      relevant.forEach((f, idx) => {
        if (f.file === relevant[hit].file && f.cwe === relevant[hit].cwe && (f.line === relevant[hit].line)) matched.add(idx);
      });
    } else {
      bump(table, exp.cwes[0], 'fn');
    }
  }

  const seenFp = new Set();
  relevant.forEach((f, idx) => {
    if (matched.has(idx)) return;
    const key = `${f.file}:${f.line}:${f.cwe}`;
    if (seenFp.has(key)) return;
    // a line-less finding in a file that has a matching expectation was already counted as TP
    if ((f.line === null || f.line === undefined) && expectations.some((e) => e.file === f.file && e.cwes.includes(f.cwe))) return;
    seenFp.add(key);
    bump(table, f.cwe, 'fp');
  });
  return summarize(table);
}

/** File-level scoring (SARD / DVWA). */
function scoreFileLevel(cases, allFindings) {
  const findings = allFindings.filter((f) => f.file);
  const table = {};
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, new Set());
    byFile.get(f.file).add(f.cwe);
  }
  for (const c of cases) {
    const cwes = c.cwes || [c.cwe];
    let detected;
    if (c.scope === 'dir') {
      const prefix = c.file.endsWith('/') ? c.file : c.file + '/';
      detected = findings.some((f) => f.file.startsWith(prefix) && cwes.includes(f.cwe));
    } else {
      const set = byFile.get(c.file);
      detected = !!set && cwes.some((cwe) => set.has(cwe));
    }
    const key = cwes[0];
    if (c.vulnerable) bump(table, key, detected ? 'tp' : 'fn');
    else bump(table, key, detected ? 'fp' : 'tn');
  }
  return summarize(table);
}

function fmt(value) {
  return value === null || value === undefined ? '–' : (value * 100).toFixed(1);
}

module.exports = { scoreLineLevel, scoreFileLevel, finalize, fmt, cweSort };
