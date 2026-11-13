'use strict';
/*
 * Report output: writes every requested format and returns the written paths.
 */
const fs = require('fs');
const path = require('path');

const FORMATS = {
  html: () => require('./html'),
  json: () => require('./json'),
};

/**
 * @param {object} model report model (core/report/model.js)
 * @param {object} config resolved configuration
 * @returns {string[]} written file paths
 */
function writeReports(model, config) {
  const written = [];
  for (const format of config.formats) {
    const factory = FORMATS[format];
    if (!factory) continue;
    const renderer = factory();
    const file = format === 'html' ? config.htmlPath : path.join(config.outDir, renderer.fileName);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, renderer.render(model));
    written.push(file);
  }
  return written;
}

module.exports = { writeReports, FORMATS };
