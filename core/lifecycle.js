'use strict';
/*
 * Software lifecycle lookups (end of life / security support) from data/eol.json,
 * or from fresher data downloaded with --online (see core/supply/eol.js).
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'eol.json');
let cache = null;

function load(file = DATA_FILE) {
  if (file !== DATA_FILE) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!cache) cache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return cache;
}

/** Uses newer lifecycle data for the rest of the run (products missing from it keep the bundled data). */
function useData(data) {
  if (!data || !data.products) return;
  const base = load();
  if (data.asOf && base.asOf && data.asOf < base.asOf) return;
  cache = { ...base, asOf: data.asOf || base.asOf, source: data.source || base.source, products: { ...base.products, ...data.products } };
}

function cycleFor(list, version) {
  const parts = String(version).replace(/^v/, '').split(/[.-]/);
  const candidates = [parts.slice(0, 2).join('.'), parts[0]];
  for (const c of candidates) {
    const hit = list.find((x) => x.cycle === c);
    if (hit) return hit;
  }
  return null;
}

const isDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v);

/** eol: an ISO date, true (end of life reached), false (not reached) or null (unknown). */
function eolReached(value, iso) {
  return value === true || (isDate(value) && value <= iso);
}

/** support: an ISO date, true (still in active support), false (active support ended) or null. */
function supportEnded(value, iso) {
  return value === false || (isDate(value) && value <= iso);
}

/**
 * @returns {{product, version, cycle, eol, support, status:'eol'|'security-only'|'supported'|'unknown', asOf}}
 */
function lifecycle(product, version, today = new Date(), data = load()) {
  const list = (data.products && data.products[product]) || [];
  const entry = cycleFor(list, version);
  const iso = today.toISOString().slice(0, 10);
  if (!entry) return { product, version, cycle: null, eol: null, support: null, status: 'unknown', asOf: data.asOf };
  let status = 'supported';
  if (eolReached(entry.eol, iso)) status = 'eol';
  else if (supportEnded(entry.support, iso)) status = 'security-only';
  return { product, version, cycle: entry.cycle, eol: entry.eol, support: entry.support, latest: entry.latest || null, status, asOf: data.asOf };
}

module.exports = { lifecycle, load, useData, DATA_FILE };
