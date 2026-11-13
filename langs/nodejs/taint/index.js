'use strict';
/*
 * JavaScript / TypeScript taint analysis entry points (Node.js plugin).
 *
 *   analyzeFile(text, rel)      one file on its own (tests, quick checks)
 *   analyzeProject(files, ...)  whole project, with functions, classes and exported
 *                               module functions resolved across files
 */
const { parseJs } = require('./parse');
const { lower } = require('./lower');
const { catalog } = require('./catalog');
const { analyzeProject: analyzeFiles } = require('../../../core/taint/project');

const LANGUAGE = { parse: parseJs, lower, catalog };

function analyzeProject(files, options = {}, onParsed) {
  return analyzeFiles(files, { ...LANGUAGE, catalog: options.catalog || catalog }, options, onParsed);
}

function analyzeFile(text, rel, options = {}) {
  const res = analyzeProject([{ rel, text }], options);
  const st = res.status.get(rel) || { status: 'failed', error: null };
  return { status: st.status, error: st.error, hits: res.hits, exhausted: res.exhausted > 0 };
}

module.exports = { analyzeFile, analyzeProject, LANGUAGE };
