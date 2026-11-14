'use strict';
/*
 * Recreates the documented installation layout in a temporary folder:
 *
 *   <tmp>/htdocs/ASST                  <- copy of this repository (incl. node_modules)
 *   <tmp>/htdocs/ProjectFolderToScan   <- the project to scan
 *
 * exactly as the README/videos describe for XAMPP (C:\xampp\htdocs, /opt/lampp/htdocs,
 * /Applications/XAMPP/htdocs).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

function isV2(dir = REPO_ROOT) {
  return fs.existsSync(path.join(dir, 'core', 'cli.js'));
}

function copyRepo(dest) {
  fs.cpSync(REPO_ROOT, dest, {
    recursive: true,
    filter: (p) => {
      const rel = path.relative(REPO_ROOT, p).split(path.sep).join('/');
      if (rel === '') return true;
      return !(rel === '.git' || rel.startsWith('.git/') || rel.startsWith('bench/.work') ||
        rel === 'report.html' || rel.startsWith('.asst-cache'));
    },
  });
}

/** Creates the layout and returns {root, htdocs, asst, project}. */
function createLayout({ asstFolderName = 'ASST', project = path.join(REPO_ROOT, 'test', 'fixtures', 'php-vulnerable-app') } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-smoke-'));
  const htdocs = path.join(root, 'htdocs');
  const asst = path.join(htdocs, asstFolderName);
  const projectDir = path.join(htdocs, 'ProjectFolderToScan');
  fs.mkdirSync(htdocs, { recursive: true });
  copyRepo(asst);
  fs.cpSync(project, projectDir, { recursive: true });
  if (!isV2(asst)) {
    // v1.0 expects a reachable PHP binary and database; disable both for an offline smoke run.
    const cfg = path.join(asst, 'config_php_lang.js');
    let text = fs.readFileSync(cfg, 'utf8');
    text = text.replace(/PHP_EXE_BIN_PATH:\s*"[^"]*"/, 'PHP_EXE_BIN_PATH: ""').replace(/IS_DBMS_USED:\s*true/, 'IS_DBMS_USED: false');
    fs.writeFileSync(cfg, text);
  }
  return { root, htdocs, asst, project: projectDir };
}

function runNode(args, cwd, extraEnv = {}) {
  const r = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    timeout: 5 * 60 * 1000,
    env: { ...process.env, NO_COLOR: '1', ...extraEnv },
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '', error: r.error };
}

function cleanup(layout) {
  try { fs.rmSync(layout.root, { recursive: true, force: true }); } catch (_) { /* best effort */ }
}

module.exports = { REPO_ROOT, isV2, createLayout, runNode, cleanup };
