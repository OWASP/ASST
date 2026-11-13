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

function push(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

/**
 * @param {Array<{rel:string, text:string}>} files PHP files of the project
 * @param {object} options interpreter options (secondOrder, catalog, ...)
 * @param {(rel:string, ast:object|null, parsed:{status,error})=>void} [onParsed] called once per file
 * @returns {{hits:Array, status:Map<string,{status,error}>, exhausted:number}}
 */
function analyzeProject(files, options = {}, onParsed) {
  const catalog = options.catalog || baseCatalog;
  const status = new Map();
  const project = { programs: new Map(), functions: new Map(), classes: new Map(), methodsByName: new Map() };

  for (const { rel, text } of files) {
    const parsed = parsePhp(text, rel);
    let program = null;
    let error = parsed.error;
    if (parsed.ast) {
      try {
        program = lower(parsed.ast, rel);
      } catch (err) {
        error = `lowering: ${err.message}`;
      }
    }
    status.set(rel, { status: program ? parsed.status : 'failed', error });
    if (onParsed) onParsed(rel, parsed.ast || null, { status: program ? parsed.status : 'failed', error });
    if (!program) continue;
    project.programs.set(rel, program);
    for (const [name, fn] of program.functions) push(project.functions, name, fn);
    for (const [name, cls] of program.classes) push(project.classes, name, cls);
    for (const [name, list] of program.methodsByName) for (const fn of list) push(project.methodsByName, name, fn);
  }

  const shared = { hits: new Map(), memo: new Map(), analyzed: new Set() };
  let exhausted = 0;
  for (const [rel, program] of project.programs) {
    const interpreter = new Interpreter(program, catalog, { ...options, project, shared });
    try {
      if (interpreter.run({ standalone: false }).exhausted) exhausted++;
    } catch (err) {
      status.get(rel).error = `analysis: ${err.message}`;
    }
  }

  // functions and methods that no entry point called (libraries, controllers, hooks)
  const all = [...project.programs.values()].flatMap((p) => p.allFunctions);
  const empty = { file: '', main: [], functions: new Map(), classes: new Map(), methodsByName: new Map(), allFunctions: all };
  try {
    new Interpreter(empty, catalog, { ...options, project, shared }).analyzeRemaining(all);
  } catch (_) { /* best effort */ }

  const hits = [...shared.hits.values()].map((h) => ({
    ...h,
    entries: [...h.entries].filter((e) => e && e !== h.file).sort(),
    conf: status.get(h.file) && status.get(h.file).status === 'recovered' ? 2 : h.conf,
  }));
  return { hits, status, exhausted };
}

module.exports = { analyzeFile, analyzeProject };
