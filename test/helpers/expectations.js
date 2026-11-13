'use strict';
/*
 * Ground-truth helpers for ASST fixtures.
 *
 * Fixture files carry inline annotations on the line where a finding is expected:
 *   $r = mysqli_query($con, "... $id"); // @expect CWE-89
 *   <input value="<?= $_GET['q'] ?>"> <!-- @expect CWE-79 -->
 * Alternatives are separated by "|" (e.g. "@expect CWE-918|CWE-22") and an optional
 * confidence can be given ("@expect CWE-89 conf=high").
 *
 * Files named "*.safe.*" must not produce findings. A sidecar "<dir>.expect.json"
 * next to a fixture directory can declare file-level and project-level expectations.
 */
const fs = require('fs');
const path = require('path');

const EXPECT_RE = /@expect\s+(CWE-\d+(?:\|CWE-\d+)*)(?:\s+conf=(high|medium|low))?/g;
const TEXT_EXTENSIONS = new Set(['.php', '.phtml', '.inc', '.html', '.htm', '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.twig', '.tpl', '.ejs', '.hbs', '.handlebars', '.pug', '.njk', '.vue']);

function toPosix(p) {
  return p.split(path.sep).join('/');
}

function walk(dir, base = dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, out);
    } else if (entry.isFile()) {
      out.push(toPosix(path.relative(base, full)));
    }
  }
  return out;
}

/** Parse annotations from a single source text. Returns [{line, cwes, conf}] (1-based lines). */
function parseAnnotations(text) {
  const result = [];
  const lines = text.split(/\r?\n/);
  lines.forEach((lineText, index) => {
    EXPECT_RE.lastIndex = 0;
    let m;
    while ((m = EXPECT_RE.exec(lineText)) !== null) {
      result.push({ line: index + 1, cwes: m[1].split('|'), conf: m[2] || null });
    }
  });
  return result;
}

/**
 * Load ground truth for a fixture directory.
 * @returns {{root, files: string[], expectations: Array, safeFiles: string[], fileLevel: Array, projectLevel: string[]}}
 */
function loadExpectations(root) {
  const files = walk(root);
  const expectations = [];
  const safeFiles = [];
  for (const rel of files) {
    if (/\.safe\.[^/]+$/.test(rel)) safeFiles.push(rel);
    if (!TEXT_EXTENSIONS.has(path.extname(rel).toLowerCase())) continue;
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    for (const a of parseAnnotations(text)) {
      expectations.push({ file: rel, line: a.line, cwes: a.cwes, conf: a.conf });
    }
  }
  const sidecar = path.join(path.dirname(root), path.basename(root) + '.expect.json');
  let fileLevel = [];
  let projectLevel = [];
  if (fs.existsSync(sidecar)) {
    const data = JSON.parse(fs.readFileSync(sidecar, 'utf8'));
    for (const [file, cwes] of Object.entries(data.files || {})) {
      for (const cwe of cwes) fileLevel.push({ file, cwes: [cwe] });
    }
    projectLevel = data.project || [];
  }
  return { root, files, expectations, safeFiles, fileLevel, projectLevel };
}

module.exports = { parseAnnotations, loadExpectations, walk, toPosix };
