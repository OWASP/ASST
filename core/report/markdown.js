'use strict';
/*
 * Markdown summary, e.g. for pull-request comments or CI job summaries.
 */
const { SEVERITIES } = require('../finding');

const ICON = { critical: '🟣', high: '🔴', medium: '🟠', low: '🔵', info: '⚪' };

function cell(s) {
  return String(s === undefined || s === null ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function render(model, { maxDetailed = 25 } = {}) {
  const s = model.summary;
  const out = [];
  out.push(`## OWASP ASST security report`, '');
  out.push(`Scanned **${model.scan.filesScanned}** files in ${(model.scan.durationMs / 1000).toFixed(1)} s with ASST ${model.tool.version}.`, '');
  out.push(`| ${SEVERITIES.map((sev) => `${ICON[sev]} ${sev}`).join(' | ')} | total |`);
  out.push(`|${SEVERITIES.map(() => '---:').join('|')}|---:|`);
  out.push(`| ${SEVERITIES.map((sev) => s.bySeverity[sev] || 0).join(' | ')} | **${s.total}** |`, '');
  if (s.fixed !== null && s.fixed !== undefined) {
    out.push(`Compared with the baseline: **${model.findings.filter((f) => f.baseline === 'new').length} new**, ${s.fixed} fixed.`, '');
  }
  if (model.findings.length) {
    out.push('| Severity | Finding | Location | Rule |', '|---|---|---|---|');
    for (const f of model.findings.slice(0, maxDetailed)) {
      const where = f.file ? `\`${cell(f.file)}${f.line ? `:${f.line}` : ''}\`` : 'project';
      out.push(`| ${ICON[f.severity]} ${f.severity} | ${cell(f.title)}${f.baseline === 'new' ? ' **(new)**' : ''} | ${where} | ${cell(f.ruleId)} (${cell(f.cwe)}) |`);
    }
    if (model.findings.length > maxDetailed) out.push('', `…and ${model.findings.length - maxDetailed} more in the full report.`);
    out.push('');
    out.push('<details><summary>Details</summary>', '');
    for (const f of model.findings.slice(0, maxDetailed)) {
      out.push(`#### ${ICON[f.severity]} ${cell(f.title)} - ${f.file ? `\`${cell(f.file)}${f.line ? `:${f.line}` : ''}\`` : 'project'}`, '');
      out.push(f.message, '');
      if (f.trace && f.trace.length > 1) out.push(`Data flow: ${f.trace.map((t) => `line ${t.line} ${t.note}`).join(' → ')}`, '');
    }
    out.push('</details>', '');
  } else {
    out.push('No findings at the current reporting threshold. ✅', '');
  }
  const inv = model.inventory && model.inventory.packages;
  if (inv && inv.length) {
    const vulnerable = inv.filter((c) => c.advisories).length;
    out.push(`Components: ${inv.length} packages and bundled libraries, ${vulnerable} with published advisories (${model.inventory.advisorySource}).`, '');
  }
  if (s.hidden) out.push(`_${s.hidden} lower-confidence or lower-severity findings are not listed._`, '');
  return `${out.join('\n')}\n`;
}

module.exports = { render, extension: 'md', fileName: 'report.md' };
