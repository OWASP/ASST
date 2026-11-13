'use strict';
/*
 * Runs a given ASST version against a dataset folder and returns normalized findings.
 *
 * - "v2" mode (current engine, detected by core/report/json.js): scans the dataset path directly
 *   and reads report.json.
 * - "v1" mode (v1.0 line-based engine): reproduces the documented install layout
 *   (<root>/ASST next to <root>/<project>) in the OS temp folder, writes the two config
 *   files, runs main.js and parses report.html.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { REPO_ROOT, log } = require('./datasets');
const { parseV1Report } = require('./v1-report');

const RUNS_ROOT = path.join(os.tmpdir(), 'asst-bench-runs');
const MEASURE = path.join(__dirname, 'measure.js');

function isV2(dir) {
  return fs.existsSync(path.join(dir, 'core', 'report', 'json.js'));
}

function copyTree(src, dest) {
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, {
    recursive: true,
    filter: (p) => {
      const rel = path.relative(src, p).split(path.sep).join('/');
      return !(rel === '.git' || rel.startsWith('.git/') || rel === 'bench/.work' || rel.startsWith('bench/.work/'));
    },
  });
}

function ensureNodeModules(dir) {
  if (fs.existsSync(path.join(dir, 'node_modules'))) return;
  log(`installing dependencies in ${dir}`);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const r = spawnSync(npm, ['ci', '--omit=dev', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(`npm ci failed in ${dir}`);
}

/** Returns {dir, mode} for a version label: "head" or "v1" (git ref given by opts.v1Ref). */
function prepareVersion(version, opts = {}) {
  if (version === 'head') {
    if (isV2(REPO_ROOT)) return { dir: REPO_ROOT, mode: 'v2', label: 'head' };
    const dir = path.join(RUNS_ROOT, 'head', 'ASST');
    copyTree(REPO_ROOT, dir);
    return { dir, mode: 'v1', label: 'head' };
  }
  if (version === 'v1') {
    const ref = opts.v1Ref || 'v1.0.0';
    const dir = path.join(RUNS_ROOT, `v1-${ref.replace(/[^\w.-]/g, '_')}`, 'ASST');
    if (!fs.existsSync(path.join(dir, 'main.js'))) {
      fs.mkdirSync(path.dirname(dir), { recursive: true });
      spawnSync('git', ['-C', REPO_ROOT, 'worktree', 'remove', '--force', dir], { stdio: 'ignore' });
      const r = spawnSync('git', ['-C', REPO_ROOT, 'worktree', 'add', '--detach', '-f', dir, ref], { stdio: 'inherit' });
      if (r.status !== 0) throw new Error(`could not create worktree for ${ref}`);
    }
    ensureNodeModules(dir);
    return { dir, mode: isV2(dir) ? 'v2' : 'v1', label: 'v1' };
  }
  throw new Error(`unknown version "${version}" (expected head or v1)`);
}

function linkDataset(datasetDir, linkPath) {
  try { fs.rmSync(linkPath, { recursive: true, force: true }); } catch (_) { /* ignore */ }
  try { fs.unlinkSync(linkPath); } catch (_) { /* ignore */ }
  fs.symlinkSync(datasetDir, linkPath, process.platform === 'win32' ? 'junction' : 'dir');
}

