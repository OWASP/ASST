'use strict';
/*
 * The finding model shared by every language plugin, report and integration.
 */
const crypto = require('crypto');

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const CONFIDENCES = ['high', 'medium', 'low'];

function severityRank(s) {
  const i = SEVERITIES.indexOf(s);
  return i === -1 ? SEVERITIES.length : i; // 0 = most severe
}

function confidenceRank(c) {
  const i = CONFIDENCES.indexOf(c);
  return i === -1 ? CONFIDENCES.length : i; // 0 = most confident
}

/** True if severity `s` is at least as severe as `min`. */
function atLeastSeverity(s, min) {
  return severityRank(s) <= severityRank(min);
}

/** True if confidence `c` is at least `min`. */
function atLeastConfidence(c, min) {
  return confidenceRank(c) <= confidenceRank(min);
}

function normalizeLine(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

/** Stable identity of a finding that survives unrelated edits (line shifts). */
function fingerprint(ruleId, file, lineText, extra = '') {
  return crypto.createHash('sha1').update(`${ruleId}|${file}|${normalizeLine(lineText)}|${extra}`).digest('hex').slice(0, 20);
}

/**
 * Builds a finding with defaults and validation.
 * Required: ruleId, title, severity, message. file/line are optional for project-level findings.
 */
function createFinding(fields) {
  const f = {
    ruleId: fields.ruleId,
    title: fields.title,
    category: fields.category || null, // OWASP Top 10:2025 id, e.g. "A05:2025"
    owasp2021: fields.owasp2021 || null,
    cwe: fields.cwe || null, // "CWE-89"
    severity: fields.severity,
    confidence: fields.confidence || 'high',
    file: fields.file || null, // posix path relative to the scanned folder
    line: fields.line || null,
    column: fields.column || null,
    message: fields.message,
    snippet: fields.snippet || null,
    trace: fields.trace || [],
    guide: fields.guide || null, // guide anchor, e.g. "injection#sql-injection"
    pdf: fields.pdf || null, // path relative to the ASST folder
    fingerprint: fields.fingerprint || null,
    baseline: fields.baseline || null, // new | unchanged (set when a baseline is used)
  };
  if (!f.ruleId || !f.title || !f.message) throw new Error(`invalid finding: ${JSON.stringify(fields)}`);
  if (!SEVERITIES.includes(f.severity)) throw new Error(`invalid severity "${f.severity}" for ${f.ruleId}`);
  if (!CONFIDENCES.includes(f.confidence)) throw new Error(`invalid confidence "${f.confidence}" for ${f.ruleId}`);
  return f;
}

/** Sort: severity, then file, then line, then rule. */
function compareFindings(a, b) {
  return severityRank(a.severity) - severityRank(b.severity) ||
    String(a.file || '').localeCompare(String(b.file || '')) ||
    (a.line || 0) - (b.line || 0) ||
    a.ruleId.localeCompare(b.ruleId);
}

/** Removes exact duplicates (same rule, file, line and column), keeping the shortest trace. */
function dedupe(findings) {
  const best = new Map();
  for (const f of findings) {
    const key = `${f.ruleId}|${f.file}|${f.line}|${f.column}`;
    const prev = best.get(key);
    if (!prev || (f.trace || []).length < (prev.trace || []).length) best.set(key, f);
  }
  return [...best.values()];
}

module.exports = {
  SEVERITIES, CONFIDENCES, severityRank, confidenceRank, atLeastSeverity, atLeastConfidence,
  fingerprint, createFinding, compareFindings, dedupe, normalizeLine,
};
