'use strict';
/*
 * Output-context analysis for sinks: decides, per tainted segment of a composite
 * string, whether its sanitization is sufficient in the place it ends up
 * (inside SQL quotes, an HTML attribute, a shell argument, ...).
 */
const { segmentsOf, excludes, within } = require('./value');

const DIGITS = '0123456789';
const NUMERIC = `${DIGITS}.-+eE`;
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const WORD = `${LETTERS}${DIGITS}_`;

function safeScalar(v) {
  return Boolean(v.num) || within(v, NUMERIC);
}

/* ------------------------------------------------------------------ quotes */

/**
 * Generic quote-state walker. Returns the unsafe tainted segments.
 * @param {object} value composite value
 * @param {{backslash:boolean|string, check:(v, quote)=>boolean}} opts
 *   backslash: true = backslash escapes inside both quote types, "double" = only in "..."
 */
function walkQuoted(value, opts) {
  let quote = null;
  const unsafe = [];
  for (const seg of segmentsOf(value)) {
    if (seg.text !== undefined) {
      const text = seg.text;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quote) {
          const escapes = opts.backslash === true || (opts.backslash === 'double' && quote === '"');
          if (escapes && ch === '\\') { i++; continue; }
          if (ch === quote) quote = null;
        } else if (ch === "'" || ch === '"' || (opts.backtick && ch === '`')) {
          quote = ch;
        }
      }
    } else if (seg.v && seg.v.t && !opts.check(seg.v, quote)) {
      unsafe.push({ v: seg.v, context: quote ? `quoted ${quote}` : 'unquoted' });
    }
  }
  return unsafe;
}

const sql = (value) => walkQuoted(value, {
  backslash: true,
  backtick: true,
  check(v, q) {
    if (safeScalar(v)) return true;
    if (v.enc && v.enc.sqlQuoted) return true;
    if (!q) return within(v, `${WORD}.+-`);
    if (q === '`') return within(v, `${WORD}.$`);
    if (v.enc && v.enc.sql) return true;
    // without the quote character the value cannot leave the string literal
    if (v.enc && v.enc.html && v.enc.htmlQuotes !== false) return true;
    return excludes(v, q);
  },
});

const xpath = (value) => walkQuoted(value, {
  backslash: false,
  check(v, q) {
    if (safeScalar(v)) return true;
    if (!q) return within(v, `${WORD}.-`);
    if (v.enc && v.enc.html && v.enc.htmlQuotes !== false) return true;
    return excludes(v, q);
  },
});

const shell = (value) => walkQuoted(value, {
  backslash: 'double',
  check(v, q) {
    if (safeScalar(v)) return true;
    if (v.enc && (v.enc.shell || v.enc.shellCmd)) return true;
    if (q === "'") return excludes(v, "'") || Boolean(v.enc && v.enc.html && v.enc.htmlQuotes !== false);
    if (q === '"') return excludes(v, '"$`\\');
    return within(v, `${WORD}.-/:=,@%+`);
  },
});

/** PHP code passed to eval(): string literal states of PHP itself. */
const code = (value) => walkQuoted(value, {
  backslash: true,
  check(v, q) {
    if (safeScalar(v)) return true;
    if (q === "'") return Boolean(v.enc && (v.enc.sql || (v.enc.html && v.enc.htmlQuotes !== false))) || excludes(v, "'");
    if (q === '"') return excludes(v, '"$');
    return false;
  },
});

function ldap(value) {
  return segmentsOf(value).filter((s) => s.v && s.v.t)
    .filter((s) => !(safeScalar(s.v) || (s.v.enc && s.v.enc.ldap) || excludes(s.v, '*()\\\u0000')))
    .map((s) => ({ v: s.v, context: 'filter' }));
}

/** File system paths and include targets. */
function path(value) {
  return segmentsOf(value).filter((s) => s.v && s.v.t)
    // without directory separators a value cannot climb out of the intended folder
    .filter((s) => !(safeScalar(s.v) || within(s.v, `${WORD}-.`) || excludes(s.v, '/\\')))
    .map((s) => ({ v: s.v, context: 'path' }));
}

/** Values that must not be attacker-controlled at all (URLs for SSRF, unserialize input, extract). */
function any(value) {
  return segmentsOf(value).filter((s) => s.v && s.v.t && !safeScalar(s.v)).map((s) => ({ v: s.v, context: 'value' }));
}

/** Header / log / mail header values: line breaks enable injection. */
function crlf(value) {
  return segmentsOf(value).filter((s) => s.v && s.v.t && !safeScalar(s.v) && !excludes(s.v, '\r\n'))
    .map((s) => ({ v: s.v, context: 'line' }));
}

