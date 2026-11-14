'use strict';
/*
 * Node.js language plugin (JavaScript and TypeScript, Express-style frameworks).
 *
 *   JS/TS files    -> parse once (@babel/parser) -> taint analysis + configuration rules
 *   templates      -> unescaped output (EJS, Handlebars, Pug, Nunjucks, Vue v-html)
 *   browser JS     -> DOM XSS rules (shared with the PHP plugin)
 *   project        -> dependencies, secrets, Node.js version, security headers
 *   live (opt-in)  -> read-only checks of the running site (--url)
 */
const path = require('path');
const { analyzeProject } = require('./taint');
const { configRules, headerRule, templateRules, nodeVersionRules } = require('./rules/config-rules');
const { RULES, rule } = require('./rules/registry');
const manualReview = require('./notices');
const { domRules } = require('../php/rules/text-rules');
const { scanSupplyChain } = require('../../core/supply');
const secrets = require('../../core/secrets');
const kit = require('../../core/plugin-kit');
const ansi = require('../../core/ansi');

const CODE_EXT = ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'mts', 'cts'];
const TEMPLATE_EXT = ['ejs', 'hbs', 'handlebars', 'mustache', 'pug', 'jade', 'njk', 'nunjucks', 'html', 'htm', 'vue'];
const SERVER_PACKAGES = /"(express|fastify|koa|@hapi\/hapi|hapi|restify|@nestjs\/core|next|nuxt|@sveltejs\/kit|polka|micro|hono|sails|loopback|@feathersjs\/feathers)"\s*:/;

function isTypeDeclaration(rel) {
  return /\.d\.[cm]?ts$/.test(rel);
}

module.exports = {
  id: 'nodejs',
  name: 'Node.js',
  extensions: CODE_EXT,

  /** Server-side JavaScript projects score high; front-end assets alone score low. */
  detect(project) {
    const code = project.files.filter((f) => CODE_EXT.includes(f.ext) && !isTypeDeclaration(f.rel)).length;
    const pkg = project.files.find((f) => f.rel === 'package.json');
    let server = false;
    if (pkg) {
      try {
        server = SERVER_PACKAGES.test(require('fs').readFileSync(pkg.abs, 'utf8'));
      } catch (_) { /* unreadable */ }
    }
    return server ? code + 1000 : Math.floor(code * 0.2);
  },

  async scan({ config, project, cache, notices }) {
    const startedAt = Date.now();
    const lineOf = (rel, n) => cache.line(path.join(project.root, rel), n);
    const makeFinding = kit.createFindingMaker(rule, { lineOf });
    const nodeConfig = config.languageConfig.nodejs || {};
    const raw = [];
    const stats = { filesScanned: project.files.length, filesAnalyzed: 0, parse: { ok: 0, recovered: 0, failed: 0 } };
    const parseFailures = [];
    const readText = (f) => cache.text(f.abs);
    const redact = new Set();
    const keep = (h) => {
      if (h.redact) for (const v of [].concat(h.redact)) redact.add(v);
      return h;
    };

    if (!config.quiet) console.log(ansi.paint(`Scanning ${project.files.length} files in ${project.root}`, 'cyan'));

    const codeFiles = [];
    let mongoSanitize = false;
    for (const file of project.files) {
      const isCode = CODE_EXT.includes(file.ext) && !isTypeDeclaration(file.rel);
      const isTemplate = TEMPLATE_EXT.includes(file.ext);
      if (!isCode && !isTemplate && !secrets.wants(file)) continue;
      const text = cache.text(file.abs);
      if (text === null) continue;
      for (const h of secrets.scanSecrets(file, text)) raw.push(makeFinding(h.ruleId, { ...keep(h), file: file.rel }));
      if (!isCode && !isTemplate) continue;
      stats.filesAnalyzed++;
      if (isCode) {
        codeFiles.push({ rel: file.rel, text });
        // the express-mongo-sanitize middleware strips "$" operators from every request
        if (/require\(\s*['"]express-mongo-sanitize['"]\s*\)|from\s+['"]express-mongo-sanitize['"]/.test(text)) mongoSanitize = true;
      }
      for (const h of templateRules(file, text)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }));
      if (['js', 'mjs', 'cjs', 'html', 'htm'].includes(file.ext)) {
        for (const h of domRules(file, text)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }));
      }
    }

    // parse every file once: configuration rules, then data flow across the project
    const facts = [];
    const options = { secondOrder: Boolean(config.secondOrder || nodeConfig.SECOND_ORDER_SOURCES), mongoSanitize };
    const texts = new Map(codeFiles.map((f) => [f.rel, f.text]));
    const taint = analyzeProject(codeFiles, options, (rel, ast, parsed) => {
      if (parsed.status === 'skipped') return;
      stats.parse[parsed.status === 'failed' ? 'failed' : parsed.status]++;
      if (!ast) {
        parseFailures.push(`${rel} (${parsed.error})`);
        return;
      }
      try {
        const res = configRules(ast, rel, texts.get(rel) || '');
        facts.push(res.facts);
        for (const h of res.hits) raw.push(makeFinding(h.ruleId, keep(h)));
      } catch (err) {
        parseFailures.push(`${rel} (configuration rules: ${err.message})`);
      }
    });
    for (const hit of taint.hits) raw.push(kit.taintFinding(makeFinding, rule, hit));
    if (taint.exhausted) notices.add('info', `The analysis budget was reached for ${taint.exhausted} file(s); results for them may be incomplete.`);
    if (taint.uncovered) notices.add('info', `${taint.uncovered} function(s) that no entry point calls were not followed because the analysis budget was reached; findings inside them may be missing.`);
    for (const h of headerRule(facts)) raw.push(makeFinding(h.ruleId, h));
    for (const h of nodeVersionRules(project, readText)) raw.push(makeFinding(h.ruleId, h));

    // software supply chain: lock files, bundled libraries, end-of-life frameworks
    const supply = await scanSupplyChain({ project, readText, config, notices });
    for (const h of supply.hits) raw.push(makeFinding(h.ruleId, h));

    const environment = { node: { scanner: process.version } };
    const live = await kit.runLiveStage({ config, project, notices });
    if (live) {
      if (live.info) environment.live = live.info;
      kit.applyLiveResults(live, raw, makeFinding);
    }
    if (parseFailures.length) {
      notices.add('info', `${parseFailures.length} file(s) could not be parsed: ${parseFailures.slice(0, 5).join('; ')}${parseFailures.length > 5 ? '; ...' : ''}`);
    }

    return kit.finishScan({
      config, project, cache, notices, stats, environment, raw, redact, startedAt, lineOf,
      language: 'nodejs',
      inventory: supply.inventory,
      manualReview,
      rules: RULES,
      guidesDir: path.join(__dirname, 'guides'),
    });
  },
};
