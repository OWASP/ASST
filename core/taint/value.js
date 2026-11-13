'use strict';
/*
 * Abstract values for taint analysis (language independent).
 *
 * A value is a plain object:
 *   t        tainted (attacker influenced)
 *   c        confidence of the taint: 0 high, 1 medium, 2 low
 *   g        guarded: passed a validation check that may or may not be sufficient
 *   allowed  string of characters the value can contain, or null (anything)
 *   enc      encodings applied: { html, htmlQuotes, sql, shell, shellCmd, ldap, url }
 *   trace    [{line, note}] from source to here (bounded)
 *   origins  Set-like array of origin ids ('src' or 'p0', 'p1', ... for parameters)
 *   str      known constant string (untainted values only)
 *   segs     composite string: [{text} | {v: value}] (keeps sink context information)
 *   arr      Map key -> value for arrays ('*' = unknown keys)
 *   obj      {cls, fields: Map} for objects
 */

const MAX_TRACE = 8;
const MAX_SEGS = 48;
const MAX_STR = 4000;

const CLEAN = Object.freeze({ t: false });

function constant(str) {
  if (str === undefined || str === null) return CLEAN;
  const s = String(str);
  return { t: false, str: s.length > MAX_STR ? s.slice(0, MAX_STR) : s };
}

function source(origin, note, line, conf = 0) {
  return { t: true, c: conf, g: false, allowed: null, enc: {}, trace: [{ line, note }], origins: [origin] };
}

function isTainted(v) {
  return Boolean(v && v.t);
}

function unionChars(a, b) {
  if (a === null || a === undefined || b === null || b === undefined) return null;
  let out = a;
  for (const ch of b) if (!out.includes(ch)) out += ch;
  return out;
}

function intersectEnc(a = {}, b = {}) {
  const out = {};
  for (const k of Object.keys(a)) if (a[k] && b[k]) out[k] = a[k] === b[k] ? a[k] : true;
  return out;
}

function mergeOrigins(a = [], b = []) {
  const out = a.slice();
  for (const o of b) if (!out.includes(o)) out.push(o);
  return out;
}

function shorterTrace(a, b) {
  if (!a) return b;
  if (!b) return a;
  return b.length < a.length ? b : a;
}

/** Least upper bound of two values (used at control-flow merges and for "either" results). */
function join(a, b) {
  if (!a) return b || CLEAN;
  if (!b) return a;
  if (a === b) return a;
  let out;
  if (a.t && b.t) {
    out = {
      t: true,
      c: Math.min(a.c, b.c),
      g: Boolean(a.g && b.g),
      allowed: unionChars(a.allowed, b.allowed),
      enc: intersectEnc(a.enc, b.enc),
      trace: shorterTrace(a.trace, b.trace),
      origins: mergeOrigins(a.origins, b.origins),
    };
  } else if (a.t || b.t) {
    const t = a.t ? a : b;
    out = { ...t };
    delete out.str;
    delete out.segs;
  } else {
    out = { t: false };
    if (a.str !== undefined && a.str === b.str) out.str = a.str;
    else {
      const set = unionAlternatives(alternatives(a), alternatives(b));
      if (set) out.strs = set;
    }
  }
  if (a.arr || b.arr) out.arr = joinMaps(a.arr, b.arr);
  if (a.obj || b.obj) {
    const cls = a.obj && b.obj ? (a.obj.cls === b.obj.cls ? a.obj.cls : null) : (a.obj || b.obj).cls;
    out.obj = { cls, fields: joinMaps(a.obj && a.obj.fields, b.obj && b.obj.fields) };
  }
  if (a.num && b.num) out.num = true;
  return out;
}

const MAX_ALTERNATIVES = 8;

/** Possible constant string values of an untainted value, or null when unknown. */
function alternatives(v) {
  if (!v || v.t) return null;
  if (v.str !== undefined) return [v.str];
  if (v.strs) return v.strs;
  if (v.num && v.str === undefined) return null;
  return null;
}

function unionAlternatives(a, b) {
  if (!a || !b) return null;
  const set = [...new Set([...a, ...b])];
  return set.length <= MAX_ALTERNATIVES ? set : null;
}

function joinMaps(a, b) {
  const out = new Map(a || []);
  for (const [k, v] of b || []) out.set(k, out.has(k) ? join(out.get(k), v) : v);
  return out;
}

function joinAll(values) {
  return values.reduce((acc, v) => join(acc, v), null) || CLEAN;
}

