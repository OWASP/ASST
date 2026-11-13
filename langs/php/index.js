'use strict';
/*
 * PHP language plugin.
 */
const { LegacyCore } = require('../../core/legacy');
const { PhpDatabase, normalizeDbConfig } = require('./runtime/db');
const runLegacyChecks = require('./legacy-checks');

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
    const phpConfig = config.languageConfig.php || {};
    const core = new LegacyCore({ config, project, cache });
    core.phpBin = resolvePhpBin(config, phpConfig);
    const db = new PhpDatabase(normalizeDbConfig(phpConfig, process.env, { noDb: config.noDb }));
    const unsupported = config.formats.filter((f) => f !== 'html');
    if (unsupported.length) notices.add('warning', `Report format(s) not available in this build: ${unsupported.join(', ')}`);

    const total = await runLegacyChecks(core, db, notices);
    const reportFile = core.flushReport();
    return { exitCode: 0, total, reports: [reportFile] };
  },
};

module.exports.resolvePhpBin = resolvePhpBin;
