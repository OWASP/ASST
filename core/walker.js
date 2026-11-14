'use strict';
/*
 * Project file discovery: one walk per scan, shared by every check.
 *
 * - skips version-control and IDE folders, and dependency folders (vendor/,
 *   node_modules/, bower_components/) unless includeVendor is set
 * - skips ASST's own folder when it sits inside the scanned tree
 * - follows directory symlinks at most once (no cycles)
 * - honours user exclude globs (config EXCLUDE_PATHS, --exclude, .asstignore)
 */
const fs = require('fs');
const path = require('path');

const VCS_DIRS = new Set(['.git', '.svn', '.hg', '.bzr', '.idea', '.vscode', '.asst-cache']);
const DEPENDENCY_DIRS = new Set(['vendor', 'node_modules', 'bower_components']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** Converts a glob (supports **, *, ?) to a RegExp over posix relative paths. */
function globToRegExp(glob) {
  let g = toPosix(String(glob).trim());
  const rooted = g.startsWith('/');
  if (rooted) g = g.slice(1);
  if (g.endsWith('/')) g = g.slice(0, -1);
  const anchored = rooted || (g.includes('/') && !g.startsWith('**/'));
  let re = '';
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === '*') {
      if (g[i + 1] === '*') {
        re += '.*';
        i++;
        if (g[i + 1] === '/') i++;
      } else {
        re += '[^/]*';
      }
    } else if (c === '?') {
      re += '[^/]';
    } else {
      re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  const prefix = anchored ? '^' : '(^|/)';
  return new RegExp(`${prefix}${re}(/.*)?$`, process.platform === 'win32' ? 'i' : '');
}

function normalizeAbs(p) {
  const r = path.resolve(p);
  return process.platform === 'win32' ? r.toLowerCase() : r;
}

/**
 * @param {string} root absolute folder to scan
 * @param {{exclude?:string[], includeVendor?:boolean, skipPaths?:string[]}} opts
 * @returns {{root:string, files:Array<{rel,abs,name,ext,size}>, skipped:Array<{rel,reason}>}}
 */
function walkProject(root, opts = {}) {
  const exclude = (opts.exclude || []).filter(Boolean).map(globToRegExp);
  const skipPaths = new Set((opts.skipPaths || []).map(normalizeAbs));
  const includeVendor = Boolean(opts.includeVendor);
  const files = [];
  const skipped = [];
  const visited = new Set();
  try { visited.add(normalizeAbs(fs.realpathSync(root))); } catch (_) { /* reported by caller */ }

  const isExcluded = (rel) => exclude.some((re) => re.test(rel));
  const stack = [''];
  while (stack.length) {
    const relDir = stack.pop();
    const absDir = relDir ? path.join(root, relDir) : root;
    let entries;
    try {
      entries = fs.readdirSync(absDir, { withFileTypes: true });
    } catch (err) {
      skipped.push({ rel: relDir || '.', reason: `unreadable (${err.code || err.message})` });
      continue;
    }
    for (const entry of entries) {
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      const abs = path.join(absDir, entry.name);
      let isDir = entry.isDirectory();
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          const st = fs.statSync(abs);
          isDir = st.isDirectory();
          isFile = st.isFile();
        } catch (_) {
          skipped.push({ rel, reason: 'broken symlink' });
          continue;
        }
      }
      if (isDir) {
        if (skipPaths.has(normalizeAbs(abs))) { skipped.push({ rel, reason: 'asst' }); continue; }
        if (VCS_DIRS.has(entry.name)) { skipped.push({ rel, reason: 'vcs' }); continue; }
        if (!includeVendor && DEPENDENCY_DIRS.has(entry.name)) { skipped.push({ rel, reason: 'dependencies' }); continue; }
        if (isExcluded(rel)) { skipped.push({ rel, reason: 'excluded' }); continue; }
        let real;
        try { real = normalizeAbs(fs.realpathSync(abs)); } catch (_) { continue; }
        if (visited.has(real)) { skipped.push({ rel, reason: 'symlink cycle' }); continue; }
        visited.add(real);
        stack.push(rel);
      } else if (isFile) {
        if (isExcluded(rel)) continue;
        let size = 0;
        try { size = fs.statSync(abs).size; } catch (_) { continue; }
        const dot = entry.name.lastIndexOf('.');
        files.push({ rel, abs, name: entry.name, ext: dot > 0 ? entry.name.slice(dot + 1).toLowerCase() : '', size });
      }
    }
  }
  files.sort((a, b) => (a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0));
  skipped.sort((a, b) => (a.rel < b.rel ? -1 : 1));
  return { root, files, skipped };
}

/** Reads an .asstignore file (one glob per line, # comments). */
function readIgnoreFile(file) {
  try {
    return fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  } catch (_) {
    return [];
  }
}

module.exports = { walkProject, globToRegExp, readIgnoreFile, toPosix, VCS_DIRS, DEPENDENCY_DIRS };
