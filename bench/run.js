#!/usr/bin/env node
'use strict';
/*
 * ASST benchmark: precision / recall / F1 and throughput on labeled PHP datasets.
 *
 *   node bench/run.js [--datasets fixtures,fixtures-app,dvwa,sard] [--versions v1,head]
 *                     [--sard-sample 2000] [--v1-ref v1.0.0] [--min-confidence medium]
 *                     [--write-results] [--json <file>]
 *                     [--check-baseline <file>] [--update-baseline <file>]
 *
 * Datasets are downloaded into bench/.work/ (git-ignored) and are never executed.
 */
const fs = require('fs');
const path = require('path');
const { ensureDataset, sardIndex, sampleSard, materializeSard, REPO_ROOT, log } = require('./lib/datasets');
const { prepareVersion, scan } = require('./lib/runner');
const { scoreLineLevel, scoreFileLevel, fmt } = require('./lib/metrics');
const { loadExpectations, walk } = require('../test/helpers/expectations');

const CONFIDENCE_RANK = { low: 0, medium: 1, high: 2 };
const VERSION_LABEL = { v1: 'v1.0 (line-based engine)', head: 'v2 (current branch)' };

function parseArgs(argv) {
  const opts = {
    datasets: ['fixtures', 'fixtures-app', 'dvwa', 'sard'],
    versions: ['v1', 'head'],
    sardSample: 2000,
    v1Ref: 'v1.0.0',
    minConfidence: 'medium',
    writeResults: false,
    json: null,
    checkBaseline: null,
    updateBaseline: null,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--datasets') opts.datasets = next().split(',').filter(Boolean);
    else if (a === '--versions') opts.versions = next().split(',').filter(Boolean);
    else if (a === '--sard-sample') opts.sardSample = Number(next());
    else if (a === '--v1-ref') opts.v1Ref = next();
    else if (a === '--min-confidence') opts.minConfidence = next();
    else if (a === '--write-results') opts.writeResults = true;
    else if (a === '--json') opts.json = next();
    else if (a === '--check-baseline') opts.checkBaseline = next();
    else if (a === '--update-baseline') opts.updateBaseline = next();
    else if (a === '--help' || a === '-h') {
      process.stdout.write(fs.readFileSync(__filename, 'utf8').split('*/')[0] + '*/\n');
      process.exit(0);
    } else throw new Error(`unknown option ${a}`);
  }
  return opts;
}

async function loadTruth(name, opts) {
  if (name === 'fixtures' || name === 'fixtures-app') {
    const dir = await ensureDataset(name);
    return { dir, kind: 'line', truth: loadExpectations(dir) };
  }
  if (name === 'dvwa') {
    const dir = await ensureDataset('dvwa');
    const truth = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'bench', 'truth', 'dvwa.json'), 'utf8'));
    return { dir, kind: 'file', cases: truth.cases };
  }
  if (name === 'sard') {
    const full = await ensureDataset('sard');
    const all = sardIndex(full);
    const cases = sampleSard(all, opts.sardSample);
    const label = opts.sardSample > 0 && opts.sardSample < all.length ? `sample-${opts.sardSample}` : 'full';
    const dir = materializeSard(full, cases, label);
    return { dir, kind: 'file', cases, note: `${cases.length} of ${all.length} cases (${label})` };
  }
  if (name === 'wordpress') {
    const dir = await ensureDataset('wordpress');
    return { dir, kind: 'none' };
  }
  throw new Error(`unknown dataset ${name}`);
}

function filterConfidence(findings, min) {
  const floor = CONFIDENCE_RANK[min] ?? 1;
  return findings.filter((f) => (CONFIDENCE_RANK[f.confidence] ?? 2) >= floor);
}

function renderMarkdown(results, opts) {
  const lines = [];
  lines.push('# ASST benchmark results', '');
  lines.push(`Generated ${results.generatedAt} on ${results.platform}, Node ${results.node}. ` +
    `Findings counted at confidence ≥ ${opts.minConfidence}. Reproduce with \`npm run bench\`.`, '');
  lines.push('Precision = TP/(TP+FP), Recall = TP/(TP+FN), F1 = harmonic mean (percent).', '');
  for (const [name, data] of Object.entries(results.datasets)) {
    lines.push(`## ${name}`, '');
    if (data.note) lines.push(data.note, '');
    lines.push('| Version | Precision | Recall | F1 | TP | FP | FN | Time (s) | Files/s | Peak RSS (MB) |');
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const [version, r] of Object.entries(data.versions)) {
      const o = r.metrics ? r.metrics.overall : null;
      const secs = r.stats.ms != null ? r.stats.ms / 1000 : null;
      const fps = secs ? (data.fileCount / secs).toFixed(0) : '–';
      lines.push(`| ${VERSION_LABEL[version] || version} | ${o ? fmt(o.precision) : '–'} | ${o ? fmt(o.recall) : '–'} | ${o ? fmt(o.f1) : '–'} | ` +
        `${o ? o.tp : '–'} | ${o ? o.fp : '–'} | ${o ? o.fn : '–'} | ${secs != null ? secs.toFixed(1) : '–'} | ${fps} | ` +
        `${r.stats.maxRssKB ? (r.stats.maxRssKB / 1024).toFixed(0) : '–'} |`);
    }
    const versions = Object.keys(data.versions);
    const cwes = new Set();
    for (const v of versions) if (data.versions[v].metrics) Object.keys(data.versions[v].metrics.perCwe).forEach((c) => cwes.add(c));
    if (cwes.size) {
      lines.push('', `| CWE | ${versions.map((v) => `${VERSION_LABEL[v] || v} P / R / F1`).join(' | ')} |`);
      lines.push(`|---|${versions.map(() => '---:').join('|')}|`);
      for (const cwe of [...cwes].sort((a, b) => Number(a.slice(4)) - Number(b.slice(4)))) {
        const cells = versions.map((v) => {
          const m = data.versions[v].metrics && data.versions[v].metrics.perCwe[cwe];
          return m ? `${fmt(m.precision)} / ${fmt(m.recall)} / ${fmt(m.f1)}` : '–';
        });
        lines.push(`| ${cwe} | ${cells.join(' | ')} |`);
      }
    }
    lines.push('');
  }
  return lines.join('\n');
}

