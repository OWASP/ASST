'use strict';
/*
 * PHP language plugin.
 *
 *   PHP files      -> parse once -> taint analysis + structural AST rules
 *                     (line-based fallback rules when a file cannot be parsed)
 *   templates/JS   -> CSRF form, DOM XSS and plain-HTTP rules
 *   project        -> exposed files, .htaccess hardening
 *   runtime        -> PHP/libxml versions, database password storage and version
 */
const path = require('path');
const { analyzeProject } = require('./taint');
const { runAstRules } = require('./rules/ast-rules');
const textRules = require('./rules/text-rules');
const projectRules = require('./rules/project-rules');
const { RULES, rule } = require('./rules/registry');
const { phpRuntime, databaseChecks } = require('./runtime/checks');
const { PhpDatabase, normalizeDbConfig } = require('./runtime/db');
const manualReview = require('./notices');
const { loadGuides, pickGuides } = require('../../core/guides');
const { createFinding, fingerprint, dedupe, compareFindings, atLeastSeverity, atLeastConfidence } = require('../../core/finding');
const { applyInlineSuppressions, loadBaseline, writeBaseline, compareWithBaseline } = require('../../core/suppress');
const { buildModel } = require('../../core/report/model');
const { writeReports } = require('../../core/report');
const consoleReport = require('../../core/report/console');
const ansi = require('../../core/ansi');

const EXTENSIONS = ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'inc', 'module'];
const CONF = ['high', 'medium', 'low'];

function resolvePhpBin(config, phpConfig, env = process.env) {
  if (config.phpBin !== undefined) return config.phpBin;
  if (env.ASST_PHP_BIN !== undefined) return env.ASST_PHP_BIN;
  return phpConfig.PHP_EXE_BIN_PATH || '';
}

function sinkLabel(sink) {
  return String(sink || '').replace(/^(fn|m|sm|new):/, '').replace(/^@/, '') + (/^(fn|m|sm):/.test(sink || '') ? '()' : '');
}

const CONTEXT_TEXT = {
  "quoted '": 'inside a single-quoted string',
  'quoted "': 'inside a double-quoted string',
  'quoted `': 'inside a backtick-quoted identifier',
  unquoted: 'outside any quotes',
  html: 'in HTML text',
  rcdata: 'inside a <textarea> or <title>',
  'attr "': 'in a double-quoted HTML attribute',
  "attr '": 'in a single-quoted HTML attribute',
  'attr-unquoted': 'in an unquoted HTML attribute',
  'url-attr "': 'as a link or resource URL',
  "url-attr '": 'as a link or resource URL',
  'js-string': 'inside a JavaScript string',
  'js-string "': 'inside a JavaScript string',
  "js-string '": 'inside a JavaScript string',
  'js-code': 'as JavaScript code',
  'js-attr "': 'inside an event-handler attribute',
  "js-attr '": 'inside an event-handler attribute',
  css: 'inside CSS',
  tag: 'in a tag or attribute name',
  comment: 'inside an HTML comment',
  'whole URL': 'as the whole URL',
  host: 'as the scheme or host of the URL',
  path: 'in a file path',
  filter: 'in an LDAP filter',
  line: 'and may contain line breaks',
};

function taintMessage(meta, hit) {
  const src = hit.trace[0];
  const via = hit.trace.slice(1).map((t) => t.note).filter((n) => n && !/^assigned to /.test(n));
  const where = hit.context && CONTEXT_TEXT[hit.context] ? ` ${CONTEXT_TEXT[hit.context]}` : '';
  let msg = `${src ? `${src.note} (line ${src.line})` : 'User input'} reaches ${sinkLabel(hit.sink)}${where}`;
  if (via.length) msg += ` via ${via.slice(-3).join(', ')}`;
  msg += `. ${meta.summary}`;
  if (hit.secondOrder) msg += ' The value comes from stored or external data (second-order input).';
  return msg;
}

function makeFinding(ruleId, base, ctx) {
  const meta = rule(ruleId);
  const f = createFinding({
    ruleId,
    title: meta.title,
    category: meta.category,
    owasp2021: meta.owasp2021,
    cwe: meta.cwe,
    severity: base.severity || meta.severity,
    confidence: base.confidence || 'high',
    file: base.file || null,
    line: base.line || null,
    column: base.column || null,
    message: base.message || meta.summary,
    trace: base.trace || [],
    guide: meta.guide,
    pdf: meta.pdf,
  });
  f.fingerprint = fingerprint(ruleId, f.file || '', f.file && f.line ? ctx.lineOf(f.file, f.line) : '', f.file ? '' : f.message);
  return f;
}

function ruleSelected(id, config) {
  if (config.rules.length && !config.rules.some((p) => id.startsWith(p))) return false;
  if (config.disableRules.some((p) => id.startsWith(p))) return false;
  return true;
}

