'use strict';
/*
 * Dependency inventory from lock files: composer.lock, package-lock.json (v1, v2, v3)
 * and yarn.lock (classic v1 and berry). Every package records the lock file and line
 * it was found on so findings point at a real location.
 */
const fs = require('fs');
const path = require('path');

const LOCK_FILES = new Set(['composer.lock', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock']);

function lineFinder(text) {
  const lines = text.split('\n');
  return (needle, from = 0) => {
    for (let i = from; i < lines.length; i++) if (lines[i].includes(needle)) return i + 1;
    return null;
  };
}

function parseComposerLock(text, rel) {
  const data = JSON.parse(text);
  const find = lineFinder(text);
  const out = [];
  for (const [key, dev] of [['packages', false], ['packages-dev', true]]) {
    for (const p of data[key] || []) {
      if (!p || !p.name || !p.version) continue;
      out.push({
        ecosystem: 'Packagist',
        name: p.name,
        version: String(p.version).replace(/^v(?=\d)/, ''),
        dev,
        abandoned: p.abandoned === undefined || p.abandoned === false ? null : (p.abandoned === true ? true : String(p.abandoned)),
        file: rel,
        line: find(`"name": "${p.name}"`),
      });
    }
  }
  return out;
}

function npmNameFromPath(key) {
  const i = key.lastIndexOf('node_modules/');
  return i === -1 ? key : key.slice(i + 'node_modules/'.length);
}

function parsePackageLock(text, rel) {
  const data = JSON.parse(text);
  const find = lineFinder(text);
  const out = [];
  if (data.packages && typeof data.packages === 'object') {
    // lockfileVersion 2 and 3
    for (const [key, p] of Object.entries(data.packages)) {
      if (!key || !p || p.link || !p.version) continue;
      if (!key.includes('node_modules/')) continue; // workspace folders
      out.push({ ecosystem: 'npm', name: p.name || npmNameFromPath(key), version: p.version, dev: Boolean(p.dev), file: rel, line: find(`"${key}": {`) });
    }
    return out;
  }
  // lockfileVersion 1: nested "dependencies"
  const walk = (deps) => {
    for (const [name, p] of Object.entries(deps || {})) {
      if (!p || !p.version || /^(file|link|git|github):/.test(p.version)) continue;
      out.push({ ecosystem: 'npm', name, version: p.version, dev: Boolean(p.dev), file: rel, line: find(`"${name}": {`) });
      walk(p.dependencies);
    }
  };
  walk(data.dependencies);
  return out;
}

function yarnName(spec) {
  const s = spec.trim().replace(/^"|"$/g, '');
  const at = s.indexOf('@', 1);
  return at === -1 ? s : s.slice(0, at);
}

function parseYarnLock(text, rel) {
  const out = [];
  const lines = text.split('\n');
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].replace(/\r$/, '');
    if (!l.trim() || l.startsWith('#')) continue;
    if (!/^\s/.test(l) && l.endsWith(':')) {
      const specs = l.slice(0, -1).split(/,\s*/);
      const name = yarnName(specs[0]);
      current = name === '__metadata' ? null : { name, line: i + 1 };
      if (current && /@(workspace|link|portal|file|patch):/.test(specs[0])) current = null;
      continue;
    }
    const m = current && /^\s+version:?\s+"?([^"\s]+)"?/.exec(l);
    if (m) {
      out.push({ ecosystem: 'npm', name: current.name, version: m[1], dev: false, file: rel, line: current.line });
      current = null;
    }
  }
  return out;
}

/** Composer's vendor/composer/installed.json tells whether require-dev packages were installed. */
function composerDevInstall(projectRoot, lockRel) {
  const dir = path.join(projectRoot, path.dirname(lockRel));
  const file = path.join(dir, 'vendor', 'composer', 'installed.json');
  let data;
  try {
    data = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
  if (Array.isArray(data)) return null; // Composer 1 format has no dev marker
  const names = Array.isArray(data['dev-package-names']) ? data['dev-package-names'] : [];
  if (data.dev === true && names.length) return { file: path.posix.join(path.posix.dirname(lockRel) === '.' ? '' : path.posix.dirname(lockRel), 'vendor/composer/installed.json'), names };
  return null;
}

/**
 * @param {{root:string, files:Array<{rel,name,abs}>}} project
 * @param {(f) => string|null} readText
 * @returns {{packages:Array, lockFiles:string[], errors:string[], devInstalls:Array, manifestsWithoutLock:string[]}}
 */
function readLockFiles(project, readText) {
  const packages = [];
  const lockFiles = [];
  const errors = [];
  const devInstalls = [];
  const dirsWithLock = new Set();
  for (const f of project.files) {
    if (!LOCK_FILES.has(f.name)) continue;
    const text = readText(f);
    if (text === null || text === undefined) continue;
    try {
      let list = [];
      if (f.name === 'composer.lock') {
        list = parseComposerLock(text, f.rel);
        const dev = composerDevInstall(project.root, f.rel);
        if (dev) devInstalls.push({ lock: f.rel, ...dev });
      } else if (f.name === 'yarn.lock') list = parseYarnLock(text, f.rel);
      else list = parsePackageLock(text, f.rel);
      packages.push(...list);
      lockFiles.push(f.rel);
      dirsWithLock.add(`${path.posix.dirname(f.rel)}|${f.name === 'composer.lock' ? 'composer' : 'npm'}`);
    } catch (err) {
      errors.push(`${f.rel}: ${err.message}`);
    }
  }
  const manifestsWithoutLock = project.files
    .filter((f) => (f.name === 'composer.json' || f.name === 'package.json') && !dirsWithLock.has(`${path.posix.dirname(f.rel)}|${f.name === 'composer.json' ? 'composer' : 'npm'}`))
    .map((f) => f.rel);
  return { packages, lockFiles, errors, devInstalls, manifestsWithoutLock };
}

module.exports = { readLockFiles, parseComposerLock, parsePackageLock, parseYarnLock, LOCK_FILES };
