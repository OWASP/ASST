'use strict';
/*
 * SARIF 2.1.0 output for GitHub code scanning, IDE viewers and other SARIF tools.
 * Rules carry help text, CWE/OWASP tags and a numeric security-severity; results
 * carry stable partial fingerprints and the data-flow trace as a code flow.
 */
const { pathToFileURL } = require('url');

const LEVEL = { critical: 'error', high: 'error', medium: 'warning', low: 'note', info: 'note' };
const SECURITY_SEVERITY = { critical: '9.5', high: '8.0', medium: '5.5', low: '3.0', info: '1.0' };
const PRECISION = { high: 'high', medium: 'medium', low: 'low' };

function ruleName(title) {
  return String(title).replace(/\(.*?\)/g, '').split(/[^A-Za-z0-9]+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
}

function location(file, line, column, snippet) {
  const region = { startLine: line || 1 };
  if (column) region.startColumn = column;
  if (snippet) region.snippet = { text: snippet };
  return { physicalLocation: { artifactLocation: { uri: encodeURI(file), uriBaseId: '%SRCROOT%' }, region } };
}

function render(model) {
  const used = new Map();
  for (const f of model.findings) if (!used.has(f.ruleId)) used.set(f.ruleId, f);
  const meta = new Map((model.rules || []).map((r) => [r.id, r]));
  const ruleIds = [...used.keys()].sort();
  const rules = ruleIds.map((id) => {
    const f = used.get(id);
    const r = meta.get(id) || {};
    const guide = model.guides && f.guide ? model.guides[f.guide] : null;
    const tags = ['security', f.cwe, f.category ? `OWASP ${f.category}` : null, f.owasp2021 ? `OWASP ${f.owasp2021}` : null].filter(Boolean);
    const rule = {
      id,
      name: ruleName(f.title),
      shortDescription: { text: f.title },
      fullDescription: { text: r.summary || f.title },
      help: { text: guide ? guide.text : (r.summary || f.title), markdown: guide ? guide.markdown : (r.summary || f.title) },
      defaultConfiguration: { level: LEVEL[r.severity || f.severity] || 'warning' },
      properties: {
        tags,
        precision: 'medium',
        'problem.severity': LEVEL[r.severity || f.severity] === 'note' ? 'recommendation' : LEVEL[r.severity || f.severity],
        'security-severity': SECURITY_SEVERITY[r.severity || f.severity] || '5.0',
      },
    };
    if (f.cwe) rule.helpUri = `https://cwe.mitre.org/data/definitions/${String(f.cwe).replace(/\D/g, '')}.html`;
    return rule;
  });
  const index = new Map(ruleIds.map((id, i) => [id, i]));

  const results = model.findings.map((f) => {
    const result = {
      ruleId: f.ruleId,
      ruleIndex: index.get(f.ruleId),
      level: LEVEL[f.severity] || 'warning',
      message: { text: f.message },
      partialFingerprints: { 'asst/v1': f.fingerprint || '' },
      properties: { severity: f.severity, confidence: f.confidence, precision: PRECISION[f.confidence] || 'medium', 'security-severity': SECURITY_SEVERITY[f.severity] },
    };
    if (f.file) {
      const lineText = f.snippet && f.line ? f.snippet.lines[f.line - f.snippet.startLine] : undefined;
      result.locations = [location(f.file, f.line, f.column, lineText)];
      if (f.trace && f.trace.length > 1) {
        result.codeFlows = [{
          threadFlows: [{
            locations: f.trace.map((t) => ({ location: { ...location(f.file, t.line), message: { text: t.note || '' } } })),
          }],
        }];
      }
    } else {
      result.locations = [];
      result.message.text = `[project] ${f.message}`;
    }
    if (f.url) result.properties.url = f.url;
    if (f.baseline) result.baselineState = f.baseline === 'new' ? 'new' : 'unchanged';
    return result;
  });

  const root = pathToFileURL(model.scan.root).href.replace(/\/?$/, '/');
  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name: 'OWASP ASST',
          fullName: 'OWASP ASST - Automated Software Security Toolkit',
          version: model.tool.version,
          semanticVersion: /^\d+\.\d+\.\d+/.test(model.tool.version) ? model.tool.version : undefined,
          informationUri: 'https://github.com/OWASP/ASST',
          rules,
        },
      },
      originalUriBaseIds: { '%SRCROOT%': { uri: root } },
      invocations: [{ executionSuccessful: true, startTimeUtc: model.scan.startedAt, endTimeUtc: model.scan.finishedAt }],
      automationDetails: { id: `asst/${model.scan.language}/` },
      results,
    }],
  };
  return `${JSON.stringify(sarif, null, 2)}\n`;
}

module.exports = { render, extension: 'sarif', fileName: 'report.sarif', LEVEL, SECURITY_SEVERITY };
