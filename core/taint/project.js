'use strict';
/*
 * Project-wide taint analysis shared by the language plugins.
 *
 * Every file is parsed and lowered once. Each file then runs as an entry point with
 * functions, classes and methods resolved across the project; functions that no entry
 * point called (controllers, request handlers, library code) are analyzed afterwards.
 */
const { Interpreter } = require('./interpreter');

function push(map, key, value) {
  if (!map.has(key)) map.set(key, []);
  map.get(key).push(value);
}

/**
 * @param {Array<{rel:string, text:string}>} files
 * @param {{parse:(text:string, rel:string)=>{ast, status, error}, lower:(ast, rel:string)=>object, catalog:object}} language
 * @param {object} options interpreter options (secondOrder, budget, ...)
 * @param {(rel:string, ast:object|null, parsed:{status,error})=>void} [onParsed] called once per file
 * @returns {{hits:Array, status:Map<string,{status,error}>, exhausted:number}}
 */
function analyzeProject(files, language, options = {}, onParsed) {
  const { catalog } = language;
  const status = new Map();
  const project = { programs: new Map(), functions: new Map(), classes: new Map(), methodsByName: new Map() };

  for (const { rel, text } of files) {
    const parsed = language.parse(text, rel);
    let program = null;
    let error = parsed.error;
    if (parsed.ast) {
      try {
        program = language.lower(parsed.ast, rel);
      } catch (err) {
        error = `lowering: ${err.message}`;
      }
    }
    // "skipped" files (minified or generated code) are not parse failures
    const st = program ? parsed.status : (parsed.status === 'skipped' ? 'skipped' : 'failed');
    status.set(rel, { status: st, error });
    if (onParsed) onParsed(rel, parsed.ast || null, { status: st, error });
    if (!program) continue;
    project.programs.set(rel, program);
    for (const [name, fn] of program.functions) push(project.functions, name, fn);
    for (const [name, cls] of program.classes) push(project.classes, name, cls);
    for (const [name, list] of program.methodsByName) for (const fn of list) push(project.methodsByName, name, fn);
  }

  const shared = { hits: new Map(), memo: new Map(), analyzed: new Set(), mainEnvs: new Map() };
  let exhausted = 0;
  for (const [rel, program] of project.programs) {
    const interpreter = new Interpreter(program, catalog, { ...options, project, shared });
    try {
      if (interpreter.run({ standalone: false }).exhausted) exhausted++;
    } catch (err) {
      status.get(rel).error = `analysis: ${err.message}`;
    }
  }

  // functions and methods that no entry point called (libraries, controllers, hooks, handlers)
  const all = [...project.programs.values()].flatMap((p) => p.allFunctions);
  const empty = { file: '', main: [], functions: new Map(), classes: new Map(), methodsByName: new Map(), allFunctions: all };
  // one shared budget keeps memory bounded on very large projects; running out is reported
  const remaining = new Interpreter(empty, catalog, { ...options, project, shared });
  try {
    remaining.analyzeRemaining(all);
  } catch (_) { /* best effort */ }

  const hits = [...shared.hits.values()].map((h) => ({
    ...h,
    entries: [...h.entries].filter((e) => e && e !== h.file).sort(),
    conf: status.get(h.file) && status.get(h.file).status === 'recovered' ? 2 : h.conf,
  }));
  const uncovered = remaining.exhausted ? all.filter((fn) => !shared.analyzed.has(fn)).length : 0;
  return { hits, status, exhausted, uncovered };
}

module.exports = { analyzeProject };