/** Adds a trace step (returns a new value). */
function step(v, line, note) {
  if (!v || !v.t) return v;
  const trace = (v.trace || []).concat([{ line, note }]);
  return { ...v, trace: trace.length > MAX_TRACE ? trace.slice(0, 2).concat(trace.slice(-(MAX_TRACE - 2))) : trace };
}

/** Lowers confidence by n steps (max low). */
function weaken(v, n = 1) {
  if (!v || !v.t) return v;
  return { ...v, c: Math.min(2, (v.c || 0) + n) };
}

/** Concatenation preserving segment structure for context-sensitive sinks. */
function concat(values) {
  const segs = [];
  let anyTaint = false;
  let constText = '';
  let allConst = true;
  for (const v of values) {
    if (!v) continue;
    if (v.t) {
      anyTaint = true;
      allConst = false;
      if (v.segs) segs.push(...v.segs);
      else segs.push({ v });
    } else if (v.segs) {
      // untainted composite cannot exist; treat as text
      allConst = false;
    } else if (v.str !== undefined) {
      segs.push({ text: v.str });
      constText += v.str;
    } else {
      allConst = false;
      segs.push({ text: '' }); // unknown untainted text (e.g. a number or unknown clean value)
    }
  }
  if (!anyTaint) {
    if (allConst) return constant(constText);
    // several possible constant strings (e.g. a file name chosen in a switch)
    let combos = [''];
    for (const v of values) {
      const alts = alternatives(v);
      if (!alts) return CLEAN;
      const next = [];
      for (const c of combos) for (const a of alts) next.push(c + a);
      if (next.length > MAX_ALTERNATIVES) return CLEAN;
      combos = next;
    }
    return combos.length === 1 ? constant(combos[0]) : { t: false, strs: combos };
  }
  const tainted = segs.filter((s) => s.v).map((s) => s.v);
  const base = joinAll(tainted);
  const merged = mergeTextSegs(segs);
  const out = { ...base };
  delete out.str;
  out.segs = merged.length > MAX_SEGS ? null : merged;
  if (!out.segs) delete out.segs;
  return out;
}

function mergeTextSegs(segs) {
  const out = [];
  for (const s of segs) {
    const last = out[out.length - 1];
    if (s.text !== undefined && last && last.text !== undefined) last.text += s.text;
    else out.push(s.text !== undefined ? { text: s.text } : s);
  }
  return out;
}

/** The segments of a value (atomic tainted values form a single segment). */
function segmentsOf(v) {
  if (!v || !v.t) return v && v.str !== undefined ? [{ text: v.str }] : [];
  return v.segs && v.segs.length ? v.segs : [{ v }];
}

/** Applies a sanitizer effect: {clean, allowed, enc:{...}} */
function sanitize(v, effect, line, note) {
  if (!v || !v.t) return v && v.str !== undefined && effect.keepConst ? v : (v && v.str !== undefined ? constant(v.str) : CLEAN);
  if (effect.clean) return { t: false, num: Boolean(effect.num) };
  const out = { ...v };
  delete out.segs;
  delete out.str;
  if (effect.allowed !== undefined) {
    out.allowed = out.allowed === null || out.allowed === undefined ? effect.allowed : intersectChars(out.allowed, effect.allowed);
  }
  if (effect.removeChars) {
    if (out.allowed) out.allowed = [...out.allowed].filter((ch) => !effect.removeChars.includes(ch)).join('');
    else out.removed = (out.removed || '') + effect.removeChars;
  }
  if (effect.enc) out.enc = { ...(out.enc || {}), ...effect.enc };
  if (effect.dropEnc) {
    out.enc = { ...(out.enc || {}) };
    for (const k of effect.dropEnc) delete out.enc[k];
  }
  return step(out, line, note);
}

function intersectChars(a, b) {
  return [...a].filter((ch) => b.includes(ch)).join('');
}

/** True if the value can contain none of the given characters. */
function excludes(v, chars) {
  if (v.allowed !== null && v.allowed !== undefined) {
    for (const ch of chars) if (v.allowed.includes(ch)) return false;
    return true;
  }
  if (v.removed) {
    for (const ch of chars) if (!v.removed.includes(ch)) return false;
    return true;
  }
  return false;
}

/** True if every possible character is in the given set. */
function within(v, chars) {
  if (v.allowed === null || v.allowed === undefined) return false;
  for (const ch of v.allowed) if (!chars.includes(ch)) return false;
  return true;
}

module.exports = {
  CLEAN, constant, source, isTainted, join, joinAll, joinMaps, step, weaken, concat, segmentsOf,
  sanitize, excludes, within, unionChars, MAX_TRACE, alternatives,
};
