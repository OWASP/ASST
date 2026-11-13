'use strict';
/*
 * PHP taint analysis entry point: parse -> lower -> interpret.
 */
const { parsePhp } = require('./parse');
const { lower } = require('./lower');
const { catalog: baseCatalog } = require('./catalog');
const { Interpreter } = require('../../../core/taint/interpreter');

/**
 * @param {string} text PHP source
 * @param {string} rel path relative to the scanned folder
 * @param {{secondOrder?:boolean, assumeParamsTainted?:boolean, catalog?:object, budget?:number}} options
 * @returns {{status:string, error:string|null, ast:object|null, hits:Array, exhausted:boolean}}
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
  const hits = result.hits.map((h) => (parsed.status === 'recovered' ? { ...h, conf: 2 } : h));
  return { status: parsed.status, error: parsed.error, ast: parsed.ast, hits, exhausted: result.exhausted };
}

module.exports = { analyzeFile };
