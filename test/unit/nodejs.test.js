'use strict';
/*
 * Node.js plugin: annotated fixture corpus, a small Express application, configuration
 * rules, parsing, plugin selection and report validity.
 */
const test = require('node:test');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const Ajv = require('ajv');
const { loadExpectations } = require('../helpers/expectations');
const { parseJs } = require('../../langs/nodejs/taint/parse');
const { analyzeFile } = require('../../langs/nodejs/taint');
const { headerRule, templateRules, nodeVersionRules, majorFrom } = require('../../langs/nodejs/rules/config-rules');
const { RULES } = require('../../langs/nodejs/rules/registry');
const plugins = require('../../core/plugins');

const REPO = path.resolve(__dirname, '..', '..');

function scan(dir, extra = []) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-node-scan-'));
  const r = spawnSync(process.execPath, [path.join(REPO, 'main.js'), '--path', dir, '--lang', 'nodejs', '--format', 'json,sarif,html', '--out', out, '--no-db', '--php-bin', '', '--quiet', '--no-color', ...extra], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr || r.stdout);
  const report = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8'));
  const sarif = JSON.parse(fs.readFileSync(path.join(out, 'report.sarif'), 'utf8'));
  const html = fs.readFileSync(path.join(out, 'report.html'), 'utf8');
  fs.rmSync(out, { recursive: true, force: true });
  return { report, sarif, html };
}

const key = (f) => `${f.file}:${f.line} ${f.ruleId}`;

/**
 * Copies a fixture application to a temporary folder and restores "*.fixture" names
 * (package.json, package-lock.json): the repository does not ship real manifests with
 * deliberately outdated packages, so dependency tools do not raise alerts for them.
 */
function materialize(dir) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-node-app-'));
  const target = path.join(tmp, path.basename(dir));
  (function copy(from, to) {
    fs.mkdirSync(to, { recursive: true });
    for (const e of fs.readdirSync(from, { withFileTypes: true })) {
      const src = path.join(from, e.name);
      if (e.isDirectory()) copy(src, path.join(to, e.name));
      else fs.copyFileSync(src, path.join(to, e.name.endsWith('.fixture') ? e.name.slice(0, -'.fixture'.length) : e.name));
    }
  })(dir, target);
  return target;
}

test('Node.js fixture corpus: every annotated sink is reported and nothing else', () => {
  const dir = path.join(REPO, 'test', 'fixtures', 'nodejs');
  const truth = loadExpectations(dir);
  const { report } = scan(dir);
  const missing = truth.expectations.filter((e) => !report.findings.some((f) => f.file === e.file && f.line === e.line && e.cwes.includes(f.cwe)));
  assert.deepStrictEqual(missing.map((m) => `${m.file}:${m.line} ${m.cwes.join('|')}`), []);
  const unexpected = report.findings.filter((f) => !truth.expectations.some((e) => e.file === f.file && e.line === f.line && e.cwes.includes(f.cwe)));
  assert.deepStrictEqual(unexpected.map(key), [], 'no findings beyond the annotations (safe variants stay clean)');
  assert.ok(truth.expectations.length >= 40, 'the corpus covers the rule families');
});

test('Express application: cross-file data flow, templates, dependencies and project checks', () => {
  const dir = path.join(REPO, 'test', 'fixtures', 'nodejs-app');
  const truth = loadExpectations(dir);
  const { report, sarif, html } = scan(materialize(dir));
  const missing = truth.expectations.filter((e) => !report.findings.some((f) => f.file === e.file && f.line === e.line && e.cwes.includes(f.cwe)));
  assert.deepStrictEqual(missing.map((m) => `${m.file}:${m.line}`), []);
  for (const e of truth.fileLevel) assert.ok(report.findings.some((f) => f.file === e.file && e.cwes.includes(f.cwe)), `${e.file} ${e.cwes}`);
  const sqli = report.findings.find((f) => f.ruleId === 'NODE-SQLI-001');
  assert.strictEqual(sqli.file, 'db.js');
  assert.deepStrictEqual(sqli.entryPoints, ['routes/users.js'], 'the helper is linked to the route that reaches it');
  assert.match(sqli.trace[0].note, /^req\.params/);
  assert.ok(!report.findings.some((f) => f.file === 'routes/files.js' && f.line === 16), 'res.sendFile() with a root option is safe');
  assert.strictEqual(report.scan.language, 'nodejs');
  assert.ok(report.inventory.packages.some((p) => p.name === 'lodash' && p.advisories > 0));

  const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false, logger: false });
  const validate = ajv.compile(JSON.parse(fs.readFileSync(path.join(REPO, 'test', 'schemas', 'sarif-schema-2.1.0.json'), 'utf8')));
  assert.ok(validate(sarif), JSON.stringify(validate.errors && validate.errors.slice(0, 3)));
  assert.match(html, /NODE-SQLI-001/);
  assert.match(html, /placeholders/, 'the Node.js guide section is embedded');
});

