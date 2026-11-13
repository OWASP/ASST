'use strict';
/*
 * JSON report: the complete, versioned, machine-readable scan result.
 */

function render(model) {
  const { asstRoot, ...rest } = model;
  void asstRoot;
  return `${JSON.stringify(rest, null, 2)}\n`;
}

module.exports = { render, extension: 'json', fileName: 'report.json' };
