'use strict';
/*
 * Minimal ANSI styling for console output (no dependencies, no prototype extensions).
 * Colors are disabled automatically when output is not a terminal or NO_COLOR is set.
 */

const CODES = {
  bold: [1, 22],
  dim: [2, 22],
  underline: [4, 24],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],
};

function detect() {
  if (Object.prototype.hasOwnProperty.call(process.env, 'NO_COLOR')) return false;
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== '0') return true;
  return Boolean(process.stdout && process.stdout.isTTY);
}

let enabled = detect();

/** Applies the given styles, e.g. paint('Done', 'green', 'bold'). Unknown styles are ignored. */
function paint(text, ...styles) {
  let out = String(text);
  if (!enabled) return out;
  for (const style of styles) {
    const code = style && CODES[style];
    if (code) out = `\u001b[${code[0]}m${out}\u001b[${code[1]}m`;
  }
  return out;
}

function strip(text) {
  return String(text).replace(/\u001b\[[0-9;]*m/g, '');
}

module.exports = {
  paint,
  strip,
  setEnabled(value) { enabled = Boolean(value); },
  isEnabled() { return enabled; },
  STYLES: Object.keys(CODES),
};
