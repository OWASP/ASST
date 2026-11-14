'use strict';
/*
 * PHP language plugin.
 *
 *   PHP files      -> parse once -> taint analysis + structural AST rules
 *                     (line-based fallback rules when a file cannot be parsed)
 *   templates/JS   -> CSRF form, DOM XSS and plain-HTTP rules
 *   project        -> exposed files, .htaccess hardening, dependencies, secrets
 *   runtime        -> PHP/libxml versions, php.ini, database password storage and version
 *   live (opt-in)  -> read-only checks of the running site (--url)
 */
const path = require('path');
const { analyzeProject } = require('./taint');
const { runAstRules } = require('./rules/ast-rules');
const textRules = require('./rules/text-rules');
const projectRules = require('./rules/project-rules');
const { RULES, rule } = require('./rules/registry');
const { phpRuntime, phpLifecycleHits, databaseChecks } = require('./runtime/checks');
const { PhpDatabase, normalizeDbConfig } = require('./runtime/db');
const manualReview = require('./notices');
const frameworks = require('./frameworks');
const { extend: extendCatalog } = require('./taint/catalog');
const { scanSupplyChain } = require('../../core/supply');
const secrets = require('../../core/secrets');
const kit = require('../../core/plugin-kit');
const ansi = require('../../core/ansi');

const EXTENSIONS = ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'inc', 'module'];

function resolvePhpBin(config, phpConfig, env = process.env) {
  if (config.phpBin !== undefined) return config.phpBin;
  if (env.ASST_PHP_BIN !== undefined) return env.ASST_PHP_BIN;
  return phpConfig.PHP_EXE_BIN_PATH || '';
}

