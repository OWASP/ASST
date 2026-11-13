'use strict';
/*
 * Builds the report model shared by every output format (JSON, HTML, SARIF, Markdown).
 */
const path = require('path');
const { SEVERITIES, CONFIDENCES } = require('../finding');

const SCHEMA = 'asst-report/1';
const SNIPPET_CONTEXT = 3;

function snippetFor(finding, project, cache) {
  if (!finding.file || !finding.line) return null;
  const lines = cache.lines(path.join(project.root, finding.file));
  if (!lines) return null;
  const start = Math.max(1, finding.line - SNIPPET_CONTEXT);
  const end = Math.min(lines.length, finding.line + SNIPPET_CONTEXT);
  return { startLine: start, lines: lines.slice(start - 1, end).map((l) => (l.length > 400 ? `${l.slice(0, 400)}…` : l)) };
}

function countBy(list, key, keys) {
  const out = {};
  for (const k of keys || []) out[k] = 0;
  for (const item of list) out[item[key] || 'none'] = (out[item[key] || 'none'] || 0) + 1;
  return out;
}

/**
 * @param {object} p
 * @returns {object} report model
 */
function buildModel(p) {
  const findings = p.findings.map((f) => ({ ...f, snippet: f.snippet || snippetFor(f, p.project, p.cache) }));
  const finished = Date.now();
  return {
    schema: SCHEMA,
    tool: { name: 'OWASP ASST', version: p.config.version, homepage: 'https://github.com/OWASP/ASST' },
    scan: {
      root: p.project.root,
      language: p.language,
      startedAt: new Date(p.startedAt).toISOString(),
      finishedAt: new Date(finished).toISOString(),
      durationMs: finished - p.startedAt,
      filesScanned: p.stats.filesScanned,
      filesAnalyzed: p.stats.filesAnalyzed,
      parse: p.stats.parse,
      skipped: p.project.skipped.map((s) => ({ path: s.rel, reason: s.reason })),
      options: {
        minSeverity: p.config.minSeverity,
        minConfidence: p.config.minConfidence,
        secondOrderSources: Boolean(p.config.secondOrder),
        formats: p.config.formats,
      },
    },
    summary: {
      total: findings.length,
      bySeverity: countBy(findings, 'severity', SEVERITIES),
      byConfidence: countBy(findings, 'confidence', CONFIDENCES),
      byCategory: countBy(findings, 'category'),
      hidden: p.stats.hidden || 0,
      suppressed: p.stats.suppressed || 0,
      fixed: p.fixed ? p.fixed.length : null,
    },
    environment: p.environment || {},
    findings,
    fixed: p.fixed || [],
    notices: p.notices || [],
    guides: p.guides || {},
    rules: p.rules || [],
    asstRoot: p.config.asstRoot,
  };
}

module.exports = { buildModel, SCHEMA };