/** URL position classification for SSRF / open redirect: returns tainted segments controlling scheme or host. */
function urlControl(value, prefixRe) {
  let text = '';
  const unsafe = [];
  for (const seg of segmentsOf(value)) {
    if (seg.text !== undefined) { text += seg.text; continue; }
    if (!seg.v || !seg.v.t || safeScalar(seg.v)) continue;
    const prefix = prefixRe ? text.replace(prefixRe, '') : text;
    const m = /^([a-z][a-z0-9+.-]*:)?(\/\/)?([^/?#]*)/i.exec(prefix);
    const hasScheme = Boolean(m && m[1]);
    const inAuthority = hasScheme && m[2] && !/[/?#]/.test(prefix.slice(m[0].length - (m[3] || '').length));
    if (prefix === '' || inAuthority || (!hasScheme && !/[/?#]/.test(prefix))) {
      if (!(excludes(seg.v, ':/\\') || (seg.v.enc && seg.v.enc.url))) unsafe.push({ v: seg.v, context: prefix === '' ? 'whole URL' : 'host' });
    }
    text += '\u0000';
  }
  return unsafe;
}

/* -------------------------------------------------------------------- HTML */

const RAW_TAGS = new Set(['script', 'style', 'textarea', 'title', 'xmp']);
const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'xlink:href', 'data', 'poster', 'background', 'srcset']);

function initialHtmlState() {
  return { m: 'text', tag: '', attr: '', val: '', raw: null, jsq: null, closing: false };
}

function endTag(st) {
  const tag = st.tag.toLowerCase();
  st.m = 'text';
  st.raw = !st.closing && RAW_TAGS.has(tag) ? tag : (st.closing && st.raw === tag ? null : st.raw);
  if (st.closing) st.raw = null;
  st.jsq = null;
  st.closing = false;
}

/** Advances the HTML tokenizer state over constant text. Mutates and returns st. */
function htmlScan(st, text) {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    switch (st.m) {
      case 'text':
        if (st.raw) {
          if (ch === '<' && text.slice(i + 1, i + 2 + st.raw.length).toLowerCase() === `/${st.raw}`) {
            st.m = 'tagname'; st.tag = ''; st.closing = true; i += 1; break;
          }
          if (st.raw === 'script') {
            if (st.jsq) {
              if (ch === '\\') i++;
              else if (ch === st.jsq) { st.jsq = null; st.jsEval = false; }
            } else if (ch === "'" || ch === '"' || ch === '`') {
              st.jsq = ch;
              // strings passed to these functions are executed as code
              st.jsEval = /(?:setInterval|setTimeout|eval|Function|execScript)\s*\(\s*$/.test(text.slice(Math.max(0, i - 40), i));
            }
          }
          break;
        }
        if (ch === '<' && i === text.length - 1) {
          // "<" immediately followed by dynamic output: the value becomes the tag name
          st.m = 'tagname'; st.tag = ''; st.closing = false;
          break;
        }
        if (ch === '<') {
          if (text.startsWith('!--', i + 1)) { st.m = 'comment'; i += 3; } else if (text[i + 1] === '/') { st.m = 'tagname'; st.tag = ''; st.closing = true; i++; } else if (/[a-zA-Z]/.test(text[i + 1] || '')) { st.m = 'tagname'; st.tag = ''; st.closing = false; }
        }
        break;
      case 'tagname':
        if (/\s/.test(ch)) st.m = 'attrs';
        else if (ch === '>') endTag(st);
        else if (ch === '/') st.m = 'attrs';
        else st.tag += ch;
        break;
      case 'attrs':
        if (ch === '>') endTag(st);
        else if (!/[\s/]/.test(ch)) { st.attr = ch; st.m = 'attrname'; }
        break;
      case 'attrname':
        if (/\s/.test(ch)) st.m = 'aftername';
        else if (ch === '=') st.m = 'beforevalue';
        else if (ch === '>') endTag(st);
        else st.attr += ch;
        break;
      case 'aftername':
        if (ch === '=') st.m = 'beforevalue';
        else if (ch === '>') endTag(st);
        else if (!/\s/.test(ch)) { st.attr = ch; st.m = 'attrname'; }
        break;
      case 'beforevalue':
        st.val = '';
        st.jsq = null;
        if (ch === '"') st.m = 'dq';
        else if (ch === "'") st.m = 'sq';
        else if (ch === '>') endTag(st);
        else if (!/\s/.test(ch)) { st.m = 'uq'; st.val = ch; }
        break;
      case 'dq':
      case 'sq': {
        const q = st.m === 'dq' ? '"' : "'";
        if (ch === q) { st.m = 'attrs'; st.jsq = null; break; }
        st.val += ch;
        if (/^on/i.test(st.attr)) {
          if (st.jsq) { if (ch === '\\') { i++; st.val += text[i] || ''; } else if (ch === st.jsq) st.jsq = null; } else if (ch === "'" || ch === '"' || ch === '`') st.jsq = ch;
        }
        break;
      }
      case 'uq':
        if (/\s/.test(ch)) st.m = 'attrs';
        else if (ch === '>') endTag(st);
        else st.val += ch;
        break;
      case 'comment':
        if (text.startsWith('-->', i)) { st.m = 'text'; i += 2; }
        break;
      default:
        st.m = 'text';
    }
  }
  return st;
}

function htmlContext(st) {
  switch (st.m) {
    case 'text':
      if (st.raw === 'script') {
        if (st.jsq && st.jsEval) return { kind: 'js-code' };
        return st.jsq ? { kind: 'js-string', quote: st.jsq } : { kind: 'js-code' };
      }
      if (st.raw === 'style') return { kind: 'css' };
      if (st.raw) return { kind: 'rcdata' };
      return { kind: 'html' };
    case 'tagname': case 'attrs': case 'attrname': case 'aftername':
      return { kind: 'tag' };
    case 'beforevalue': case 'uq':
      return { kind: 'attr-unquoted', attr: st.attr.toLowerCase() };
    case 'dq': case 'sq': {
      const quote = st.m === 'dq' ? '"' : "'";
      const attr = st.attr.toLowerCase();
      if (/^on/.test(attr)) return { kind: 'js-attr', quote, jsq: st.jsq };
      if (attr === 'style') return { kind: 'css' };
      if (URL_ATTRS.has(attr) && st.val.trim() === '') return { kind: 'url-attr', quote };
      return { kind: 'attr', quote };
    }
    case 'comment':
      return { kind: 'comment' };
    default:
      return { kind: 'html' };
  }
}

const htmlEncoded = (v) => Boolean(v.enc && v.enc.html);
const htmlQuotesEncoded = (v) => Boolean(v.enc && v.enc.html && v.enc.htmlQuotes !== false);

function htmlSafe(v, ctx) {
  if (safeScalar(v)) return true;
  switch (ctx.kind) {
    case 'html': case 'rcdata':
      return htmlEncoded(v) || excludes(v, '<');
    case 'attr':
      return (ctx.quote === '"' ? htmlEncoded(v) : htmlQuotesEncoded(v)) || excludes(v, ctx.quote);
    case 'url-attr':
      return (Boolean(v.enc && v.enc.url) || excludes(v, ':')) && (htmlQuotesEncoded(v) || excludes(v, ctx.quote));
    case 'attr-unquoted':
      return within(v, `${WORD}.-`);
    case 'js-string':
      return htmlQuotesEncoded(v) || excludes(v, `${ctx.quote}\\<\n\r`);
    case 'js-attr':
      if (ctx.jsq) return excludes(v, `${ctx.quote}${ctx.jsq}\\&`);
      return within(v, WORD);
    case 'comment':
      return excludes(v, '-!>');
    case 'tag': case 'js-code': case 'css':
      return within(v, WORD);
    default:
      return htmlEncoded(v);
  }
}

/**
 * Checks an output value against the current HTML state.
 * @returns {{unsafe:Array, state:object}} unsafe segments and the state after output
 */
function html(value, state) {
  const st = { ...(state || initialHtmlState()) };
  const unsafe = [];
  for (const seg of segmentsOf(value)) {
    if (seg.text !== undefined) { htmlScan(st, seg.text); continue; }
    if (!seg.v || !seg.v.t) continue;
    const ctx = htmlContext(st);
    if (!htmlSafe(seg.v, ctx)) unsafe.push({ v: seg.v, context: ctx.kind + (ctx.quote ? ` ${ctx.quote}` : '') });
    if (st.m === 'beforevalue') { st.m = 'uq'; st.val = 'x'; }
    if ((st.m === 'dq' || st.m === 'sq' || st.m === 'uq') && st.val === '') st.val = 'x';
  }
  return { unsafe, state: st };
}

module.exports = {
  sql, xpath, shell, code, ldap, path, any, crlf, urlControl, html, htmlScan, htmlContext, htmlSafe,
  initialHtmlState, DIGITS, NUMERIC, LETTERS, WORD,
};
