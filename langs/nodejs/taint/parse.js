'use strict';
/*
 * JavaScript / TypeScript parsing with @babel/parser (pure JavaScript, Node 18+).
 * A small retry ladder covers JSX in .js files, TypeScript-only syntax and Flow.
 * Errors are recovered where possible; such files are reported with lower confidence.
 */
const { parse } = require('@babel/parser');

const BASE = {
  sourceType: 'unambiguous',
  allowReturnOutsideFunction: true,
  allowAwaitOutsideFunction: true,
  allowImportExportEverywhere: true,
  allowUndeclaredExports: true,
  allowNewTargetOutsideFunction: true,
  allowSuperOutsideMethod: true,
  errorRecovery: true,
};

function laddersFor(ext) {
  if (ext === 'ts' || ext === 'mts' || ext === 'cts') return [['typescript', 'decorators-legacy']];
  if (ext === 'tsx') return [['typescript', 'jsx', 'decorators-legacy']];
  return [['jsx', 'decorators-legacy'], ['typescript', 'decorators-legacy'], ['flow', 'jsx']];
}

/** Bundled or minified code is not application source worth following. */
function looksGenerated(text) {
  if (text.length < 20000) return false;
  const lines = text.split('\n').length;
  return text.length / lines > 400;
}

/**
 * @returns {{ast:object|null, status:'ok'|'recovered'|'failed'|'skipped', error:string|null}}
 */
function parseJs(text, rel) {
  if (looksGenerated(text)) return { ast: null, status: 'skipped', error: 'minified or generated code' };
  const ext = String(rel).split('.').pop().toLowerCase();
  let lastError = null;
  let best = null;
  for (const plugins of laddersFor(ext)) {
    try {
      const ast = parse(text, { ...BASE, plugins });
      const errors = ast.errors || [];
      if (!errors.length) return { ast, status: 'ok', error: null };
      // keep the attempt with the fewest recovered errors, and try the next syntax flavour
      if (!best || errors.length < best.errors.length) best = { ast, errors };
    } catch (err) {
      lastError = err.message;
    }
  }
  if (best) return { ast: best.ast, status: 'recovered', error: String(best.errors[0].message || best.errors[0]) };
  return { ast: null, status: 'failed', error: lastError };
}

module.exports = { parseJs, looksGenerated };
