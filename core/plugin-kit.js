'use strict';
/*
 * Building blocks shared by the language plugins: turning rule hits into findings,
 * describing data-flow hits, merging live-check results, and finishing a scan
 * (rule selection, inline suppressions, thresholds, baseline, reports, exit code).
 */
const { createFinding, fingerprint, dedupe, compareFindings, atLeastSeverity, atLeastConfidence } = require('./finding');
const { applyInlineSuppressions, loadBaseline, writeBaseline, compareWithBaseline } = require('./suppress');
const { buildModel } = require('./report/model');
const { writeReports } = require('./report');
const consoleReport = require('./report/console');
const { loadGuides, pickGuides } = require('./guides');
const { runLiveChecks } = require('./live');
const ansi = require('./ansi');

const CONF = ['high', 'medium', 'low'];
const SEVERITY_ORDER = ['info', 'low', 'medium', 'high', 'critical'];

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

function sinkLabel(sink) {
  return String(sink || '').replace(/^(fn|m|sm|new):/, '').replace(/^@/, '') + (/^(fn|m|sm):/.test(sink || '') ? '()' : '');
}

/** Human-readable description of a data-flow hit. */
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

/**
 * @param {(id:string)=>object} rule registry lookup
 * @param {{lineOf:(rel:string, line:number)=>string|null}} ctx
 * @returns {(ruleId:string, base:object)=>object} finding factory
 */
function createFindingMaker(rule, ctx) {
  return function makeFinding(ruleId, base) {
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
    let lineText = f.file && f.line ? ctx.lineOf(f.file, f.line) || '' : '';
    // secrets are fingerprinted on the masked line (nothing derived from the value is stored)
    for (const v of [].concat(base.redact || [])) lineText = lineText.split(v).join('********');
    f.fingerprint = fingerprint(ruleId, f.file || '', lineText, f.file ? '' : f.message);
    if (base.url) f.url = base.url;
    if (base.component) f.component = base.component;
    return f;
  };
}

/** Finding for a data-flow hit from core/taint (with the entry points that reach it). */
function taintFinding(makeFinding, rule, hit) {
  const finding = makeFinding(hit.rule, {
    file: hit.file, line: hit.line, column: hit.col, confidence: CONF[hit.conf] || 'low',
    message: taintMessage(rule(hit.rule), hit), trace: hit.trace,
  });
  if (hit.entries && hit.entries.length) {
    finding.entryPoints = hit.entries.slice(0, 200);
    finding.message += ` Reached from ${hit.entries.slice(0, 3).join(', ')}${hit.entries.length > 3 ? ` and ${hit.entries.length - 3} more` : ''}.`;
  }
  return finding;
}

function maxSeverity(a, b) {
  return SEVERITY_ORDER.indexOf(a) >= SEVERITY_ORDER.indexOf(b) ? a : b;
}

/**
 * Adds live-check results to the raw findings: confirmed files and folder listings raise the
 * matching static finding (when the plugin has one), everything else becomes a LIVE-* finding.
 * @param {{fileRules?:RegExp, listingRule?:string}} opts plugin rules that live checks confirm
 */
function applyLiveResults(live, raw, makeFinding, opts = {}) {
  for (const c of live.confirmedFiles) {
    const match = c.file && opts.fileRules && raw.find((f) => opts.fileRules.test(f.ruleId) && f.file === c.file);
    if (match) {
      match.severity = maxSeverity(match.severity, c.severity);
      match.url = c.url;
      match.message += ` Confirmed by the live check: ${c.url} can be downloaded (HTTP ${c.status}).`;
    } else {
      raw.push(makeFinding('LIVE-FILE-001', {
        severity: c.severity,
        url: c.url,
        message: `A ${c.label} can be downloaded from ${c.url} (HTTP ${c.status}). Remove it from the web root or deny access to it in the web server configuration.`,
      }));
    }
  }
  if (live.listings.length) {
    const urls = live.listings.map((l) => l.url);
    const listed = `${urls.slice(0, 5).join(', ')}${urls.length > 5 ? ` and ${urls.length - 5} more` : ''}`;
    const staticHit = opts.listingRule && raw.find((f) => f.ruleId === opts.listingRule);
    if (staticHit) {
      staticHit.severity = maxSeverity(staticHit.severity, 'medium');
      staticHit.url = urls[0];
      staticHit.message += ` Confirmed by the live check: ${listed} ${urls.length === 1 ? 'shows' : 'show'} a file listing.`;
    } else {
      raw.push(makeFinding('LIVE-LIST-001', { url: urls[0], message: `The web server lists folder contents at ${listed}. Switch listings off (Apache: Options -Indexes).` }));
    }
  }
  for (const h of live.hits) raw.push(makeFinding(h.ruleId, h));
}

