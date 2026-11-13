'use strict';
/*
 * HTML report: a single self-contained file (no external resources).
 */
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

function pdfLink(model, pdf) {
  if (!pdf) return '';
  return pathToFileURL(path.join(model.asstRoot, pdf)).href;
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
  return `<table class="snippet">${rows.join('')}</table>`;
}

function traceHtml(f) {
  if (!f.trace || f.trace.length === 0) return '';
  const steps = f.trace.map((t) => `<li><span class="ln">line ${esc(t.line)}</span> ${esc(t.note)}</li>`);
  return `<details class="trace"><summary>Data flow (${f.trace.length} step${f.trace.length > 1 ? 's' : ''})</summary><ol>${steps.join('')}</ol></details>`;
}

function findingHtml(model, f) {
  const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : 'Project';
  const links = [
    f.pdf ? `<a href="${esc(pdfLink(model, f.pdf))}" target="_blank" rel="noopener">How to fix it (guide)</a>` : '',
    f.cwe ? `<a href="${esc(cweLink(f.cwe))}" target="_blank" rel="noopener noreferrer">${esc(f.cwe)}</a>` : '',
  ].filter(Boolean).join(' · ');
  return `<article class="finding sev-${esc(f.severity)}">
  <header><span class="badge ${esc(f.severity)}">${esc(f.severity)}</span> <strong>${esc(f.title)}</strong> <span class="where">${esc(where)}</span></header>
  <p>${esc(f.message)}</p>
  ${snippetHtml(f)}
  ${traceHtml(f)}
  <footer>${links}<span class="meta">${esc(f.ruleId)} · confidence ${esc(f.confidence)}</span></footer>
</article>`;
}

function render(model) {
  const byCat = new Map();
  for (const f of model.findings) {
    const key = f.category || 'Other';
    if (!byCat.has(key)) byCat.set(key, []);
    byCat.get(key).push(f);
  }
  const cats = [...byCat.keys()].sort();
  const s = model.summary;
  const sevCells = SEVERITIES.map((sev) => `<div class="tile ${sev}"><b>${s.bySeverity[sev] || 0}</b><span>${sev}</span></div>`).join('');
  const env = model.environment || {};
  const envRows = [];
  if (env.php) envRows.push(`<li>PHP ${esc(env.php.php)}${env.php.phpLifecycle && env.php.phpLifecycle.eol ? ` (security support until ${esc(env.php.phpLifecycle.eol)})` : ''}, libxml ${esc(env.php.libxml || 'unknown')}</li>`);
  if (env.database) envRows.push(`<li>Database: ${esc(env.database.version)}</li>`);
  for (const ps of env.passwordStorage || []) envRows.push(`<li>Password storage in ${esc(ps.table)}: ${esc(ps.kind || ps.error)}</li>`);
  const notices = model.notices.map((n) => `<li class="notice ${esc(n.kind)}">${n.guide ? `<strong>${esc(n.title || '')}</strong> ` : ''}${esc(n.message)}${n.pdf ? ` <a href="${esc(pdfLink(model, n.pdf))}" target="_blank" rel="noopener">Read more</a>` : ''}</li>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<title>ASST Report - ${esc(path.basename(model.scan.root))}</title>
<style>
:root { --bg:#f7f8f5; --card:#fff; --text:#1d2433; --muted:#5b6475; --border:#dde1e6; --code:#f3f4f6; --hit:#fff3c4;
  --critical:#7b1fa2; --high:#c62828; --medium:#ef6c00; --low:#0277bd; --info:#607d8b; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--text); font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
main { max-width:1100px; margin:0 auto; padding:24px 16px 64px; }
h1 { color:#2e7d32; margin:0 0 4px; } h2 { margin:32px 0 12px; border-bottom:2px solid var(--border); padding-bottom:6px; }
.sub { color:var(--muted); margin:0 0 20px; }
.tiles { display:flex; flex-wrap:wrap; gap:10px; margin:16px 0; }
.tile { background:var(--card); border:1px solid var(--border); border-top:4px solid var(--info); border-radius:8px; padding:10px 16px; min-width:110px; }
.tile b { display:block; font-size:24px; } .tile span { color:var(--muted); text-transform:capitalize; }
.tile.critical { border-top-color:var(--critical); } .tile.high { border-top-color:var(--high); } .tile.medium { border-top-color:var(--medium); } .tile.low { border-top-color:var(--low); }
.finding { background:var(--card); border:1px solid var(--border); border-left:5px solid var(--info); border-radius:8px; padding:12px 16px; margin:12px 0; }
.finding.sev-critical { border-left-color:var(--critical); } .finding.sev-high { border-left-color:var(--high); } .finding.sev-medium { border-left-color:var(--medium); } .finding.sev-low { border-left-color:var(--low); }
.finding header { display:flex; flex-wrap:wrap; gap:8px; align-items:baseline; }
.where { color:var(--muted); font-family:ui-monospace,Consolas,monospace; font-size:13px; word-break:break-all; }
.badge { color:#fff; border-radius:4px; padding:1px 8px; font-size:12px; text-transform:uppercase; background:var(--info); }
.badge.critical { background:var(--critical); } .badge.high { background:var(--high); } .badge.medium { background:var(--medium); } .badge.low { background:var(--low); }
.snippet { width:100%; border-collapse:collapse; background:var(--code); border-radius:6px; overflow:hidden; font:13px/1.45 ui-monospace,Consolas,monospace; }
.snippet td { padding:0 8px; white-space:pre-wrap; word-break:break-all; vertical-align:top; }
.snippet .ln { width:1%; color:var(--muted); text-align:right; user-select:none; }
.snippet tr.hit td { background:var(--hit); }
.trace { margin:8px 0; color:var(--muted); } .trace ol { margin:6px 0; }
footer { display:flex; flex-wrap:wrap; gap:12px; justify-content:space-between; margin-top:8px; font-size:13px; }
footer .meta { color:var(--muted); }
a { color:#1565c0; }
ul.env, ul.notices { background:var(--card); border:1px solid var(--border); border-radius:8px; padding:12px 32px; }
.notice.warning { color:#8d5a00; }
@media print { .trace { display:block; } a { color:inherit; } }
</style>
</head>
<body>
<main>
<h1>ASST Report</h1>
<p class="sub">${esc(model.scan.root)} · ${esc(new Date(model.scan.finishedAt).toLocaleString())} · ${esc(model.scan.filesScanned)} files · OWASP ASST ${esc(model.tool.version)}</p>
<div class="tiles">${sevCells}</div>
<p>${s.total} finding${s.total === 1 ? '' : 's'}${s.hidden ? `, ${s.hidden} more below the reporting threshold` : ''}${s.suppressed ? `, ${s.suppressed} suppressed` : ''}.</p>
${envRows.length ? `<h2>Environment</h2><ul class="env">${envRows.join('')}</ul>` : ''}
${cats.map((c) => `<h2>${esc(CATEGORY_NAMES[c] || c)} <small>(${byCat.get(c).length})</small></h2>\n${byCat.get(c).map((f) => findingHtml(model, f)).join('\n')}`).join('\n')}
${s.total === 0 ? '<p>No findings at the current reporting threshold.</p>' : ''}
${notices ? `<h2>Notes and manual review</h2><ul class="notices">${notices}</ul>` : ''}
</main>
</body>
</html>
`;
}

module.exports = { render, extension: 'html', fileName: 'report.html', esc };
