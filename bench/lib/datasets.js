'use strict';
/*
 * Dataset acquisition and ground-truth construction for the ASST benchmark.
 * Everything downloaded lives under bench/.work/ (git-ignored). Downloaded code is
 * only ever read by the scanner, never executed.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { Readable } = require('stream');
const { pipeline } = require('stream/promises');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const WORK = path.join(REPO_ROOT, 'bench', '.work');
const DOWNLOADS = path.join(WORK, 'downloads');
const DATASETS = path.join(WORK, 'datasets');
const CONFIG = require('../datasets.json');

function log(msg) {
  process.stderr.write(`[bench] ${msg}\n`);
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed with exit code ${r.status}`);
}

function sha256File(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buf = Buffer.alloc(1 << 20);
  let n;
  while ((n = fs.readSync(fd, buf, 0, buf.length, null)) > 0) hash.update(buf.subarray(0, n));
  fs.closeSync(fd);
  return hash.digest('hex');
}

async function download(url, dest, sha256) {
  if (fs.existsSync(dest) && (!sha256 || sha256File(dest) === sha256)) return dest;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  log(`downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed: ${res.status} ${res.statusText} for ${url}`);
  const tmp = dest + '.part';
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
  if (sha256) {
    const actual = sha256File(tmp);
    if (actual !== sha256) throw new Error(`checksum mismatch for ${url}: expected ${sha256}, got ${actual}`);
  }
  fs.renameSync(tmp, dest);
  return dest;
}

function extractZip(zip, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  // bsdtar (Windows 10+, macOS) understands zip; GNU/Linux runners ship unzip.
  const tar = spawnSync('tar', ['-xf', zip, '-C', destDir], { stdio: 'ignore' });
  if (tar.status === 0) return;
  run('unzip', ['-q', '-o', zip, '-d', destDir]);
}

async function ensureDataset(name) {
  const cfg = CONFIG[name];
  if (!cfg) throw new Error(`unknown dataset "${name}"`);
  if (cfg.type === 'local') return path.join(REPO_ROOT, cfg.path);
  const dir = path.join(DATASETS, name === 'sard' ? 'sard-php' : name);
  if (cfg.type === 'git') {
    // Clone once, then export the pinned commit without VCS metadata (a deployed web root).
    const src = path.join(DATASETS, `${name}.src`);
    const marker = path.join(dir, '.exported-commit');
    if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8') === cfg.commit) return dir;
    if (!fs.existsSync(path.join(src, '.git'))) {
      fs.mkdirSync(DATASETS, { recursive: true });
      run('git', ['clone', '-q', cfg.repo, src]);
    }
    run('git', ['-C', src, '-c', 'advice.detachedHead=false', 'checkout', '-q', cfg.commit]);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.cpSync(src, dir, { recursive: true, filter: (p) => path.basename(p) !== '.git' });
    fs.writeFileSync(marker, cfg.commit);
    return dir;
  }
  if (cfg.type === 'zip') {
    const marker = path.join(dir, '.extracted');
    if (!fs.existsSync(marker)) {
      const zip = await download(cfg.url, path.join(DOWNLOADS, `${name}.zip`), cfg.sha256);
      log(`extracting ${name} (this can take a while)`);
      extractZip(zip, dir);
      fs.writeFileSync(marker, new Date().toISOString());
    }
    return name === 'wordpress' ? path.join(dir, 'wordpress') : dir;
  }
  throw new Error(`unsupported dataset type ${cfg.type}`);
}

/* ------------------------------ SARD ------------------------------ */

/** Fast path: stream every manifest straight out of the zip in one pass. */
function sardIndexFromZip(zip) {
  const r = spawnSync('unzip', ['-p', zip, '*/manifest.sarif'], { maxBuffer: 1024 * 1024 * 1024, encoding: 'utf8' });
  if (r.status !== 0 || !r.stdout) return null;
  const cases = [];
  const re = /"id":\s*(\d+),\s*"version":\s*"([^"]+)"[\s\S]*?"state":\s*"(good|bad)"[\s\S]*?"uri":\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(r.stdout)) !== null) {
    const cweMatch = /CWE_(\d+)/.exec(m[4]);
    if (!cweMatch) continue;
    const id = `${m[1]}-v${m[2]}`;
    cases.push({ id, file: `${id}/${m[4]}`, cwe: `CWE-${cweMatch[1]}`, vulnerable: m[3] === 'bad' });
  }
  return cases.length ? cases : null;
}

function sardIndex(sardDir) {
  const cache = path.join(DATASETS, 'sard-php.index.json');
  if (fs.existsSync(cache)) return JSON.parse(fs.readFileSync(cache, 'utf8'));
  log('indexing SARD manifests (one-time)');
  const zip = path.join(DOWNLOADS, 'sard.zip');
  const fromZip = fs.existsSync(zip) ? sardIndexFromZip(zip) : null;
  if (fromZip) {
    fs.writeFileSync(cache, JSON.stringify(fromZip));
    return fromZip;
  }
  const cases = [];
  for (const entry of fs.readdirSync(sardDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const caseDir = path.join(sardDir, entry.name);
    const manifestPath = path.join(caseDir, 'manifest.sarif');
    if (!fs.existsSync(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const run0 = manifest.runs[0];
    const uri = run0.artifacts[0].location.uri;
    const m = /CWE_(\d+)/.exec(path.basename(uri));
    if (!m) continue;
    cases.push({
      id: entry.name,
      file: `${entry.name}/${uri}`,
      cwe: `CWE-${m[1]}`,
      vulnerable: run0.properties.state === 'bad',
    });
  }
  fs.writeFileSync(cache, JSON.stringify(cases));
  return cases;
}

function stableKey(s) {
  return crypto.createHash('sha1').update(s).digest('hex');
}

/** Deterministic stratified sample (by CWE and good/bad). size<=0 returns everything. */
function sampleSard(cases, size) {
  if (!size || size <= 0 || size >= cases.length) return cases.slice();
  const strata = new Map();
  for (const c of cases) {
    const k = `${c.cwe}:${c.vulnerable}`;
    if (!strata.has(k)) strata.set(k, []);
    strata.get(k).push(c);
  }
  const out = [];
  for (const list of strata.values()) {
    list.sort((a, b) => (stableKey(a.id) < stableKey(b.id) ? -1 : 1));
    const take = Math.max(1, Math.round((list.length / cases.length) * size));
    out.push(...list.slice(0, take));
  }
  return out;
}

/** Copies the PHP sources of the given cases into an isolated folder (same relative paths). */
function materializeSard(sardDir, cases, label) {
  const dest = path.join(DATASETS, `sard-${label}`);
  const marker = path.join(dest, '.complete');
  if (fs.existsSync(marker) && Number(fs.readFileSync(marker, 'utf8')) === cases.length) return dest;
  fs.rmSync(dest, { recursive: true, force: true });
  for (const c of cases) {
    const to = path.join(dest, c.file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(sardDir, c.file), to);
  }
  fs.writeFileSync(marker, String(cases.length));
  return dest;
}

module.exports = {
  REPO_ROOT, WORK, DATASETS, CONFIG,
  ensureDataset, sardIndex, sampleSard, materializeSard, sha256File, log,
};
