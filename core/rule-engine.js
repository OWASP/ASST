'use strict';
/*
 * Declarative rule engine. Language plugins provide rule objects; the engine runs them
 * over the project's files (each file read once through the shared FileCache) and
 * turns their matches into findings.
 *
 * Rule kinds:
 *   { kind: 'line',    extensions, pattern: RegExp, unless?: RegExp, when?(ctx), ... }
 *       one finding per matching line; `unless` suppresses a line, `when` may veto per match
 *   { kind: 'file',    extensions, check(file, ctx) -> [{line?, column?, message?, ...overrides}] }
 *   { kind: 'project', check(ctx) -> [{file?, line?, message?, ...overrides}] }
 *
 * Shared metadata: id, title, category (OWASP 2025), owasp2021, cwe, severity,
 * confidence, message, guide, pdf.
 */
const { createFinding, fingerprint } = require('./finding');

const META_KEYS = ['ruleId', 'title', 'category', 'owasp2021', 'cwe', 'severity', 'confidence', 'message', 'guide', 'pdf', 'trace', 'snippet'];

function applies(rule, file) {
  if (!rule.extensions || rule.extensions.length === 0) return true;
  return rule.extensions.includes(file.ext) || (rule.filenames && rule.filenames.includes(file.name));
}

function build(rule, hit, ctx) {
  const fields = {
    ruleId: rule.id,
    title: rule.title,
    category: rule.category,
    owasp2021: rule.owasp2021,
    cwe: rule.cwe,
    severity: rule.severity,
    confidence: rule.confidence,
    message: typeof rule.message === 'function' ? rule.message(hit) : rule.message,
    guide: rule.guide,
    pdf: rule.pdf,
  };
  for (const k of META_KEYS) if (hit[k] !== undefined) fields[k] = hit[k];
  fields.file = hit.file !== undefined ? hit.file : null;
  fields.line = hit.line || null;
  fields.column = hit.column || null;
  const lineText = fields.file && fields.line ? ctx.lineOf(fields.file, fields.line) : '';
  fields.fingerprint = fingerprint(fields.ruleId, fields.file || '', lineText, hit.fingerprintExtra || '');
  return createFinding(fields);
}

/**
 * @param {Array} rules
 * @param {{files:Array, cache, lineOf(rel,n), textOf(rel), linesOf(rel)}} ctx
 */
function runRules(rules, ctx) {
  const findings = [];
  const errors = [];
  const lineRules = rules.filter((r) => r.kind === 'line');
  const fileRules = rules.filter((r) => r.kind === 'file');
  const projectRules = rules.filter((r) => r.kind === 'project');

  for (const file of ctx.files) {
    const wantsLine = lineRules.filter((r) => applies(r, file));
    const wantsFile = fileRules.filter((r) => applies(r, file));
    if (wantsLine.length === 0 && wantsFile.length === 0) continue;
    const lines = ctx.linesOf(file.rel);
    if (!lines) continue;
    for (const rule of wantsLine) {
      try {
        const scanLines = rule.useMaskedLines && ctx.maskedLinesOf ? ctx.maskedLinesOf(file.rel) : lines;
        for (let i = 0; i < scanLines.length; i++) {
          const text = scanLines[i];
          if (!text) continue;
          rule.pattern.lastIndex = 0;
          const m = rule.pattern.exec(text);
          if (!m) continue;
          if (rule.unless && rule.unless.test(text)) continue;
          const hit = { file: file.rel, line: i + 1, column: m.index + 1, match: m, lineText: lines[i] };
          if (rule.when && !rule.when(hit, { ...ctx, file, lines })) continue;
          findings.push(build(rule, hit, ctx));
        }
      } catch (err) {
        errors.push({ ruleId: rule.id, file: file.rel, error: err.message });
      }
    }
    for (const rule of wantsFile) {
      try {
        for (const hit of rule.check({ ...file, lines, text: ctx.textOf(file.rel) }, ctx) || []) {
          findings.push(build(rule, { file: file.rel, ...hit }, ctx));
        }
      } catch (err) {
        errors.push({ ruleId: rule.id, file: file.rel, error: err.message });
      }
    }
  }
  for (const rule of projectRules) {
    try {
      for (const hit of rule.check(ctx) || []) findings.push(build(rule, hit, ctx));
    } catch (err) {
      errors.push({ ruleId: rule.id, error: err.message });
    }
  }
  return { findings, errors };
}

module.exports = { runRules };
