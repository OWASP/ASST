'use strict';
/*
 * PHP parsing with a retry ladder. Every file is parsed once per scan; files that
 * cannot be parsed fall back to the line rules. The parser never throws to callers.
 */
const Engine = require('php-parser');

const LADDER = [
  { version: '8.3', shortTags: false, suppress: false },
  { version: '7.4', shortTags: false, suppress: false },
  { version: '8.3', shortTags: true, suppress: false },
  { version: '8.3', shortTags: false, suppress: true },
];

const parsers = new Map();

function parserFor(step) {
  const key = JSON.stringify(step);
  if (!parsers.has(key)) {
    parsers.set(key, new Engine({
      parser: { extractDoc: false, suppressErrors: step.suppress, version: step.version },
      ast: { withPositions: true, withSource: false },
      lexer: { short_tags: step.shortTags, asp_tags: false },
    }));
  }
  return parsers.get(key);
}

/**
 * @returns {{ast:object|null, status:'ok'|'recovered'|'failed', error:string|null}}
 */
function parsePhp(code, filename = 'file.php') {
  let ladder = LADDER;
  // files that rely on short open tags ("<? ...") are parsed with them first
  if (/<\?(?!php|=|xml)\s/i.test(code)) ladder = [LADDER[2], ...LADDER.filter((s) => s !== LADDER[2])];
  let lastError = null;
  for (const step of ladder) {
    try {
      const ast = parserFor(step).parseCode(code, filename);
      const recovered = step.suppress && Array.isArray(ast.errors) && ast.errors.length > 0;
      return { ast, status: recovered ? 'recovered' : 'ok', error: recovered ? String(ast.errors[0].message || 'syntax error') : null };
    } catch (err) {
      lastError = err;
    }
  }
  return { ast: null, status: 'failed', error: lastError ? String(lastError.message).split('\n')[0] : 'unknown parse error' };
}

module.exports = { parsePhp };
