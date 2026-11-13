'use strict';
/*
 * PHP taint analysis entry points.
 *
 *   analyzeFile(text, rel)      one file on its own (tests, quick checks)
 *   analyzeProject(files, ...)  whole project: every file is parsed once, then each
 *                               file is analyzed as an entry point with includes,
 *                               functions and classes resolved across the project
 */
const { parsePhp } = require('./parse');
const { lower } = require('./lower');
const { catalog: baseCatalog } = require('./catalog');
const { Interpreter } = require('../../../core/taint/interpreter');
const { analyzeProject: analyzeFiles } = require('../../../core/taint/project');

/**
 * @param {string} text PHP source
 * @param {string} rel path relative to the scanned folder
 * @param {{secondOrder?:boolean, assumeParamsTainted?:boolean, catalog?:object, budget?:number}} options
 */
function analyzeFile(text, rel, options = {}) {
  const parsed = parsePhp(text, rel);
  if (!parsed.ast) return { status: 'failed', error: parsed.error, ast: null, hits: [], exhausted: false };
  let program;
  try {
    program = lower(parsed.ast, rel);
  } catch (err) {
    return { status: 'failed', error: `lowering: ${err.message}`, ast: parsed.ast, hits: [], exhausted: false };
  }
  const interpreter = new Interpreter(program, options.catalog || baseCatalog, options);
  let result;
  try {
    result = interpreter.run();
  } catch (err) {
    return { status: parsed.status, error: `analysis: ${err.message}`, ast: parsed.ast, hits: [], exhausted: true };
  }
  const hits = result.hits.map((h) => ({ ...h, entries: [...h.entries], conf: parsed.status === 'recovered' ? 2 : h.conf }));
  return { status: parsed.status, error: parsed.error, ast: parsed.ast, hits, exhausted: result.exhausted };
}

/**
 * @param {Array<{rel:string, text:string}>} files PHP files of the project
 * @param {object} options interpreter options (secondOrder, catalog, ...)
 * @param {(rel:string, ast:object|null, parsed:{status,error})=>void} [onParsed] called once per file
 * @returns {{hits:Array, status:Map<string,{status,error}>, exhausted:number}}
 */
function analyzeProject(files, options = {}, onParsed) {
  return analyzeFiles(files, { parse: parsePhp, lower, catalog: options.catalog || baseCatalog }, options, onParsed);
}

module.exports = { analyzeFile, analyzeProject };
