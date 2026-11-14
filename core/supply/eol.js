'use strict';
/*
 * Lifecycle data (end of life / end of active support) from https://endoflife.date.
 * data/eol.json ships with ASST; --online refreshes it into the ASST cache folder.
 */
const fs = require('fs');
const path = require('path');
const http = require('../http');

const API = 'https://endoflife.date/api';
const PRODUCTS = ['php', 'mysql', 'mariadb', 'nodejs', 'laravel', 'symfony', 'drupal', 'wordpress', 'jquery', 'bootstrap', 'angularjs', 'vue'];
const TTL_MS = 24 * 60 * 60 * 1000;

/** Keeps the fields lifecycle() reads. eol/support are an ISO date, true/false or null. */
function normalizeCycle(c) {
  const val = (x) => (x === undefined ? null : x);
  return { cycle: String(c.cycle), eol: val(c.eol), support: val(c.support), lts: val(c.lts) || false, latest: c.latest ? String(c.latest) : null };
}

async function fetchAll({ products = PRODUCTS, client = http, today = new Date() } = {}) {
  const out = {
    source: `https://endoflife.date (${products.join(', ')})`,
    asOf: today.toISOString().slice(0, 10),
    note: 'Refreshed with --online; security support ends at "eol", bug-fix support at "support".',
    products: {},
  };
  const lists = await http.mapLimit(products, 4, (p) => client.getJson(`${API}/${p}.json`, { timeoutMs: 20000 }));
  products.forEach((p, i) => {
    if (!Array.isArray(lists[i])) throw new Error(`unexpected answer for ${p}`);
    out.products[p] = lists[i].map(normalizeCycle);
  });
  return out;
}

/**
 * Returns lifecycle data refreshed at most once a day (cached in cacheFile).
 * @returns {Promise<object|null>} data, or null when the cache is fresh enough to use as is
 */
async function refresh({ cacheFile, client, now = Date.now(), products } = {}) {
  try {
    const stat = fs.statSync(cacheFile);
    if (now - stat.mtimeMs < TTL_MS) return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {
    // no cache yet
  }
  const data = await fetchAll({ products, client, today: new Date(now) });
  try {
    fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
    fs.writeFileSync(cacheFile, JSON.stringify(data, null, 2));
  } catch {
    // read-only ASST folder: use the fresh data for this run only
  }
  return data;
}

/** Cached data from an earlier --online run, used when it is newer than the bundled file. */
function cached(cacheFile) {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  } catch {
    return null;
  }
}

module.exports = { fetchAll, refresh, cached, normalizeCycle, PRODUCTS };
