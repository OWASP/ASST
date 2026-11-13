'use strict';
/*
 * Lenient version comparison for npm/Packagist/bundled-library versions and OSV ranges.
 * Handles a leading "v", any number of numeric parts and pre-release suffixes.
 */

function parse(v) {
  const s = String(v || '').trim().replace(/^[vV=]/, '');
  const m = /^(\d+(?:\.\d+)*)(?:[-.]?([0-9A-Za-z.-]+))?(?:\+.*)?$/.exec(s);
  if (!m) return null;
  const nums = m[1].split('.').map(Number);
  const pre = m[2] || '';
  return { nums, pre: /^(p|patch|pl)\d*$/i.test(pre) ? '' : pre };
}

/** -1, 0 or 1. Unparsable versions compare equal (callers treat that as "unknown"). */
function compare(a, b) {
  const x = parse(a);
  const y = parse(b);
  if (!x || !y) return 0;
  const n = Math.max(x.nums.length, y.nums.length);
  for (let i = 0; i < n; i++) {
    const d = (x.nums[i] || 0) - (y.nums[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  if (x.pre && !y.pre) return -1;
  if (!x.pre && y.pre) return 1;
  if (x.pre === y.pre) return 0;
  return x.pre < y.pre ? -1 : 1;
}

/**
 * OSV-style range events: [{introduced}, {fixed}|{last_affected}], applied in order.
 * @returns {boolean} true when version is affected by the range
 */
function affectedBy(version, events) {
  if (!parse(version)) return false;
  let affected = false;
  for (const ev of events || []) {
    if (ev.introduced !== undefined) {
      if (ev.introduced === '0' || compare(version, ev.introduced) >= 0) affected = true;
    } else if (ev.fixed !== undefined) {
      if (compare(version, ev.fixed) >= 0) affected = false;
    } else if (ev.last_affected !== undefined) {
      if (compare(version, ev.last_affected) > 0) affected = false;
    } else if (ev.limit !== undefined && compare(version, ev.limit) >= 0) {
      affected = false;
    }
  }
  return affected;
}

module.exports = { parse, compare, affectedBy };
