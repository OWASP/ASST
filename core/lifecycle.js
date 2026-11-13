'use strict';
/*
 * Software lifecycle lookups (end of life / security support) from data/eol.json.
 */
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'eol.json');
let cache = null;

function load(file = DATA_FILE) {
  if (!cache || file !== DATA_FILE) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (file !== DATA_FILE) return data;
    cache = data;
  }
  return cache;
}

function cycleFor(list, version) {
  const parts = String(version).split(/[.-]/);
  const candidates = [parts.slice(0, 2).join('.'), parts[0]];
  for (const c of candidates) {
    const hit = list.find((x) => x.cycle === c);
    if (hit) return hit;
  }
  return null;
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
  if (entry.eol && entry.eol <= iso) status = 'eol';
  else if (entry.support && entry.support <= iso) status = 'security-only';
  return { product, version, cycle: entry.cycle, eol: entry.eol, support: entry.support, status, asOf: data.asOf };
}

module.exports = { lifecycle, load, DATA_FILE };
