'use strict';
/*
 * Safe process execution helpers. Commands are always run with execFile (argument
 * arrays, no shell), a timeout, and errors are returned instead of thrown.
 */
const { execFileSync } = require('child_process');

/**
 * @returns {{ok:boolean, stdout:string, error:string|null}}
 */
function runFile(bin, args = [], { timeout = 20000, cwd } = {}) {
  if (!bin) return { ok: false, stdout: '', error: 'no executable configured' };
  try {
    const stdout = execFileSync(bin, args, {
      encoding: 'utf8',
      timeout,
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    });
    return { ok: true, stdout: String(stdout).trim(), error: null };
  } catch (err) {
    let error;
    if (err.code === 'ENOENT') error = `executable not found: ${bin}`;
    else if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') error = `timed out after ${timeout} ms`;
    else error = String(err.stderr || err.message || err).split(/\r?\n/).filter(Boolean)[0] || 'command failed';
    return { ok: false, stdout: err.stdout ? String(err.stdout).trim() : '', error };
  }
}

/** Runs a PHP snippet with the configured PHP CLI binary: php -r "<code>". */
function runPhp(bin, code, options) {
  return runFile(bin, ['-r', code], options);
}

module.exports = { runFile, runPhp };