test('parsing: JSX, TypeScript, Flow and generated code', () => {
  assert.strictEqual(parseJs('const a = <div>{x}</div>;', 'a.jsx').status, 'ok');
  assert.strictEqual(parseJs('const a = <div>{x}</div>;', 'a.js').status, 'ok');
  assert.strictEqual(parseJs('function f(x: number): string { return `${x}`; } enum E { A }', 'a.ts').status, 'ok');
  assert.strictEqual(parseJs('const f = (x: number): string => String(x);', 'a.js').status, 'ok', 'type annotations in .js fall back to TypeScript');
  assert.strictEqual(parseJs('// @flow\ntype T = {| a: number |};', 'a.js').status, 'ok');
  assert.strictEqual(parseJs(`var a=1;${'x=1;'.repeat(9000)}`, 'bundle.js').status, 'skipped');
  const ts = analyzeFile([
    "import express, { Request, Response } from 'express';",
    "import { exec } from 'node:child_process';",
    'const app = express();',
    "app.get('/x', (req: Request, res: Response) => {",
    '  exec(`ls ${req.query.dir as string}`);',
    '});',
  ].join('\n'), 'server.ts');
  assert.deepStrictEqual(ts.hits.map((h) => `${h.rule}:${h.line}`), ['NODE-CMDI-001:5']);
});

test('configuration rules: helmet, templates and Node.js versions', () => {
  assert.strictEqual(headerRule([{ expressApps: [{ file: 'a.js', line: 3 }], helmet: false, headers: false, poweredByOff: false }]).length, 1);
  assert.strictEqual(headerRule([{ expressApps: [{ file: 'a.js', line: 3 }], helmet: false, headers: false }, { expressApps: [], helmet: true }]).length, 0);
  assert.strictEqual(headerRule([{ expressApps: [], helmet: false }]).length, 0, 'no Express app, no finding');

  const pug = templateRules({ name: 'page.pug' }, 'h1= title\np!= description\ndiv #{safe}\nspan !{raw}\n');
  assert.deepStrictEqual(pug.map((h) => h.line), [2, 4]);
  assert.deepStrictEqual(templateRules({ name: 'a.ejs' }, '<%- include("x") %>\n<%= a %>\n<%- a %>').map((h) => h.line), [3]);

  for (const [spec, major] of [['14', '14'], ['v16.20.0', '16'], ['^18.0.0', '18'], ['20.x', '20'], ['>=14 <15', '14'], ['>=18', null], ['>=14 <18', null], ['lts/*', null]]) {
    assert.strictEqual(majorFrom(spec), major, spec);
  }
  const files = [
    { rel: '.nvmrc', name: '.nvmrc', text: 'v16.20.2\n' },
    { rel: 'Dockerfile', name: 'Dockerfile', text: 'FROM node:14-alpine AS build\nRUN npm ci\nFROM node:22-alpine\n' },
    { rel: 'package.json', name: 'package.json', text: '{\n  "engines": {\n    "node": "^24.0.0"\n  }\n}\n' },
  ];
  const hits = nodeVersionRules({ files }, (f) => f.text, new Date('2026-11-13T00:00:00Z'));
  assert.deepStrictEqual(hits.map((h) => `${h.file}:${h.line}`), ['.nvmrc:1', 'Dockerfile:1']);
});

test('every Node.js rule links to an existing guide section', () => {
  const { loadGuides } = require('../../core/guides');
  const guides = loadGuides(path.join(REPO, 'langs', 'nodejs', 'guides'));
  for (const r of RULES) assert.ok(guides.has(r.guide), `${r.id} -> ${r.guide}`);
  for (const n of require('../../langs/nodejs/notices')) assert.ok(guides.has(n.guide), `notice -> ${n.guide}`);
});

test('language selection: "auto" picks Node.js for server projects and PHP stays the default', () => {
  const project = (files) => ({ root: os.tmpdir(), files });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asst-detect-'));
  fs.writeFileSync(path.join(dir, 'package.json'), '{ "dependencies": { "express": "^4.21.0" } }');
  const node = project([{ rel: 'package.json', name: 'package.json', ext: 'json', abs: path.join(dir, 'package.json') }, { rel: 'app.js', ext: 'js' }, { rel: 'index.php', ext: 'php' }]);
  assert.strictEqual(plugins.detect(node), 'nodejs');
  const phpSite = project([...Array.from({ length: 30 }, (_, i) => ({ rel: `p${i}.php`, ext: 'php' })), ...Array.from({ length: 60 }, (_, i) => ({ rel: `js/a${i}.js`, ext: 'js' }))]);
  assert.strictEqual(plugins.detect(phpSite), 'php', 'front-end JavaScript in a PHP site does not switch the scanner');
  assert.deepStrictEqual(plugins.available().sort(), ['nodejs', 'php']);
  const { report } = scan(materialize(path.join(REPO, 'test', 'fixtures', 'nodejs-app')), ['--lang', 'auto']);
  assert.strictEqual(report.scan.language, 'nodejs');
});
