'use strict';
/*
 * Static analysis of PHP (PCRE) patterns used as sanitizers or guards.
 *   allowlist('/^[a-z0-9_]+$/i')        -> characters a matching subject can contain
 *   replaceEffect('/[^a-z0-9]/i', '')   -> { allowed } or { removeChars }
 * Returns null whenever the pattern is not understood (callers then assume nothing).
 */
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = LOWER.toUpperCase();
const DIGITS = '0123456789';
const WORD = `${LOWER}${UPPER}${DIGITS}_`;
const SPACE = ' \t\n\r\f\v';
const PRINTABLE = (() => {
  let s = '';
  for (let i = 32; i < 127; i++) s += String.fromCharCode(i);
  return `${s}\t\n\r`;
})();

const PAIRS = { '(': ')', '{': '}', '[': ']', '<': '>' };

/** Splits a PHP regex literal into body and flags. */
function splitPattern(pattern) {
  if (typeof pattern !== 'string' || pattern.length < 2) return null;
  const open = pattern[0];
  if (/[a-zA-Z0-9\\\s]/.test(open)) return null;
  const close = PAIRS[open] || open;
  const end = pattern.lastIndexOf(close);
  if (end <= 0) return null;
  return { body: pattern.slice(1, end), flags: pattern.slice(end + 1) };
}

function addRange(set, a, b) {
  let out = set;
  for (let c = a.charCodeAt(0); c <= b.charCodeAt(0); c++) {
    const ch = String.fromCharCode(c);
    if (!out.includes(ch)) out += ch;
  }
  return out;
}

const ESCAPE_CLASSES = { d: DIGITS, w: WORD, s: SPACE };

/** Parses a character class starting after '[' at index i. Returns {chars, negated, end}. */
function parseClass(body, i) {
  let negated = false;
  if (body[i] === '^') { negated = true; i++; }
  let chars = '';
  let first = true;
  while (i < body.length && (body[i] !== ']' || first)) {
    first = false;
    let ch = body[i];
    if (ch === '[' && body[i + 1] === ':') {
      const close = body.indexOf(':]', i + 2);
      if (close === -1) return null;
      const name = body.slice(i + 2, close);
      const posix = { alpha: LOWER + UPPER, digit: DIGITS, alnum: LOWER + UPPER + DIGITS, lower: LOWER, upper: UPPER, space: SPACE, xdigit: `${DIGITS}abcdefABCDEF`, word: WORD };
      if (!posix[name]) return null;
      for (const c of posix[name]) if (!chars.includes(c)) chars += c;
      i = close + 2;
      continue;
    }
    if (ch === '\\') {
      const nx = body[i + 1];
      if (ESCAPE_CLASSES[nx]) { for (const c of ESCAPE_CLASSES[nx]) if (!chars.includes(c)) chars += c; i += 2; continue; }
      if (/[DWS]/.test(nx || '')) return null; // negated escapes inside classes: give up
      const map = { n: '\n', r: '\r', t: '\t', f: '\f', v: '\v', 0: '\u0000' };
      if (nx === 'x') {
        const m = /^x([0-9a-fA-F]{2})/.exec(body.slice(i + 1));
        if (!m) return null;
        ch = String.fromCharCode(parseInt(m[1], 16));
        i += 1 + m[0].length;
      } else {
        ch = map[nx] !== undefined ? map[nx] : nx;
        i += 2;
      }
    } else {
      i += 1;
    }
    if (body[i] === '-' && body[i + 1] !== undefined && body[i + 1] !== ']') {
      let to = body[i + 1];
      let skip = 2;
      if (to === '\\') { to = body[i + 2]; skip = 3; }
      chars = addRange(chars, ch, to);
      i += skip;
      continue;
    }
    if (!chars.includes(ch)) chars += ch;
  }
  if (body[i] !== ']') return null;
  return { chars, negated, end: i + 1 };
}

function withCase(chars, flags) {
  if (!flags.includes('i')) return chars;
  let out = chars;
  for (const c of chars) {
    for (const v of [c.toLowerCase(), c.toUpperCase()]) if (!out.includes(v)) out += v;
  }
  return out;
}

/** Characters a subject matching an anchored allow-list pattern may contain, else null. */
function allowlist(pattern) {
  const p = splitPattern(pattern);
  if (!p) return null;
  let body = p.body;
  const anchoredStart = body.startsWith('^') || body.startsWith('\\A');
  const anchoredEnd = /(?:\$|\\z|\\Z)$/.test(body) && !/\\\$$/.test(body);
  if (!anchoredStart || !anchoredEnd) return null;
  if (p.flags.includes('m') && !body.startsWith('\\A')) return null; // ^/$ match per line
  body = body.replace(/^(\^|\\A)/, '').replace(/(\$|\\z|\\Z)$/, '');
  if (body.includes('|')) return null;
  let chars = '';
  let i = 0;
  while (i < body.length) {
    const ch = body[i];
    if (ch === '[') {
      const cls = parseClass(body, i + 1);
      if (!cls || cls.negated) return null;
      for (const c of cls.chars) if (!chars.includes(c)) chars += c;
      i = cls.end;
    } else if (ch === '\\') {
      const nx = body[i + 1];
      if (ESCAPE_CLASSES[nx]) { for (const c of ESCAPE_CLASSES[nx]) if (!chars.includes(c)) chars += c; }
      else if (/[A-Za-z]/.test(nx || '')) return null;
      else if (!chars.includes(nx)) chars += nx;
      i += 2;
    } else if (ch === '.' || ch === '(' || ch === ')') {
      return null;
    } else if ('*+?'.includes(ch)) {
      i += 1;
    } else if (ch === '{') {
      const m = /^\{\d*(,\d*)?\}/.exec(body.slice(i));
      if (!m) return null;
      i += m[0].length;
    } else {
      if (!chars.includes(ch)) chars += ch;
      i += 1;
    }
  }
  return withCase(chars, p.flags);
}

/** Effect of preg_replace(pattern, '', subject) on the subject's character set. */
function replaceEffect(pattern, replacement) {
  if (replacement !== '') return null;
  const p = splitPattern(pattern);
  if (!p) return null;
  const body = p.body.replace(/[+*]$/, '').replace(/\{\d*(,\d*)?\}$/, '');
  if (/^\\W$/.test(body) || body === '[^\\w]') return { allowed: WORD };
  if (/^\\D$/.test(body)) return { allowed: DIGITS };
  if (body.startsWith('[')) {
    const cls = parseClass(body, 1);
    if (!cls || cls.end !== body.length) return null;
    const chars = withCase(cls.chars, p.flags);
    if (cls.negated) return { allowed: chars };
    return { removeChars: chars };
  }
  // a literal character or short literal sequence, e.g. /'/ or /\'/
  const lit = body.replace(/\\(.)/g, '$1');
  if (lit.length === 1) return { removeChars: lit };
  return null;
}

module.exports = { splitPattern, allowlist, replaceEffect, parseClass, WORD, DIGITS, PRINTABLE };
