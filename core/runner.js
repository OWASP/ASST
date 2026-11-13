'use strict';
/*
 * Scan orchestration: options -> configuration -> file discovery -> language plugin ->
 * reports -> exit code.
 */
const fs = require('fs');
const path = require('path');
const ansi = require('./ansi');
const { parseArgs, helpText, CliError } = require('./cli');
const { loadConfig, ConfigError } = require('./config');
const { walkProject, readIgnoreFile } = require('./walker');
const { FileCache } = require('./file-cache');
const plugins = require('./plugins');

function createNotices() {
  const list = [];
  return {
    list,
    add(kind, message) {
      list.push({ kind, message });
    },
  };
}

function printNotices(notices, quiet) {
  if (!notices.list.length || quiet) return;
  console.log('');
  for (const n of notices.list) {
    const color = n.kind === 'warning' ? 'yellow' : 'cyan';
    console.log(ansi.paint(`${n.kind === 'warning' ? 'Note' : 'Info'}: ${n.message}`, color));
  }
}

/** @returns {Promise<number>} process exit code */
async function run(argv = process.argv.slice(2)) {
  const started = Date.now();
  let cli;
  try {
    cli = parseArgs(argv);
  } catch (err) {
    if (err instanceof CliError) {
      console.error(err.message);
      return 2;
    }
    throw err;
  }
  if (cli.color === false) ansi.setEnabled(false);

  let config;
  try {
    config = loadConfig(cli);
  } catch (err) {
    if (err instanceof ConfigError) {
      console.error(ansi.paint(err.message, 'red', 'bold'));
      return 2;
    }
    throw err;
  }
  if (cli.help) {
    console.log(helpText(config.version));
    return 0;
  }
  if (cli.version) {
    console.log(config.version);
    return 0;
  }

  if (!config.quiet && process.stdout.isTTY) process.stdout.write('\u001bc'); // clear screen, as in v1

  let stat = null;
  try { stat = fs.statSync(config.scanPath); } catch (_) { /* handled below */ }
  if (!stat || !stat.isDirectory()) {
    console.error(ansi.paint(`The folder to scan was not found: ${config.scanPath}`, 'red', 'bold'));
    console.error(`Set DEFAULT_PROJECT_PATH_TO_SCAN in ${path.join(config.asstRoot, 'config.js')} ` +
      '(relative paths start from the ASST folder, e.g. "../YourProjectFolder/") or pass --path <folder>.');
    return 2;
  }

  const ignoreGlobs = readIgnoreFile(path.join(config.scanPath, '.asstignore'));
  const project = walkProject(config.scanPath, {
    exclude: [...config.exclude, ...ignoreGlobs],
    includeVendor: config.includeVendor,
    skipPaths: [config.asstRoot],
  });
  const cache = new FileCache({ maxBytes: config.maxFileSizeKB * 1024 });
  const notices = createNotices();
  const skippedDeps = project.skipped.filter((s) => s.reason === 'dependencies');
  if (skippedDeps.length) {
    notices.add('info', `Skipped dependency folders (${skippedDeps.map((s) => s.rel).join(', ')}). Use --include-vendor to scan them.`);
  }

  let plugin;
  try {
    plugin = plugins.select(config, project);
  } catch (err) {
    console.error(ansi.paint(err.message, 'red', 'bold'));
    return 2;
  }

  const result = await plugin.scan({ config, project, cache, notices });

  printNotices(notices, config.quiet);
  const seconds = Math.round((Date.now() - started) / 1000);
  if (!config.quiet && !(result && result.model)) {
    console.log(`Total scan time: ${seconds} Seconds`);
    console.log('');
  }
  return result && Number.isInteger(result.exitCode) ? result.exitCode : 0;
}

module.exports = { run, createNotices };