function ruleSelected(id, config) {
  if (config.rules.length && !config.rules.some((p) => id.startsWith(p))) return false;
  if (config.disableRules.some((p) => id.startsWith(p))) return false;
  return true;
}

/**
 * Rule selection, inline suppressions, thresholds, baseline, report files and console summary.
 * @returns {{exitCode:number, reports:string[], model:object}}
 */
function finishScan(p) {
  const { config, notices, stats } = p;
  let findings = dedupe(p.raw.filter((f) => ruleSelected(f.ruleId, config)));
  const { kept, suppressed } = applyInlineSuppressions(findings, p.lineOf);
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
    config,
    project: p.project,
    cache: p.cache,
    startedAt: p.startedAt,
    stats,
    environment: p.environment,
    language: p.language,
    fixed,
    redact: p.redact,
    inventory: p.inventory,
    findings: visible,
    notices: [...scanNotices, ...(p.manualReview || [])],
    rules: p.rules.filter((r) => visible.some((f) => f.ruleId === r.id)),
    guides: pickGuides(loadGuides(p.guidesDir), visible.map((f) => f.guide)),
  });
  const reports = writeReports(model, config);
  consoleReport.print(model, { quiet: config.quiet, reportFiles: reports });
  notices.list.length = 0; // already part of the report

  let exitCode = 0;
  if (config.failOn && visible.some((f) => atLeastSeverity(f.severity, config.failOn))) exitCode = 1;
  return { exitCode, reports, model };
}

/** Runs the opt-in live checks with console messages; returns null when --url was not given. */
async function runLiveStage({ config, project, notices, exposed = [], pages = [] }) {
  if (!config.liveUrl) return null;
  if (!config.quiet) console.log(ansi.paint(`Live checks: ${config.liveUrl} (read-only GET/HEAD requests)`, 'cyan'));
  if (config.allowRemote) console.error(ansi.paint('--allow-remote: live checks may contact a non-local host. Only scan sites you own or are authorized to test.', 'yellow'));
  return runLiveChecks({
    url: config.liveUrl,
    allowRemote: config.allowRemote,
    project,
    exposed,
    pages,
    notices,
    log: (m) => { if (!config.quiet) console.log(ansi.paint(m, 'yellow')); },
  });
}

/** Suggests --url when the scanned folder sits in an XAMPP-style htdocs folder. */
function liveUrlHint(projectRoot, notices) {
  const inHtdocs = /[\\/]htdocs(?:[\\/](.*))?$/i.exec(projectRoot);
  if (!inHtdocs) return;
  const rel = (inHtdocs[1] || '').split(/[\\/]/).filter(Boolean).map(encodeURIComponent).join('/');
  notices.add('info', `To also check the running site (security headers, cookies, downloadable files), start Apache and add --url http://localhost/${rel ? `${rel}/` : ''} to the command. Live checks only send read-only GET and HEAD requests.`);
}

module.exports = {
  CONF, CONTEXT_TEXT, sinkLabel, taintMessage, createFindingMaker, taintFinding, applyLiveResults,
  ruleSelected, finishScan, maxSeverity, liveUrlHint, runLiveStage,
};