function writeV1Config(dir, projectFolder, reportPath) {
  fs.writeFileSync(path.join(dir, 'config.js'), `module.exports = {
\tTHIS_PROJECT_FOLDER_NAME: "ASST",
\tIS_DEBUG_MODE_ENABLED: false,
\tUSED_PROGRAMMING_LANGUAGE: "php",
\tDEFAULT_PROJECT_PATH_TO_SCAN: "../${projectFolder}/",
\tHTML_REPORT_FILE_NAME_AND_PATH: ${JSON.stringify(reportPath)},
};
`);
  fs.writeFileSync(path.join(dir, 'config_php_lang.js'), `module.exports = {
\tPHP_EXE_BIN_PATH: "",
\tIS_DBMS_USED: false,
\tDBMS: "mysql",
\tYOUR_WEBAPP_DBMS_SERVER_IP: "127.0.0.1",
\tYOUR_WEBAPP_DBMS_DB_NAME: "",
\tYOUR_WEBAPP_DBMS_USERNAME: "",
\tYOUR_WEBAPP_DBMS_PASSWORD: "",
\tYOUR_WEBAPP_DBMS_USER_TABLE_NAME: "",
\tYOUR_WEBAPP_DBMS_USER_TABLE_PASSWORD_COLUMN_NAME: "",
\tYOUR_WEBAPP_DBMS_USER_TABLE_SALT_COLUMN_NAME: "",
\tYOUR_WEBAPP_DBMS_ADMIN_TABLE_NAME: "",
\tYOUR_WEBAPP_DBMS_ADMIN_TABLE_PASSWORD_COLUMN_NAME: "",
\tYOUR_WEBAPP_DBMS_ADMIN_TABLE_SALT_COLUMN_NAME: "",
};
`);
}

function spawnMeasured(dir, entryArgs, statsFile, timeoutMs) {
  const r = spawnSync(process.execPath, [MEASURE, statsFile, path.join(dir, 'main.js'), ...entryArgs], {
    cwd: dir,
    stdio: ['ignore', 'ignore', 'pipe'],
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (r.error) throw r.error;
  const stats = fs.existsSync(statsFile) ? JSON.parse(fs.readFileSync(statsFile, 'utf8')) : { ms: null, maxRssKB: null, exitCode: r.status };
  stats.stderr = (r.stderr || '').toString().slice(-2000);
  return stats;
}

/**
 * Scan a dataset folder with a prepared version.
 * @returns {{findings: Array<{file,line,cwe,confidence}>, stats: {ms, maxRssKB, exitCode}}}
 */
function scan(prepared, datasetDir, datasetName, opts = {}) {
  const timeoutMs = opts.timeoutMs || 6 * 60 * 60 * 1000;
  const runDir = path.join(RUNS_ROOT, 'out', `${prepared.label}-${datasetName}`);
  fs.rmSync(runDir, { recursive: true, force: true });
  fs.mkdirSync(runDir, { recursive: true });
  const statsFile = path.join(runDir, 'stats.json');

  if (prepared.mode === 'v2') {
    const args = ['--path', datasetDir, '--format', 'json', '--out', runDir, '--no-db', '--php-bin', '',
      '--quiet', '--no-color', '--min-severity', 'info', '--min-confidence', 'low'];
    if (opts.extraArgs) args.push(...opts.extraArgs);
    if (datasetName === 'sard') args.push('--second-order');
    const stats = spawnMeasured(prepared.dir, args, statsFile, timeoutMs);
    const reportFile = path.join(runDir, 'report.json');
    if (!fs.existsSync(reportFile)) throw new Error(`no report.json produced (exit ${stats.exitCode}): ${stats.stderr}`);
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    const findings = report.findings.map((f) => ({ file: f.file, line: f.line ?? null, cwe: f.cwe, confidence: f.confidence || 'high', ruleId: f.ruleId }));
    return { findings, stats, filesScanned: report.summary ? report.summary.filesScanned : null };
  }

  // v1 layout: <parent>/ASST + <parent>/<link to dataset>
  const parent = path.dirname(prepared.dir);
  const linkName = `ds-${datasetName}`;
  linkDataset(datasetDir, path.join(parent, linkName));
  const reportPath = path.join(runDir, 'report.html');
  writeV1Config(prepared.dir, linkName, reportPath);
  const stats = spawnMeasured(prepared.dir, [], statsFile, timeoutMs);
  if (!fs.existsSync(reportPath)) throw new Error(`v1 produced no report (exit ${stats.exitCode}): ${stats.stderr}`);
  const findings = parseV1Report(fs.readFileSync(reportPath, 'utf8'), linkName)
    .filter((f) => f.file)
    .map((f) => ({ file: f.file, line: f.line, cwe: f.cwe, confidence: 'high' }));
  return { findings, stats, filesScanned: null };
}

module.exports = { prepareVersion, scan, RUNS_ROOT };
