'use strict';
/*
 * Finding suppression and baseline comparison.
 *
 * Inline suppression (any comment syntax), on the finding's line or the line above:
 *   $x = $db->query($sql); // asst-ignore[PHP-SQLI-001] value comes from an allow-list
 *   # asst-ignore            (suppresses every rule on the next line)
 *
 * Path suppression: an .asstignore file at the scanned root (one glob per line).
 *
 * Baseline: a JSON file of fingerprints from an earlier scan. Findings are marked
 * "new" or "unchanged", and baseline entries that disappeared are reported as fixed.
 */
const fs = require('fs');

const INLINE_RE = /asst-ignore(?:\[([^\]]*)\])?/i;

function parseInline(lineText) {
  const m = INLINE_RE.exec(lineText || '');
  if (!m) return null;
  const rules = (m[1] || '').split(',').map((s) => s.trim()).filter(Boolean);
  return { rules };
}

function covers(directive, ruleId) {
  return directive && (directive.rules.length === 0 || directive.rules.includes(ruleId));
}

/** True if the finding is suppressed by an inline directive. getLine(n) returns 1-based line text. */
function isSuppressedInline(finding, getLine) {
  if (!finding.line) return false;
  if (covers(parseInline(getLine(finding.line)), finding.ruleId)) return true;
  // directive on the preceding line, when that line is only a comment
  const prev = getLine(finding.line - 1);
  const directive = parseInline(prev);
  if (directive && /^\s*(\/\/|#|\/\*|\*|<!--|\{\{--|\{#)/.test(prev)) return covers(directive, finding.ruleId);
  return false;
}

/**
 * Splits findings into kept and suppressed lists.
 * @param {Array} findings
 * @param {(file:string, line:number)=>string} lineOf
 */
function applyInlineSuppressions(findings, lineOf) {
  const kept = [];
  const suppressed = [];
  for (const f of findings) {
    if (f.file && isSuppressedInline(f, (n) => lineOf(f.file, n))) suppressed.push(f);
    else kept.push(f);
  }
  return { kept, suppressed };
}

function loadBaseline(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entries = Array.isArray(data.findings) ? data.findings : [];
  return new Map(entries.map((e) => [e.fingerprint, e]));
}

function writeBaseline(file, findings, meta = {}) {
  const data = {
    tool: 'OWASP ASST',
    version: meta.version || null,
    createdAt: new Date().toISOString(),
    findings: findings.map((f) => ({ fingerprint: f.fingerprint, ruleId: f.ruleId, file: f.file, line: f.line, title: f.title })),
  };
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

/** Marks findings as new/unchanged and returns the baseline entries that are gone (fixed). */
function compareWithBaseline(findings, baseline) {
  const seen = new Set();
  for (const f of findings) {
    if (baseline.has(f.fingerprint)) {
      f.baseline = 'unchanged';
      seen.add(f.fingerprint);
    } else {
      f.baseline = 'new';
    }
  }
  const fixed = [...baseline.values()].filter((e) => !seen.has(e.fingerprint));
  return { fixed };
}

module.exports = { parseInline, isSuppressedInline, applyInlineSuppressions, loadBaseline, writeBaseline, compareWithBaseline };
