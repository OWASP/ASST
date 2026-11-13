'use strict';
/*
 * Configuration loading.
 *
 * Sources, highest priority first: command-line options > ASST_* environment variables >
 * config.js / config_<lang>_lang.js > defaults.
 *
 * Every key of the original config.js keeps its meaning. Relative paths are resolved
 * against the ASST folder (where main.js lives), so the documented layout
 *   htdocs/ASST  +  DEFAULT_PROJECT_PATH_TO_SCAN: "../ProjectFolderToScan/"
 * works no matter which directory ASST is launched from.
 */
const fs = require('fs');
const path = require('path');

const ASST_ROOT = path.resolve(__dirname, '..');
const SUPPORTED_LANGUAGES = ['php', 'nodejs', 'auto'];
const LANGUAGE_ALIASES = { 'node.js': 'nodejs', node: 'nodejs', javascript: 'nodejs', js: 'nodejs' };
const FORMATS = ['html', 'json', 'sarif', 'md'];

class ConfigError extends Error {}

function loadModule(file) {
  if (!fs.existsSync(file)) return null;
  const resolved = require.resolve(file);
  delete require.cache[resolved];
  try {
    return require(resolved);
  } catch (err) {
    throw new ConfigError(`Could not read ${path.basename(file)}: ${err.message}`);
  }
}

function asList(value) {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

function normalizeLanguage(value) {
  const v = String(value || 'php').trim().toLowerCase();
  return LANGUAGE_ALIASES[v] || v;
}

/**
 * Resolves the report outputs from --out / HTML_REPORT_FILE_NAME_AND_PATH.
 * --out may name a folder (all reports go there) or an .html file.
 */
function resolveOutputs(root, outOption, htmlSetting) {
  if (outOption) {
    const abs = path.resolve(process.cwd(), outOption);
    const looksLikeFile = /\.html?$/i.test(abs);
    if (looksLikeFile) return { outDir: path.dirname(abs), htmlPath: abs };
    return { outDir: abs, htmlPath: path.join(abs, 'report.html') };
  }
  const htmlPath = path.resolve(root, htmlSetting || 'report.html');
  return { outDir: path.dirname(htmlPath), htmlPath };
}

/**
 * @param {object} cli options parsed by core/cli.js
 * @param {object} env environment (process.env)
 * @param {string} root ASST folder (overridable for tests)
 */
function loadConfig(cli = {}, env = process.env, root = ASST_ROOT) {
  const user = loadModule(path.join(root, 'config.js')) || {};
  const language = normalizeLanguage(cli.lang || env.ASST_LANG || user.USED_PROGRAMMING_LANGUAGE);
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new ConfigError(`Unsupported programming language "${language}". Supported: ${SUPPORTED_LANGUAGES.join(', ')}.`);
  }

  const scanSetting = cli.path || env.ASST_PATH || user.DEFAULT_PROJECT_PATH_TO_SCAN || '../ProjectFolderToScan/';
  const scanPath = cli.path ? path.resolve(process.cwd(), scanSetting) : path.resolve(root, scanSetting);

  const formats = asList(cli.format || user.REPORT_FORMATS || 'html').map((f) => f.toLowerCase());
  const unknown = formats.filter((f) => !FORMATS.includes(f));
  if (unknown.length) throw new ConfigError(`Unknown report format(s): ${unknown.join(', ')}. Supported: ${FORMATS.join(', ')}.`);

  const outputs = resolveOutputs(root, cli.out, user.HTML_REPORT_FILE_NAME_AND_PATH);

  const config = {
    asstRoot: root,
    version: readVersion(root),
    debug: Boolean(cli.debug || user.IS_DEBUG_MODE_ENABLED),
    language,
    scanPath,
    scanSetting,
    formats,
    outDir: outputs.outDir,
    htmlPath: outputs.htmlPath,
    exclude: [...asList(user.EXCLUDE_PATHS), ...asList(cli.exclude)],
    includeVendor: Boolean(cli.includeVendor || user.INCLUDE_VENDOR_FOLDERS),
    maxFileSizeKB: Number(cli.maxFileSizeKb || user.MAX_FILE_SIZE_KB || 2048),
    minSeverity: String(cli.minSeverity || user.MIN_SEVERITY || 'info').toLowerCase(),
    minConfidence: String(cli.minConfidence || user.MIN_CONFIDENCE || 'medium').toLowerCase(),
    failOn: cli.failOn ? String(cli.failOn).toLowerCase() : (user.FAIL_ON_SEVERITY ? String(user.FAIL_ON_SEVERITY).toLowerCase() : null),
    rules: asList(cli.rules),
    disableRules: [...asList(user.DISABLED_RULES), ...asList(cli.disableRules)],
    baseline: cli.baseline ? path.resolve(process.cwd(), cli.baseline) : null,
    updateBaseline: cli.updateBaseline ? path.resolve(process.cwd(), cli.updateBaseline) : null,
    liveUrl: cli.url || env.ASST_URL || user.LIVE_SCAN_URL || null,
    allowRemote: Boolean(cli.allowRemote),
    online: Boolean(cli.online || user.ONLINE_CHECKS),
    secondOrder: Boolean(cli.secondOrder || user.SECOND_ORDER_SOURCES),
    jobs: cli.jobs ? Number(cli.jobs) : null,
    quiet: Boolean(cli.quiet),
    color: cli.color !== false,
    noDb: Boolean(cli.noDb),
    phpBin: cli.phpBin,
    user,
    languageConfig: {},
  };

  for (const lang of ['php', 'nodejs']) {
    config.languageConfig[lang] = loadModule(path.join(root, `config_${lang}_lang.js`)) || {};
  }
  return config;
}

function readVersion(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  } catch (_) {
    return 'unknown';
  }
}

module.exports = { loadConfig, ConfigError, ASST_ROOT, SUPPORTED_LANGUAGES, FORMATS, normalizeLanguage, asList };
