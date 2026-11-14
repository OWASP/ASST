'use strict';
/*
 * Vulnerability lookups against OSV.dev (https://osv.dev), used only with --online.
 * Only ecosystem, package name and version are sent. Answers are cached for 24 hours
 * in the ASST cache folder.
 */
const fs = require('fs');
const path = require('path');
const http = require('../http');
const { affectedBy, compare } = require('./semver');

const API = 'https://api.osv.dev/v1';
const TTL_MS = 24 * 60 * 60 * 1000;
const BATCH = 500;
const SEVERITY = { CRITICAL: 'critical', HIGH: 'high', MODERATE: 'medium', MEDIUM: 'medium', LOW: 'low' };

const keyOf = (p) => `${p.ecosystem}|${p.name}|${p.version}`;

/** Reduces an OSV record to what the report needs, for one package. */
function compact(v, ecosystem, name) {
  const affected = (v.affected || []).filter((a) => a.package && a.package.ecosystem === ecosystem && a.package.name.toLowerCase() === name.toLowerCase());
  const ranges = [];
  const versions = [];
  for (const a of affected) {
    for (const r of a.ranges || []) if (r.type === 'SEMVER' || r.type === 'ECOSYSTEM') ranges.push(r.events || []);
    versions.push(...(a.versions || []));
  }
  const ds = v.database_specific || {};
  const summary = (v.summary || String(v.details || '').split(/\.\s|\n/)[0] || '').trim().slice(0, 200);
  return {
    id: v.id,
    aliases: (v.aliases || []).filter((a) => /^CVE-\d+-\d+$/.test(a)),
    summary,
    severity: SEVERITY[String(ds.severity || '').toUpperCase()] || null,
    cwe: Array.isArray(ds.cwe_ids) ? ds.cwe_ids.slice(0, 3) : [],
    ranges,
    versions: versions.length > 200 ? [] : versions,
  };
}

/** True when the compact advisory covers this version. */
function affects(adv, version) {
  if (adv.versions && adv.versions.includes(version)) return true;
  return adv.ranges.some((events) => affectedBy(version, events));
}

/** Smallest fixed version above `version` for one advisory, or null. */
function fixedFor(adv, version) {
  let best = null;
  for (const events of adv.ranges) {
    for (const ev of events) {
      if (ev.fixed !== undefined && compare(ev.fixed, version) > 0 && (!best || compare(ev.fixed, best) < 0)) best = ev.fixed;
    }
  }
  return best;
}

function readCache(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { queries: data.queries || {}, vulns: data.vulns || {} };
  } catch {
    return { queries: {}, vulns: {} };
  }
}

function writeCache(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(data));
  } catch {
    // a read-only ASST folder (for example in a container) only disables the cache
  }
}

/**
 * @param {Array<{ecosystem,name,version}>} packages (npm and Packagist are queried)
 * @param {{cacheFile?:string, now?:number, client?:{postJson,getJson}}} opts
 * @returns {Promise<Map<string, Array>>} package key -> advisories affecting it
 */
async function lookup(packages, opts = {}) {
  const client = opts.client || http;
  const now = opts.now || Date.now();
  const cache = opts.cacheFile ? readCache(opts.cacheFile) : { queries: {}, vulns: {} };
  const fresh = (entry) => entry && now - entry.at < TTL_MS;

  const unique = [];
  const seen = new Set();
  for (const p of packages) {
    if (p.ecosystem !== 'npm' && p.ecosystem !== 'Packagist') continue;
    const k = keyOf(p);
    if (seen.has(k)) continue;
    seen.add(k);
    unique.push(p);
  }

  const pending = unique.filter((p) => !fresh(cache.queries[keyOf(p)]));
  for (let i = 0; i < pending.length; i += BATCH) {
    const chunk = pending.slice(i, i + BATCH);
    const res = await client.postJson(`${API}/querybatch`, {
      queries: chunk.map((p) => ({ package: { ecosystem: p.ecosystem, name: p.name }, version: p.version })),
    }, { timeoutMs: 30000 });
    (res.results || []).forEach((r, j) => {
      cache.queries[keyOf(chunk[j])] = { at: now, ids: (r.vulns || []).map((v) => v.id) };
    });
  }

  const ids = [...new Set(unique.flatMap((p) => (cache.queries[keyOf(p)] || { ids: [] }).ids))];
  const missing = ids.filter((id) => !fresh(cache.vulns[id]));
  await http.mapLimit(missing, 6, async (id) => {
    const v = await client.getJson(`${API}/vulns/${encodeURIComponent(id)}`, { timeoutMs: 30000 });
    cache.vulns[id] = { at: now, raw: { id: v.id, summary: v.summary, details: String(v.details || '').slice(0, 400), aliases: v.aliases, affected: v.affected, database_specific: v.database_specific } };
  });

  const out = new Map();
  for (const p of unique) {
    const list = [];
    for (const id of (cache.queries[keyOf(p)] || { ids: [] }).ids) {
      const entry = cache.vulns[id];
      if (entry) list.push(compact(entry.raw, p.ecosystem, p.name));
    }
    out.set(keyOf(p), list);
  }
  if (opts.cacheFile) writeCache(opts.cacheFile, cache);
  return out;
}

/** Queries every advisory of one package (used to build the bundled offline data). */
async function allAdvisories(ecosystem, name, client = http) {
  const out = [];
  let pageToken;
  do {
    const res = await client.postJson(`${API}/query`, { package: { ecosystem, name }, ...(pageToken ? { page_token: pageToken } : {}) }, { timeoutMs: 30000 });
    for (const v of res.vulns || []) {
      if (v.withdrawn) continue;
      out.push(compact(v, ecosystem, name));
    }
    pageToken = res.next_page_token;
  } while (pageToken);
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

module.exports = { lookup, allAdvisories, compact, affects, fixedFor, keyOf, API };
