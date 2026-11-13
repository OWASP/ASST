'use strict';
/*
 * Software supply chain checks shared by the language plugins:
 *   inventory     lock files (composer.lock, package-lock.json, yarn.lock) and bundled JS libraries
 *   advisories    bundled advisory data for common front-end libraries (data/js-libs.json), and
 *                 OSV.dev for every package with --online (names and versions only, cached 24 h)
 *   lifecycles    end-of-life frameworks and libraries (data/eol.json, refreshed with --online)
 *   hygiene       require-dev packages installed in production, abandoned Composer packages
 */
const fs = require('fs');
const path = require('path');
const { readLockFiles } = require('./lockfiles');
const { detectBundled } = require('./jslibs');
const osv = require('./osv');
const eol = require('./eol');
const { compare } = require('./semver');
const { lifecycle, useData } = require('../lifecycle');

const OFFLINE_FILE = path.join(__dirname, '..', '..', 'data', 'js-libs.json');
const SEVERITY_ORDER = ['low', 'medium', 'high', 'critical'];

/** Packages whose version is the version of a framework or library tracked by endoflife.date. */
const EOL_PRODUCTS = {
  Packagist: { 'laravel/framework': 'laravel', 'symfony/http-kernel': 'symfony', 'drupal/core': 'drupal' },
  npm: { jquery: 'jquery', bootstrap: 'bootstrap', angular: 'angularjs', vue: 'vue' },
};

let offlineCache = null;
function offlineAdvisories(file = OFFLINE_FILE) {
  if (file !== OFFLINE_FILE) return JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!offlineCache) {
    try {
      offlineCache = JSON.parse(fs.readFileSync(OFFLINE_FILE, 'utf8'));
    } catch {
      offlineCache = { packages: {} };
    }
  }
  return offlineCache;
}

function maxSeverity(list, fallback) {
  let best = -1;
  for (const a of list) best = Math.max(best, SEVERITY_ORDER.indexOf(a.severity));
  return best >= 0 ? SEVERITY_ORDER[best] : fallback;
}

function advisoryName(a) {
  return a.aliases && a.aliases.length ? a.aliases[0] : a.id;
}

function displayName(p) {
  return p.label ? `${p.label} ${p.version}` : `${p.name} ${p.version}`;
}

function vulnerabilityHit(p, advisories) {
  const fixes = advisories.map((a) => osv.fixedFor(a, p.version));
  const unfixed = fixes.filter((f) => !f).length;
  const target = fixes.filter(Boolean).sort(compare).pop();
  const names = advisories.map(advisoryName);
  const listed = names.slice(0, 4).join(', ') + (names.length > 4 ? ` and ${names.length - 4} more` : '');
  let message = `${displayName(p)}${p.bundled ? ' (bundled copy)' : ''} is affected by ${advisories.length} published ${advisories.length === 1 ? 'advisory' : 'advisories'}: ${listed}.`;
  if (target) message += ` Upgrade to ${target} or later${unfixed ? `; ${unfixed} ${unfixed === 1 ? 'advisory has' : 'advisories have'} no fixed release yet` : ''}.`;
  else message += ' No fixed release is listed; consider replacing the component.';
  if (p.dev) message += ' (development dependency)';
  const first = advisories.find((a) => a.summary);
  if (first && advisories.length === 1) message += ` ${first.summary.replace(/\.?$/, '.')}`;
  return {
    ruleId: 'DEP-001',
    file: p.file,
    line: p.line,
    severity: maxSeverity(advisories, 'high'),
    confidence: p.dev ? 'low' : 'high',
    message,
    component: { ecosystem: p.ecosystem, name: p.name, version: p.version, advisories: advisories.map((a) => ({ id: a.id, aliases: a.aliases, severity: a.severity, summary: a.summary })), fixedIn: target || null },
  };
}

/**
 * @param {{project, readText:(f)=>string|null, config:{online:boolean, asstRoot:string}, notices, today?:Date,
 *          extraComponents?:Array, client?:object}} p
 * @returns {Promise<{hits:Array, inventory:object}>}
 */