function compareBaseline(results, baselineFile) {
  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
  const failures = [];
  for (const [name, base] of Object.entries(baseline.datasets || {})) {
    const cur = results.datasets[name] && results.datasets[name].versions.head;
    if (!cur || !cur.metrics) continue;
    const tolerance = baseline.tolerance ?? 0.02;
    if (base.f1 != null && (cur.metrics.overall.f1 ?? 0) < base.f1 - tolerance) {
      failures.push(`${name}: overall F1 ${fmt(cur.metrics.overall.f1)} < baseline ${fmt(base.f1)}`);
    }
    for (const [cwe, f1] of Object.entries(base.perCwe || {})) {
      const m = cur.metrics.perCwe[cwe];
      if (f1 != null && m && (m.f1 ?? 0) < f1 - tolerance) failures.push(`${name} ${cwe}: F1 ${fmt(m.f1)} < baseline ${fmt(f1)}`);
    }
  }
  return failures;
}

function baselineFrom(results) {
  const out = { tolerance: 0.02, datasets: {} };
  for (const [name, data] of Object.entries(results.datasets)) {
    const head = data.versions.head || data.versions.v1;
    if (!head || !head.metrics) continue;
    const perCwe = {};
    for (const [cwe, m] of Object.entries(head.metrics.perCwe)) perCwe[cwe] = m.f1 == null ? null : Number(m.f1.toFixed(4));
    out.datasets[name] = { f1: head.metrics.overall.f1 == null ? null : Number(head.metrics.overall.f1.toFixed(4)), perCwe };
  }
  return out;
}

async function main() {
  const opts = parseArgs(process.argv);
  const results = { generatedAt: new Date().toISOString(), platform: `${process.platform}-${process.arch}`, node: process.versions.node, datasets: {} };
  const prepared = {};
  for (const v of opts.versions) prepared[v] = prepareVersion(v, { v1Ref: opts.v1Ref });

  for (const name of opts.datasets) {
    const ds = await loadTruth(name, opts);
    const fileCount = walk(ds.dir).filter((f) => !f.startsWith('.git/')).length;
    results.datasets[name] = { note: ds.note || null, fileCount, versions: {} };
    for (const v of opts.versions) {
      log(`${name}: scanning with ${v} (${prepared[v].mode} engine)`);
      const out = scan(prepared[v], ds.dir, name);
      const findings = filterConfidence(out.findings, opts.minConfidence);
      let metrics = null;
      if (ds.kind === 'line') metrics = scoreLineLevel(ds.truth, findings);
      else if (ds.kind === 'file') metrics = scoreFileLevel(ds.cases, findings);
      results.datasets[name].versions[v] = { metrics, stats: { ms: out.stats.ms, maxRssKB: out.stats.maxRssKB, exitCode: out.stats.exitCode }, findings: findings.length };
      const o = metrics ? metrics.overall : null;
      log(`${name}/${v}: ${findings.length} findings` + (o ? `, P=${fmt(o.precision)} R=${fmt(o.recall)} F1=${fmt(o.f1)}` : '') +
        `, ${(out.stats.ms / 1000).toFixed(1)}s`);
    }
  }

  const md = renderMarkdown(results, opts);
  process.stdout.write(md + '\n');
  if (opts.writeResults) fs.writeFileSync(path.join(REPO_ROOT, 'bench', 'RESULTS.md'), md + '\n');
  if (opts.json) fs.writeFileSync(opts.json, JSON.stringify(results, null, 2));
  if (opts.updateBaseline) fs.writeFileSync(opts.updateBaseline, JSON.stringify(baselineFrom(results), null, 2) + '\n');
  if (opts.checkBaseline) {
    const failures = compareBaseline(results, opts.checkBaseline);
    if (failures.length) {
      process.stderr.write(`Benchmark regression:\n  ${failures.join('\n  ')}\n`);
      process.exit(1);
    }
    log('benchmark is within baseline tolerance');
  }
}

if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`${err.stack || err}\n`);
    process.exit(2);
  });
}

module.exports = { renderMarkdown, compareBaseline, baselineFrom, filterConfidence };
