'use strict';
/*
 * Console summary printed at the end of a scan.
 */
const ansi = require('../ansi');
const { SEVERITIES } = require('../finding');

const COLOR = { critical: 'magenta', high: 'red', medium: 'yellow', low: 'cyan', info: 'gray' };

function print(model, { quiet, reportFiles, maxListed = 15 }) {
  const out = [];
  const s = model.summary;
  if (!quiet) {
    out.push('');
    out.push(ansi.paint(`ASST ${model.tool.version} - ${model.scan.filesScanned} files scanned in ${(model.scan.durationMs / 1000).toFixed(1)} s`, 'bold'));
    out.push('');
    const listed = model.findings.slice(0, maxListed);
    for (const f of listed) {
      const where = f.file ? `${f.file}${f.line ? `:${f.line}` : ''}` : '(project)';
      out.push(`  ${ansi.paint(f.severity.toUpperCase().padEnd(8), COLOR[f.severity], 'bold')} ${f.title}  ${ansi.paint(where, 'gray')}`);
    }
    if (model.findings.length > listed.length) out.push(ansi.paint(`  ... and ${model.findings.length - listed.length} more in the report`, 'gray'));
    out.push('');
  }
  const counts = SEVERITIES.filter((sev) => s.bySeverity[sev]).map((sev) => ansi.paint(`${s.bySeverity[sev]} ${sev}`, COLOR[sev], 'bold'));
  out.push(`Findings: ${s.total}${counts.length ? ` (${counts.join(', ')})` : ''}`);
  const inv = model.inventory && model.inventory.packages;
  if (inv && inv.length) out.push(ansi.paint(`Components: ${inv.length} (${inv.filter((c) => c.advisories).length} with advisories, ${inv.filter((c) => c.lifecycle === 'eol').length} end of life; advisories from ${model.inventory.advisorySource})`, 'gray'));
  if (s.hidden) out.push(ansi.paint(`${s.hidden} lower-confidence or lower-severity findings hidden (see --min-confidence / --min-severity).`, 'gray'));
  if (s.suppressed) out.push(ansi.paint(`${s.suppressed} findings suppressed by asst-ignore comments.`, 'gray'));
  if (s.fixed !== null) out.push(ansi.paint(`Compared with the baseline: ${model.findings.filter((f) => f.baseline === 'new').length} new, ${s.fixed} fixed.`, 'cyan'));
  for (const file of reportFiles || []) out.push(ansi.paint(`Report: ${file}`, 'cyan', 'bold'));
  console.log(out.join('\n'));
}

module.exports = { print };