async function scanSupplyChain(p) {
  const today = p.today || new Date();
  const cacheDir = path.join(p.config.asstRoot || process.cwd(), '.asst-cache');
  const lock = readLockFiles(p.project, p.readText);
  const bundled = detectBundled(p.project, p.readText);
  const packages = [...lock.packages, ...bundled, ...(p.extraComponents || [])];
  const hits = [];

  for (const e of lock.errors) p.notices.add('info', `Lock file not read: ${e}`);

  // lifecycle data: bundled file, or fresher data from an earlier/current --online run
  const cachedEol = eol.cached(path.join(cacheDir, 'eol.json'));
  if (cachedEol) useData(cachedEol);

  let online = null;
  let onlineError = null;
  if (p.config.online) {
    try {
      useData(await eol.refresh({ cacheFile: path.join(cacheDir, 'eol.json'), client: p.client }));
    } catch (err) {
      p.notices.add('warning', `Lifecycle data could not be refreshed from endoflife.date (${err.message}); the bundled data was used.`);
    }
    if (packages.some((x) => x.ecosystem === 'npm' || x.ecosystem === 'Packagist')) {
      try {
        online = await osv.lookup(packages, { cacheFile: path.join(cacheDir, 'osv.json'), client: p.client });
      } catch (err) {
        onlineError = err.message;
        p.notices.add('warning', `OSV.dev could not be reached (${err.message}); dependency advisories come from the bundled data only.`);
      }
    }
  }

  const offline = offlineAdvisories();
  const seen = new Set();
  const inventory = [];
  for (const pkg of packages) {
    const key = `${pkg.ecosystem}|${pkg.name}|${pkg.version}|${pkg.file}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let advisories = null;
    if (online && online.has(osv.keyOf(pkg))) advisories = online.get(osv.keyOf(pkg));
    else if (pkg.ecosystem === 'npm' && offline.packages && offline.packages[pkg.name]) {
      advisories = offline.packages[pkg.name].filter((a) => osv.affects(a, pkg.version));
    }
    if (advisories && advisories.length) hits.push(vulnerabilityHit(pkg, advisories));

    const product = pkg.eolProduct || (EOL_PRODUCTS[pkg.ecosystem] || {})[pkg.name];
    let status = null;
    if (product) {
      const lc = lifecycle(product, pkg.version, today);
      status = lc.status;
      if (lc.status === 'eol') {
        hits.push({
          ruleId: 'DEP-002',
          file: pkg.file,
          line: pkg.line,
          confidence: pkg.dev ? 'low' : 'high',
          message: `${displayName(pkg)} is end of life${typeof lc.eol === 'string' ? ` since ${lc.eol}` : ''} (release line ${lc.cycle}) and no longer receives security fixes. Upgrade to a supported release.`,
        });
      }
    }

    if (pkg.abandoned) {
      hits.push({
        ruleId: 'DEP-004',
        file: pkg.file,
        line: pkg.line,
        confidence: pkg.dev ? 'low' : 'high',
        message: `${pkg.name} is marked as abandoned${typeof pkg.abandoned === 'string' ? `; the maintainers suggest ${pkg.abandoned}` : ''}.`,
      });
    }

    inventory.push({
      ecosystem: pkg.ecosystem,
      name: pkg.name,
      version: pkg.version,
      dev: Boolean(pkg.dev),
      bundled: Boolean(pkg.bundled),
      file: pkg.file,
      advisories: advisories ? advisories.length : null,
      lifecycle: status,
    });
  }

  for (const d of lock.devInstalls) {
    const names = d.names.slice(0, 5).join(', ') + (d.names.length > 5 ? ` and ${d.names.length - 5} more` : '');
    hits.push({
      ruleId: 'DEP-003',
      file: d.lock,
      line: null,
      message: `${d.file} shows that development packages are installed (${names}). Test and debugging tools in a public deployment can expose code execution or information; deploy with composer install --no-dev.`,
    });
  }

  const checkable = inventory.filter((x) => x.ecosystem === 'npm' || x.ecosystem === 'Packagist').length;
  if (checkable && !online && !onlineError) {
    const fromLocks = inventory.filter((x) => !x.bundled && (x.ecosystem === 'npm' || x.ecosystem === 'Packagist')).length;
    if (fromLocks) {
      p.notices.add('info', `${fromLocks} dependencies from lock files were listed but not checked against vulnerability databases. Run with --online to look them up on OSV.dev (only package names and versions are sent).`);
    }
  }

  return {
    hits,
    inventory: {
      packages: inventory,
      lockFiles: lock.lockFiles,
      advisorySource: online ? 'OSV.dev (online)' : 'bundled data',
      checkedOnline: Boolean(online),
    },
  };
}

module.exports = { scanSupplyChain, offlineAdvisories, EOL_PRODUCTS };
