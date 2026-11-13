'use strict';
/*
 * Reads each project file at most once per scan and serves its text and lines to
 * every check. Binary files and files above the size limit are reported as such
 * instead of being decoded.
 */
const fs = require('fs');

const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

class FileCache {
  constructor({ maxBytes = DEFAULT_MAX_BYTES } = {}) {
    this.maxBytes = maxBytes;
    this.entries = new Map();
    this.reads = 0;
  }

  /**
   * @returns {{text:string|null, lines:string[]|null, binary:boolean, tooLarge:boolean, error:string|null}}
   */
  get(abs) {
    let entry = this.entries.get(abs);
    if (entry) return entry;
    entry = { text: null, lines: null, binary: false, tooLarge: false, error: null };
    try {
      const st = fs.statSync(abs);
      if (st.size > this.maxBytes) {
        entry.tooLarge = true;
      } else {
        const buf = fs.readFileSync(abs);
        this.reads += 1;
        if (isBinary(buf)) {
          entry.binary = true;
        } else {
          let text = buf.toString('utf8');
          if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
          entry.text = text;
          entry.lines = text.split('\n').map((l) => (l.endsWith('\r') ? l.slice(0, -1) : l));
        }
      }
    } catch (err) {
      entry.error = err.code || err.message;
    }
    this.entries.set(abs, entry);
    return entry;
  }

  text(abs) {
    return this.get(abs).text;
  }

  lines(abs) {
    return this.get(abs).lines;
  }

  /** 1-based line text or '' */
  line(abs, lineNumber) {
    const lines = this.lines(abs);
    return lines && lineNumber >= 1 && lineNumber <= lines.length ? lines[lineNumber - 1] : '';
  }
}

function isBinary(buf) {
  const len = Math.min(buf.length, 8000);
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

module.exports = { FileCache, isBinary, DEFAULT_MAX_BYTES };
