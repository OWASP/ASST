'use strict';
/*
 * JSON report: the complete, versioned, machine-readable scan result.
 */

function render(model) {
  const { asstRoot, guides, ...rest } = model;
  void asstRoot;
  void guides;
  return `${JSON.stringify(rest, null, 2)}\n`;
}

module.exports = { render, extension: 'json', fileName: 'report.json' };