module.exports = {
  id: 'php',
  name: 'PHP',
  extensions: EXTENSIONS,

  detect(project) {
    return project.files.filter((f) => EXTENSIONS.includes(f.ext)).length;
  },

  async scan({ config, project, cache, notices }) {
    const startedAt = Date.now();
    const phpConfig = config.languageConfig.php || {};
    const lineOf = (rel, n) => cache.line(path.join(project.root, rel), n);
    const makeFinding = kit.createFindingMaker(rule, { lineOf });
    const options = { secondOrder: Boolean(config.secondOrder || phpConfig.SECOND_ORDER_SOURCES) };
    const raw = [];
    const stats = { filesScanned: project.files.length, filesAnalyzed: 0, parse: { ok: 0, recovered: 0, failed: 0 } };
    const parseFailures = [];

    if (!config.quiet) console.log(ansi.paint(`Scanning ${project.files.length} files in ${project.root}`, 'cyan'));

    // frameworks: detection, catalog extensions and template helpers
    const readText = (f) => cache.text(f.abs);
    const detected = frameworks.detect(project, readText);
    const pack = frameworks.catalogPack(detected);
    if (pack) options.catalog = extendCatalog(pack);
    const csrfOptions = { helpers: frameworks.csrfHelpers(detected), fileWide: detected.some((d) => d.id === 'wordpress') };
    if (detected.length && !config.quiet) console.log(ansi.paint(`Frameworks: ${detected.map((d) => d.pack.name + (d.info.version ? ` ${d.info.version}` : '')).join(', ')}`, 'cyan'));

    const phpFiles = [];
    const redact = new Set(); // secret values, masked in every report snippet
    const keep = (h) => {
      if (h.redact) for (const v of [].concat(h.redact)) redact.add(v);
      return h;
    };
    for (const file of project.files) {
      const isPhp = EXTENSIONS.includes(file.ext);
      const needsText = isPhp || textRules.TEMPLATE_EXT.has(file.ext) || ['js', 'mjs', 'cjs', 'css'].includes(file.ext);
      if (!needsText && !secrets.wants(file)) continue;
      const text = cache.text(file.abs);
      if (text === null) continue;
      for (const h of secrets.scanSecrets(file, text)) raw.push(makeFinding(h.ruleId, { ...keep(h), file: file.rel }));
      if (!needsText) continue;
      const lines = cache.lines(file.abs);
      stats.filesAnalyzed++;
      if (isPhp) phpFiles.push({ rel: file.rel, text });
      for (const h of textRules.csrfForms(file, text, csrfOptions)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }));
      for (const d of detected) {
        if (!d.pack.templateRules) continue;
        for (const h of d.pack.templateRules(file, text)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }));
      }
      for (const h of textRules.domRules(file, text)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel }));
      for (const h of textRules.httpUrls(file, lines)) raw.push(makeFinding(h.ruleId, { ...h, file: file.rel, confidence: 'medium' }));
    }

    // PHP: parse every file once, run the structural rules, then follow data across the project
    const taint = analyzeProject(phpFiles, options, (rel, ast, parsed) => {
      stats.parse[parsed.status === 'failed' ? 'failed' : parsed.status]++;
      if (ast) {
        for (const h of runAstRules(ast)) raw.push(makeFinding(h.ruleId, { ...keep(h), file: rel }));
      } else {
        parseFailures.push(`${rel} (${parsed.error})`);
        for (const h of textRules.phpFallback(cache.lines(path.join(project.root, rel)) || [])) raw.push(makeFinding(h.ruleId, { ...h, file: rel }));
      }
    });
    for (const hit of taint.hits) raw.push(kit.taintFinding(makeFinding, rule, hit));
    if (taint.exhausted) notices.add('info', `The analysis budget was reached for ${taint.exhausted} entry file(s); results for them may be incomplete.`);
    if (taint.uncovered) notices.add('info', `${taint.uncovered} function(s) that no entry point calls were not followed because the analysis budget was reached; findings inside them may be missing.`);

    const envFiles = project.files.filter((f) => /^\.env(\.|$)/.test(f.name)).map((f) => ({ rel: f.rel, text: cache.text(f.abs) || '' }));
    for (const d of detected) {
      const hits = [
        ...(d.pack.projectRules ? d.pack.projectRules(phpFiles, envFiles) : []),
        ...(d.pack.configRules ? d.pack.configRules(phpFiles) : []),
      ];
      for (const h of hits) raw.push(makeFinding(h.ruleId, h));
    }

    // software supply chain: lock files, bundled libraries, end-of-life frameworks
    const extraComponents = [];
    const wp = detected.find((d) => d.id === 'wordpress' && d.info.kind === 'core' && d.info.version);
    if (wp) {
      const ver = project.files.find((f) => f.rel.endsWith('wp-includes/version.php'));
      const verLine = ver ? (cache.lines(ver.abs) || []).findIndex((l) => /\$wp_version\s*=/.test(l)) + 1 : 0;
      extraComponents.push({ ecosystem: 'WordPress', name: 'wordpress', label: 'WordPress', version: wp.info.version, eolProduct: 'wordpress', file: ver ? ver.rel : null, line: verLine || null });
    }
    const supply = await scanSupplyChain({ project, readText, config, notices, extraComponents });
    for (const h of supply.hits) raw.push(makeFinding(h.ruleId, h));

    const usesPhp = project.files.some((f) => EXTENSIONS.includes(f.ext));
    for (const h of projectRules.exposedFiles(project)) raw.push(makeFinding(h.ruleId, h));
    for (const h of projectRules.htaccessRules(project, { usesPhp })) raw.push(makeFinding(h.ruleId, h));

    // runtime checks
    const environment = {};
    if (detected.length) environment.frameworks = Object.fromEntries(detected.map((d) => [d.pack.name, d.info.version || (d.info.kind ? d.info.kind : null)]));
    const phpBin = resolvePhpBin(config, phpConfig);
    const runtime = phpRuntime(phpBin, new Date());
    if (runtime.notice) notices.add('warning', runtime.notice);
    if (runtime.env) environment.php = runtime.env;
    for (const h of runtime.hits) raw.push(makeFinding(h.ruleId, h));
    const db = new PhpDatabase(normalizeDbConfig(phpConfig, process.env, { noDb: config.noDb }));
    if (db.cfg.enabled) {
      if (await db.connect()) {
        try {
          const res = await databaseChecks(db, new Date());
          Object.assign(environment, res.env);
          for (const h of res.hits) raw.push(makeFinding(h.ruleId, h));
        } finally {
          await db.close();
        }
      } else {
        notices.add('warning', `Database checks skipped: ${db.error}`);
      }
    }
    if (runtime.hits.some((h) => /^PHP-INI-/.test(h.ruleId))) {
      notices.add('info', `php.ini settings were read with the PHP command-line binary${runtime.env && runtime.env.iniFile ? ` (${runtime.env.iniFile})` : ''}. The web server can load a different php.ini; compare with phpinfo() on the server, then remove the phpinfo() page again.`);
    }

    // opt-in live checks against the running site (GET/HEAD only)
    const live = await kit.runLiveStage({
      config,
      project,
      notices,
      exposed: raw.filter((f) => /^PHP-FILE-00[123]$/.test(f.ruleId) && f.file).map((f) => f.file),
      pages: phpFiles
        .filter((pf) => /^(login|signin|sign-in|log-in|logon|account|auth)\.php$/i.test(path.posix.basename(pf.rel)) && /session_start\s*\(|setcookie\s*\(/.test(pf.text))
        .map((pf) => pf.rel),
    });
    if (live) {
      if (live.info) environment.live = live.info;
      kit.applyLiveResults(live, raw, makeFinding, { fileRules: /^PHP-FILE-00[123]$/, listingRule: 'PHP-HTA-001' });
      if (live.info && live.info.php) {
        if (!runtime.env) {
          for (const h of phpLifecycleHits(live.info.php, new Date(), ' (reported by the web server)').hits) raw.push(makeFinding(h.ruleId, h));
        } else if (runtime.env.php && runtime.env.php !== live.info.php) {
          notices.add('info', `The web server runs PHP ${live.info.php}, while the command-line PHP used for the runtime checks is ${runtime.env.php}. Point PHP_EXE_BIN_PATH (or --php-bin) at the PHP that serves the site.`);
        }
      }
    } else {
      kit.liveUrlHint(project.root, notices);
    }
    if (parseFailures.length) {
      notices.add('info', `${parseFailures.length} PHP file(s) could not be parsed and were checked with simpler line rules: ${parseFailures.slice(0, 5).join('; ')}${parseFailures.length > 5 ? '; ...' : ''}`);
    }

    return kit.finishScan({
      config, project, cache, notices, stats, environment, raw, redact, startedAt, lineOf,
      language: 'php',
      inventory: supply.inventory,
      manualReview,
      rules: RULES,
      guidesDir: path.join(__dirname, 'guides'),
    });
  },
};

module.exports.resolvePhpBin = resolvePhpBin;