module.exports = {
  id: 'php',
  name: 'PHP',
  extensions: EXTENSIONS,

  detect(project) {
    return project.files.filter((f) => EXTENSIONS.includes(f.ext)).length;
  },

  async scan({ config, project, cache, notices }) {
    const startedAt = Date.now();
    const phpConfig = config.languageConfig.php || {};
    const lineOf = (rel, n) => cache.line(path.join(project.root, rel), n);
    const ctx = { lineOf };
    const options = { secondOrder: Boolean(config.secondOrder || phpConfig.SECOND_ORDER_SOURCES) };
    const raw = [];
    const stats = { filesScanned: project.files.length, filesAnalyzed: 0, parse: { ok: 0, recovered: 0, failed: 0 } };
    const parseFailures = [];

    if (!config.quiet) console.log(ansi.paint(`Scanning ${project.files.length} files in ${project.root}`, 'cyan'));

    const phpFiles = [];
    for (const file of project.files) {
      const isPhp = EXTENSIONS.includes(file.ext);
      const needsText = isPhp || textRules.TEMPLATE_EXT.has(file.ext) || ['js', 'mjs', 'cjs', 'css'].includes(file.ext);
      if (!needsText) continue;
      const text = cache.text(file.abs);
      if (text === null) continue;
      const lines = cache.lines(file.abs);
      stats.filesAnalyzed++;
      if (isPhp) phpFiles.push({ rel: file.rel, text });
      for (const h of textRules.csrfForms(file, text)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }, ctx));
      for (const h of textRules.domRules(file, text)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }, ctx));
      for (const h of textRules.httpUrls(file, lines)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel, confidence: 'medium' }, ctx));
    }

    // PHP: parse every file once, run the structural rules, then follow data across the project
    const taint = analyzeProject(phpFiles, options, (rel, ast, parsed) => {
      stats.parse[parsed.status === 'failed' ? 'failed' : parsed.status]++;
      if (ast) {
        for (const h of runAstRules(ast)) raw.push(makeFinding(h.ruleId, { ...h, file: rel }, ctx));
      } else {
        parseFailures.push(`${rel} (${parsed.error})`);
        for (const h of textRules.phpFallback(cache.lines(path.join(project.root, rel)) || [])) raw.push(makeFinding(h.ruleId, { ...h, file: rel }, ctx));
      }
    });
    for (const hit of taint.hits) {
      const meta = rule(hit.rule);
      const finding = makeFinding(hit.rule, {
        file: hit.file, line: hit.line, column: hit.col, confidence: CONF[hit.conf] || 'low',
        message: taintMessage(meta, hit), trace: hit.trace,
      }, ctx);
      if (hit.entries && hit.entries.length) {
        finding.entryPoints = hit.entries.slice(0, 200);
        finding.message += ` Reached from ${hit.entries.slice(0, 3).join(', ')}${hit.entries.length > 3 ? ` and ${hit.entries.length - 3} more` : ''}.`;
      }
      raw.push(finding);
    }
    if (taint.exhausted) notices.add('info', `The analysis budget was reached for ${taint.exhausted} entry file(s); results for them may be incomplete.`);

    const usesPhp = project.files.some((f) => EXTENSIONS.includes(f.ext));
    for (const h of projectRules.exposedFiles(project)) raw.push(makeFinding(h.ruleId, h, ctx));
    for (const h of projectRules.htaccessRules(project, { usesPhp })) raw.push(makeFinding(h.ruleId, h, ctx));

    // runtime checks
    const environment = {};
    const phpBin = resolvePhpBin(config, phpConfig);
    const runtime = phpRuntime(phpBin, new Date());
    if (runtime.notice) notices.add('warning', runtime.notice);
    if (runtime.env) environment.php = runtime.env;
    for (const h of runtime.hits) raw.push(makeFinding(h.ruleId, h, ctx));
    const db = new PhpDatabase(normalizeDbConfig(phpConfig, process.env, { noDb: config.noDb }));
    if (db.cfg.enabled) {
      if (await db.connect()) {
        try {
          const res = await databaseChecks(db, new Date());
          Object.assign(environment, res.env);
          for (const h of res.hits) raw.push(makeFinding(h.ruleId, h, ctx));
        } finally {
          await db.close();
        }
      } else {
        notices.add('warning', `Database checks skipped: ${db.error}`);
      }
    }
    if (parseFailures.length) {
      notices.add('info', `${parseFailures.length} PHP file(s) could not be parsed and were checked with simpler line rules: ${parseFailures.slice(0, 5).join('; ')}${parseFailures.length > 5 ? '; ...' : ''}`);
    }

    // selection, suppression, thresholds
    let findings = dedupe(raw.filter((f) => ruleSelected(f.ruleId, config)));
    const { kept, suppressed } = applyInlineSuppressions(findings, lineOf);
    findings = kept;
    const visible = findings.filter((f) => atLeastSeverity(f.severity, config.minSeverity) && atLeastConfidence(f.confidence, config.minConfidence));
    stats.hidden = findings.length - visible.length;
    stats.suppressed = suppressed.length;
    visible.sort(compareFindings);

    let fixed = null;
    if (config.baseline) {
      try {
        fixed = compareWithBaseline(visible, loadBaseline(config.baseline)).fixed;
      } catch (err) {
        notices.add('warning', `Baseline not used: ${err.message}`);
      }
    }
    if (config.updateBaseline) writeBaseline(config.updateBaseline, visible, { version: config.version });

    const scanNotices = notices.list.map((n) => ({ kind: n.kind, message: n.message }));
    const model = buildModel({
      config, project, cache, startedAt, stats, environment, language: 'php', fixed,
      findings: visible,
      notices: [...scanNotices, ...manualReview],
      rules: RULES.filter((r) => visible.some((f) => f.ruleId === r.id)),
      guides: pickGuides(loadGuides(path.join(__dirname, 'guides')), visible.map((f) => f.guide)),
    });
    const reports = writeReports(model, config);
    consoleReport.print(model, { quiet: config.quiet, reportFiles: reports });
    notices.list.length = 0; // already part of the report and console output

    let exitCode = 0;
    if (config.failOn && visible.some((f) => atLeastSeverity(f.severity, config.failOn))) exitCode = 1;
    return { exitCode, reports, model };
  },
};

module.exports.resolvePhpBin = resolvePhpBin;
