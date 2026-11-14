'use strict';
/*
 * Command-line options. Running "node main.js" without arguments behaves exactly like
 * the documented setup: everything comes from config.js and config_<lang>_lang.js.
 */

const OPTIONS = [
  // name, type, alias, description
  ['path', 'string', 'p', 'Folder to scan (default: DEFAULT_PROJECT_PATH_TO_SCAN from config.js)'],
  ['lang', 'string', 'l', 'Language plugin: php, nodejs or auto (default: USED_PROGRAMMING_LANGUAGE)'],
  ['format', 'string', 'f', 'Report formats, comma separated: html,json,sarif,md (default: html)'],
  ['out', 'string', 'o', 'Output folder, or path of the .html report (default: HTML_REPORT_FILE_NAME_AND_PATH)'],
  ['min-severity', 'string', null, 'Hide findings below: critical, high, medium, low, info (default: info)'],
  ['min-confidence', 'string', null, 'Hide findings below: high, medium, low (default: medium)'],
  ['fail-on', 'string', null, 'Exit with code 1 when a finding at or above this severity is reported (for CI)'],
  ['exclude', 'string[]', 'x', 'Glob of paths to skip (repeatable), e.g. --exclude "tests/**"'],
  ['include-vendor', 'boolean', null, 'Also scan vendor/, node_modules/ and bower_components/'],
  ['rules', 'string', null, 'Only run these rule ids (comma separated, prefix match)'],
  ['disable-rules', 'string', null, 'Skip these rule ids (comma separated, prefix match)'],
  ['baseline', 'string', null, 'Compare with a baseline file and mark findings as new/unchanged'],
  ['update-baseline', 'string', null, 'Write the current findings to a baseline file'],
  ['second-order', 'boolean', null, 'Also treat session data, files, database rows and command output as untrusted input'],
  ['no-db', 'boolean', null, 'Skip database checks even if IS_DBMS_USED is true'],
  ['php-bin', 'string', null, 'PHP CLI binary used for runtime checks ("" disables them)'],
  ['url', 'string', 'u', 'Base URL of the running site for the opt-in live checks (e.g. http://localhost/MyProject/)'],
  ['allow-remote', 'boolean', null, 'Allow live checks against non-local hosts you are authorized to test'],
  ['online', 'boolean', null, 'Allow online lookups (OSV vulnerability data, end-of-life data)'],
  ['jobs', 'string', 'j', 'Number of parallel workers for large projects (default: CPU count)'],
  ['max-file-size-kb', 'string', null, 'Skip files larger than this (default: 2048)'],
  ['quiet', 'boolean', 'q', 'Only print the summary'],
  ['no-color', 'boolean', null, 'Disable colored console output'],
  ['debug', 'boolean', null, 'Verbose diagnostics'],
  ['version', 'boolean', 'v', 'Print the ASST version'],
  ['help', 'boolean', 'h', 'Show this help'],
];

class CliError extends Error {}

function camel(name) {
  return name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Parses argv (without node and script). Returns an options object with camelCase keys. */
function parseArgs(argv) {
  const byName = new Map(OPTIONS.map((o) => [o[0], o]));
  const byAlias = new Map(OPTIONS.filter((o) => o[2]).map((o) => [o[2], o]));
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    let arg = argv[i];
    let inline = null;
    let opt;
    if (arg.startsWith('--')) {
      arg = arg.slice(2);
      const eq = arg.indexOf('=');
      if (eq !== -1) { inline = arg.slice(eq + 1); arg = arg.slice(0, eq); }
      opt = byName.get(arg);
      if (!opt && arg === 'color') { out.color = true; continue; }
    } else if (arg.startsWith('-') && arg.length === 2) {
      opt = byAlias.get(arg.slice(1));
    } else {
      throw new CliError(`Unexpected argument "${arg}". Use --path to choose the folder to scan.`);
    }
    if (!opt) throw new CliError(`Unknown option "${argv[i]}". Run "node main.js --help" for the list of options.`);
    const [name, type] = opt;
    if (name === 'no-color') { out.color = false; continue; }
    if (type === 'boolean') {
      out[camel(name)] = inline === null ? true : !/^(false|0|no)$/i.test(inline);
      continue;
    }
    let value = inline;
    if (value === null) {
      if (i + 1 >= argv.length) throw new CliError(`Option --${name} needs a value.`);
      value = argv[++i];
    }
    if (type === 'string[]') (out[camel(name)] = out[camel(name)] || []).push(value);
    else out[camel(name)] = value;
  }
  return out;
}

function helpText(version) {
  const lines = [
    `OWASP ASST ${version} - Automated Software Security Toolkit`,
    '',
    'Usage:',
    '  node main.js                     scan using config.js and config_php_lang.js',
    '  node main.js [options]',
    '',
    'Options:',
  ];
  for (const [name, type, alias, desc] of OPTIONS) {
    const flag = `${alias ? `-${alias}, ` : '    '}--${name}${type === 'boolean' ? '' : ' <value>'}`;
    lines.push(`  ${flag.padEnd(30)} ${desc}`);
  }
  lines.push('', 'Examples:',
    '  node main.js --path ../MyShop --format html,json',
    '  node main.js --format sarif --out reports --fail-on high',
    '');
  return lines.join('\n');
}

module.exports = { parseArgs, helpText, CliError, OPTIONS };
