'use strict';
/*
 * HTML report: one self-contained file (no external resources, works offline).
 * Content is rendered on the server side; a small inline script adds filtering,
 * search, grouping and a dark-mode toggle. The script is allowed by its SHA-256
 * hash in the Content-Security-Policy, so no other script can run in the report.
 */
const crypto = require('crypto');
const path = require('path');
const { pathToFileURL } = require('url');
const { SEVERITIES } = require('../finding');

const CATEGORY_NAMES = {
  'A01:2025': 'A01:2025 Broken Access Control',
  'A02:2025': 'A02:2025 Security Misconfiguration',
  'A03:2025': 'A03:2025 Software Supply Chain Failures',
  'A04:2025': 'A04:2025 Cryptographic Failures',
  'A05:2025': 'A05:2025 Injection',
  'A06:2025': 'A06:2025 Insecure Design',
  'A07:2025': 'A07:2025 Authentication Failures',
  'A08:2025': 'A08:2025 Software or Data Integrity Failures',
  'A09:2025': 'A09:2025 Security Logging & Alerting Failures',
  'A10:2025': 'A10:2025 Mishandling of Exceptional Conditions',
};

function esc(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function fileUrl(model, rel) {
  return rel ? pathToFileURL(path.join(model.asstRoot, rel)).href : '';
}

function cweLink(cwe) {
  const n = String(cwe || '').replace(/\D/g, '');
  return n ? `https://cwe.mitre.org/data/definitions/${n}.html` : '';
}

function snippetHtml(f) {
  if (!f.snippet) return '';
  const rows = f.snippet.lines.map((text, i) => {
    const n = f.snippet.startLine + i;
    return `<tr${n === f.line ? ' class="hit"' : ''}><td class="ln">${n}</td><td><code>${esc(text) || ' '}</code></td></tr>`;
  });
  return `<table class="snippet" aria-label="Code around line ${esc(f.line)}">${rows.join('')}</table>`;
}

function traceHtml(f) {
  if (!f.trace || f.trace.length === 0) return '';
  const steps = f.trace.map((t) => `<li><span class="muted">line ${esc(t.line)}</span> ${esc(t.note)}</li>`);
  return `<div class="trace"><h4>Data flow</h4><ol>${steps.join('')}</ol></div>`;
}

function guideHtml(model, f) {
  const guide = model.guides && f.guide ? model.guides[f.guide] : null;
  if (!guide) return '';
  return `<div class="guide"><h4>How to fix it</h4>${guide.html}</div>`;
}

function findingHtml(model, f, idx) {
  const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : (f.url || 'Project');
  const text = `${f.title} ${f.file || ''} ${f.url || ''} ${f.message} ${f.ruleId} ${f.cwe || ''}`.toLowerCase();
  const links = [
    f.pdf ? `<a href="${esc(fileUrl(model, f.pdf))}" target="_blank" rel="noopener">Full guide (PDF)</a>` : '',
    f.cwe ? `<a href="${esc(cweLink(f.cwe))}" target="_blank" rel="noopener noreferrer">${esc(f.cwe)}</a>` : '',
  ].filter(Boolean).join(' · ');
  const isNew = f.baseline === 'new' ? '<span class="tag new">new</span>' : '';
  return `<details class="finding sev-${esc(f.severity)}" id="f${idx}" data-sev="${esc(f.severity)}" data-conf="${esc(f.confidence)}" data-cat="${esc(f.category || 'Other')}" data-file="${esc(f.file || '(project)')}" data-rule="${esc(f.ruleId)}" data-text="${esc(text)}">
<summary><span class="badge ${esc(f.severity)}">${esc(f.severity)}</span> <strong>${esc(f.title)}</strong> ${isNew}<span class="where">${esc(where)}</span></summary>
<div class="body">
<p>${esc(f.message)}</p>
${snippetHtml(f)}
${traceHtml(f)}
${guideHtml(model, f)}
<footer><span>${links}</span><span class="muted">${esc(f.ruleId)} · ${esc(CATEGORY_NAMES[f.category] || f.category || '')} · confidence ${esc(f.confidence)}</span></footer>
</div>
</details>`;
}

const SCRIPT = `
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var items = $$('.finding');
  var list = $('#findings');
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var theme = store.get('asst-theme');
  if (theme) document.documentElement.setAttribute('data-theme', theme);
  $('#theme').addEventListener('click', function () {
    var dark = document.documentElement.getAttribute('data-theme') === 'dark' || (!document.documentElement.getAttribute('data-theme') && matchMedia('(prefers-color-scheme: dark)').matches);
    var next = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set('asst-theme', next);
  });
  function apply() {
    var q = $('#q').value.trim().toLowerCase();
    var sev = $$('.sevf:checked').map(function (c) { return c.value; });
    var conf = $('#conf').value;
    var cat = $('#cat').value;
    var shown = 0;
    items.forEach(function (el) {
      var ok = sev.indexOf(el.dataset.sev) !== -1 &&
        (conf === 'all' || (conf === 'high' ? el.dataset.conf === 'high' : el.dataset.conf !== 'low')) &&
        (cat === 'all' || el.dataset.cat === cat) &&
        (!q || el.dataset.text.indexOf(q) !== -1);
      el.hidden = !ok;
      if (ok) shown++;
    });
    $$('.group').forEach(function (g) { g.hidden = !$$('.finding', g).some(function (el) { return !el.hidden; }); });
    $('#count').textContent = shown + ' of ' + items.length + ' shown';
  }
  function group(by) {
    var keyOf = { category: function (el) { return el.dataset.cat; }, file: function (el) { return el.dataset.file; }, rule: function (el) { return el.dataset.rule; } }[by];
    var labels = {};
    $$('[data-cat-label]').forEach(function (o) { labels[o.value] = o.textContent; });
    var groups = {};
    items.forEach(function (el) { var k = keyOf(el); (groups[k] = groups[k] || []).push(el); });
    list.innerHTML = '';
    Object.keys(groups).sort().forEach(function (k) {
      var sec = document.createElement('section');
      sec.className = 'group';
      var h = document.createElement('h2');
      h.textContent = (by === 'category' && labels[k] ? labels[k] : k) + ' (' + groups[k].length + ')';
      sec.appendChild(h);
      groups[k].forEach(function (el) { sec.appendChild(el); });
      list.appendChild(sec);
    });
    apply();
  }
  $('#q').addEventListener('input', apply);
  $$('.sevf').forEach(function (c) { c.addEventListener('change', apply); });
  $('#conf').addEventListener('change', apply);
  $('#cat').addEventListener('change', apply);
  $('#group').addEventListener('change', function () { group(this.value); });
  $('#expand').addEventListener('click', function () { var open = !items.some(function (el) { return el.open; }); items.forEach(function (el) { if (!el.hidden) el.open = open; }); });
  $$('.tile[data-sev]').forEach(function (t) { t.addEventListener('click', function () { $$('.sevf').forEach(function (c) { c.checked = c.value === t.dataset.sev; }); apply(); }); });
  window.addEventListener('beforeprint', function () { items.forEach(function (el) { el.open = true; }); });
  if (location.hash) { var target = document.getElementById(location.hash.slice(1)); if (target && target.tagName === 'DETAILS') target.open = true; }
  apply();
})();
`;

const STYLE = `
:root { --bg:#f6f7f9; --card:#fff; --text:#1d2433; --muted:#5b6475; --border:#dde1e6; --code:#f1f3f5; --hit:#fff1b8; --link:#1557b0; --accent:#2e7d32;
  --critical:#7b1fa2; --high:#c62828; --medium:#b45309; --low:#0277bd; --info:#607d8b; color-scheme: light; }
:root[data-theme="dark"] { --bg:#11151c; --card:#1a2029; --text:#e6e9ee; --muted:#9aa4b2; --border:#2c3440; --code:#141920; --hit:#4a3f12; --link:#7fb0ff; --accent:#66bb6a; color-scheme: dark; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#11151c; --card:#1a2029; --text:#e6e9ee; --muted:#9aa4b2; --border:#2c3440; --code:#141920; --hit:#4a3f12; --link:#7fb0ff; --accent:#66bb6a; color-scheme: dark; } }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
main { max-width:1120px; margin:0 auto; padding:24px 16px 64px; }
a { color:var(--link); }
h1 { margin:0; font-size:26px; } h1 span { color:var(--accent); }
h2 { margin:28px 0 10px; font-size:19px; } h4 { margin:12px 0 4px; font-size:14px; }
.muted { color:var(--muted); }
.top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; }
button, select, input { font:inherit; color:var(--text); background:var(--card); border:1px solid var(--border); border-radius:6px; padding:5px 10px; }
button { cursor:pointer; }
.tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin:18px 0; }
.tile { background:var(--card); border:1px solid var(--border); border-top:4px solid var(--info); border-radius:8px; padding:10px 14px; cursor:pointer; }
.tile b { display:block; font-size:24px; } .tile span { color:var(--muted); text-transform:capitalize; }
.tile.critical { border-top-color:var(--critical); } .tile.high { border-top-color:var(--high); } .tile.medium { border-top-color:var(--medium); } .tile.low { border-top-color:var(--low); }
.bar { position:sticky; top:0; z-index:2; display:flex; flex-wrap:wrap; gap:8px; align-items:center; background:var(--bg); padding:10px 0; border-bottom:1px solid var(--border); }
.bar input[type=search] { flex:1 1 220px; }
.bar label { white-space:nowrap; }
.finding { background:var(--card); border:1px solid var(--border); border-left:5px solid var(--info); border-radius:8px; margin:10px 0; }
.finding > summary { cursor:pointer; padding:10px 14px; display:flex; flex-wrap:wrap; gap:8px; align-items:baseline; list-style:none; }
.finding > summary::-webkit-details-marker { display:none; }
.finding > summary::before { content:"▸"; color:var(--muted); } .finding[open] > summary::before { content:"▾"; }
.finding .body { padding:0 14px 12px; }
.finding.sev-critical { border-left-color:var(--critical); } .finding.sev-high { border-left-color:var(--high); } .finding.sev-medium { border-left-color:var(--medium); } .finding.sev-low { border-left-color:var(--low); }
.where { color:var(--muted); font-family:ui-monospace,Consolas,monospace; font-size:13px; word-break:break-all; margin-left:auto; }
.badge { color:#fff; border-radius:4px; padding:1px 8px; font-size:12px; text-transform:uppercase; background:var(--info); }
.badge.critical { background:var(--critical); } .badge.high { background:var(--high); } .badge.medium { background:var(--medium); } .badge.low { background:var(--low); }
.tag { font-size:12px; border:1px solid var(--border); border-radius:10px; padding:0 8px; } .tag.new { border-color:var(--high); color:var(--high); }
.snippet { width:100%; border-collapse:collapse; background:var(--code); border-radius:6px; overflow:hidden; font:13px/1.45 ui-monospace,Consolas,monospace; }
.snippet td { padding:0 8px; white-space:pre-wrap; word-break:break-all; vertical-align:top; }
.snippet .ln { width:1%; color:var(--muted); text-align:right; user-select:none; white-space:nowrap; word-break:normal; }
.snippet tr.hit td { background:var(--hit); }
.trace ol, .guide { margin:4px 0; }
.guide { background:var(--code); border-radius:6px; padding:4px 14px 10px; }
.guide pre { overflow:auto; background:var(--card); padding:8px; border-radius:4px; }
footer { display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; margin-top:10px; font-size:13px; }
.panel { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:10px 18px; }
.panel li { margin:4px 0; }
.notice.warning { color:var(--medium); }
.fixed li { text-decoration:line-through; color:var(--muted); }
.inv { width:100%; border-collapse:collapse; margin-top:8px; font-size:13px; } .inv th, .inv td { text-align:left; padding:3px 8px; border-bottom:1px solid var(--border); } .inv .where { margin:0; }
@media print { .bar, #theme, #expand { display:none; } .finding { break-inside:avoid; } a { color:inherit; } }
`;

function render(model) {
  const s = model.summary;
  const tiles = SEVERITIES.map((sev) => `<div class="tile ${sev}" data-sev="${sev}" title="Show only ${sev}"><b>${s.bySeverity[sev] || 0}</b><span>${sev}</span></div>`).join('');
  const cats = [...new Set(model.findings.map((f) => f.category || 'Other'))].sort();
  const byCat = cats.map((c) => {
    const list = model.findings.map((f, i) => [f, i]).filter(([f]) => (f.category || 'Other') === c);
    return `<section class="group"><h2>${esc(CATEGORY_NAMES[c] || c)} (${list.length})</h2>\n${list.map(([f, i]) => findingHtml(model, f, i)).join('\n')}</section>`;
  }).join('\n');

  const env = model.environment || {};
  const envRows = [];
  if (env.php) envRows.push(`<li>PHP ${esc(env.php.php)}${env.php.phpLifecycle && env.php.phpLifecycle.eol ? ` (security support until ${esc(env.php.phpLifecycle.eol)})` : ''}, libxml ${esc(env.php.libxml || 'unknown')}</li>`);
  if (env.database) envRows.push(`<li>Database: ${esc(env.database.version)}</li>`);
  for (const ps of env.passwordStorage || []) envRows.push(`<li>Password storage in ${esc(ps.table)}: ${esc(ps.kind || ps.error)}</li>`);
  if (env.live) envRows.push(`<li>Live checks: ${esc(env.live.url)} · ${esc(env.live.requests)} read-only requests (${esc((env.live.methods || []).join(', '))})${env.live.server ? ` · server: ${esc(env.live.server)}` : ''}</li>`);
  for (const [k, v] of Object.entries(env.frameworks || {})) envRows.push(`<li>Framework: ${esc(k)}${v ? ` ${esc(v)}` : ''}</li>`);
  const inv = model.inventory && model.inventory.packages ? model.inventory.packages : [];
  const invRows = inv.slice(0, 1000).map((c) => `<tr><td>${esc(c.name)}</td><td>${esc(c.version)}</td><td>${c.bundled ? 'bundled file' : c.dev ? 'dev dependency' : 'dependency'}</td><td class="where">${esc(c.file || '')}</td><td>${c.advisories === null || c.advisories === undefined ? '<span class="muted">-</span>' : c.advisories ? `<b>${esc(c.advisories)}</b>` : '0'}</td><td>${c.lifecycle === 'eol' ? '<b>end of life</b>' : esc(c.lifecycle || '')}</td></tr>`).join('');
  const notices = model.notices.map((n) => `<li class="notice ${esc(n.kind)}">${n.title ? `<strong>${esc(n.title)}:</strong> ` : ''}${esc(n.message)}${n.pdf ? ` <a href="${esc(fileUrl(model, n.pdf))}" target="_blank" rel="noopener">Guide</a>` : ''}</li>`).join('');
  const fixed = (model.fixed || []).map((f) => `<li>${esc(f.title)} <span class="muted">${esc(f.file || '')}${f.line ? `:${esc(f.line)}` : ''} · ${esc(f.ruleId)}</span></li>`).join('');
  const catOptions = cats.map((c) => `<option value="${esc(c)}" data-cat-label>${esc(CATEGORY_NAMES[c] || c)}</option>`).join('');
  const sevChecks = SEVERITIES.map((sev) => `<label><input type="checkbox" class="sevf" value="${sev}" checked> ${sev}</label>`).join(' ');
  const scriptHash = crypto.createHash('sha256').update(SCRIPT).digest('base64');
  const newCount = model.findings.filter((f) => f.baseline === 'new').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'sha256-${scriptHash}'; img-src data:">
<meta name="generator" content="OWASP ASST ${esc(model.tool.version)}">
<title>ASST Report - ${esc(path.basename(model.scan.root))}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<div class="top">
  <div><h1><span>ASST</span> Security Report</h1>
  <div class="muted">${esc(model.scan.root)} · ${esc(new Date(model.scan.finishedAt).toLocaleString())} · ${esc(model.scan.filesScanned)} files in ${(model.scan.durationMs / 1000).toFixed(1)} s · OWASP ASST ${esc(model.tool.version)}</div></div>
  <div><button id="expand" type="button">Expand / collapse all</button> <button id="theme" type="button" title="Toggle dark mode">◐</button></div>
</div>
<div class="tiles">${tiles}</div>
<p>${s.total} finding${s.total === 1 ? '' : 's'}${s.hidden ? `; ${s.hidden} more below the reporting threshold (--min-confidence / --min-severity)` : ''}${s.suppressed ? `; ${s.suppressed} suppressed with asst-ignore` : ''}${s.fixed !== null && s.fixed !== undefined ? `; compared with the baseline: ${newCount} new, ${s.fixed} fixed` : ''}.</p>
<div class="bar">
  <input id="q" type="search" placeholder="Search findings, files, rules..." aria-label="Search">
  ${sevChecks}
  <select id="conf" aria-label="Confidence"><option value="all">Any confidence</option><option value="medium">Medium or high</option><option value="high">High only</option></select>
  <select id="cat" aria-label="Category"><option value="all">All categories</option>${catOptions}</select>
  <select id="group" aria-label="Group by"><option value="category">Group by category</option><option value="file">Group by file</option><option value="rule">Group by rule</option></select>
  <span id="count" class="muted"></span>
</div>
<div id="findings">
${byCat || '<p>No findings at the current reporting threshold.</p>'}
</div>
${fixed ? `<h2>Fixed since the baseline (${model.fixed.length})</h2><ul class="panel fixed">${fixed}</ul>` : ''}
${envRows.length ? `<h2>Environment</h2><ul class="panel">${envRows.join('')}</ul>` : ''}
${inv.length ? `<h2>Components (${inv.length})</h2><details class="panel"><summary>Packages from lock files and bundled libraries · advisories: ${esc(model.inventory.advisorySource)}</summary><table class="inv"><thead><tr><th>Package</th><th>Version</th><th>Type</th><th>Found in</th><th>Advisories</th><th>Lifecycle</th></tr></thead><tbody>${invRows}</tbody></table>${inv.length > 1000 ? '<p class="muted">The JSON report lists every component.</p>' : ''}</details>` : ''}
${notices ? `<h2>Notes and manual review</h2><ul class="panel">${notices}</ul>` : ''}
<p class="muted">Generated by <a href="https://github.com/OWASP/ASST" target="_blank" rel="noopener noreferrer">OWASP ASST</a>. Findings are mapped to the OWASP Top 10:2025 and CWE.</p>
</main>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

module.exports = { render, extension: 'html', fileName: 'report.html', esc, SCRIPT, CATEGORY_NAMES };
