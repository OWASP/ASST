'use strict';
/*
 * Recognizes JavaScript libraries copied into a project (jquery-1.12.4.min.js,
 * vendor/bootstrap.min.js, ...) from their license banner, a version marker in the
 * code or a versioned file name. Each detection becomes an npm package in the
 * inventory, so it gets the same vulnerability and end-of-life checks as lock files.
 */

const V = '(\\d+\\.\\d+\\.\\d+)';

/**
 * npm: package name used for advisories; eol: endoflife.date product (optional);
 * banner: regexes whose first group is the version; marker+version: both must match.
 */
const LIBRARIES = [
  { npm: 'jquery', label: 'jQuery', eol: 'jquery', banner: [new RegExp(`/\\*!?\\s*jQuery v${V}\\s*\\|`), new RegExp(`jQuery JavaScript Library v${V}`)], file: new RegExp(`^jquery[-.]v?${V}(?:\\.slim)?(?:\\.min)?\\.js$`, 'i') },
  { npm: 'jquery-ui', label: 'jQuery UI', banner: [new RegExp(`jQuery UI (?:- )?v?${V}`)], file: new RegExp(`^jquery-ui[-.]v?${V}(?:\\.custom)?(?:\\.min)?\\.js$`, 'i') },
  { npm: 'bootstrap', label: 'Bootstrap', eol: 'bootstrap', banner: [new RegExp(`Bootstrap v${V} \\(https?://getbootstrap\\.com`)], file: new RegExp(`^bootstrap[-.]v?${V}(?:\\.bundle)?(?:\\.min)?\\.js$`, 'i') },
  { npm: 'angular', label: 'AngularJS', eol: 'angularjs', banner: [new RegExp(`@license AngularJS v${V}`)], file: /^angular[-.]v?(1\.\d+\.\d+)(?:\.min)?\.js$/i },
  { npm: 'lodash', label: 'Lodash', banner: [new RegExp(`\\* lodash ${V}`, 'i')], marker: /@license\s*\n?\s*\*?\s*Lodash\b/, version: [new RegExp(`\\bVERSION\\s*=\\s*['"]${V}['"]`)] },
  { npm: 'underscore', label: 'Underscore.js', banner: [new RegExp(`^\\s*(?://|\\*)\\s*Underscore\\.js ${V}`, 'm')], marker: /\.VERSION\s*=\s*['"]\d|VERSION\s*=\s*['"]\d/, version: [new RegExp(`_\\.VERSION\\s*=\\s*['"]${V}['"]`)], file: new RegExp(`^underscore[-.]v?${V}(?:\\.min)?\\.js$`, 'i') },
  { npm: 'moment', label: 'Moment.js', banner: [new RegExp(`//! moment\\.js\\s*\\n//! version : ${V}`)], marker: /\.moment\s*=\s*\w+\(\)/, version: [new RegExp(`\\.version\\s*=\\s*"${V}"`)] },
  { npm: 'handlebars', label: 'Handlebars', banner: [new RegExp(`@license\\s+handlebars v${V}`, 'i')], file: new RegExp(`^handlebars[-.]v?${V}(?:\\.runtime)?(?:\\.min)?\\.js$`, 'i') },
  { npm: 'vue', label: 'Vue.js', eol: 'vue', banner: [new RegExp(`Vue\\.js v${V}`)], file: new RegExp(`^vue[-.]v?${V}(?:\\.global)?(?:\\.prod)?(?:\\.min)?\\.js$`, 'i') },
  { npm: 'dompurify', label: 'DOMPurify', banner: [new RegExp(`@license DOMPurify ${V}`)], file: new RegExp(`^purify[-.]v?${V}(?:\\.min)?\\.js$`, 'i') },
  { npm: 'tinymce', label: 'TinyMCE', combine: true, marker: /tinymce|tinyMCE/, version: [/majorVersion:\s*["'](\d+)["'],\s*minorVersion:\s*["'](\d+\.\d+)["']/] },
  { npm: 'knockout', label: 'Knockout', banner: [new RegExp(`Knockout JavaScript library v${V}`)] },
];

const JS_EXT = new Set(['js', 'mjs', 'cjs']);
const MAX_SCAN = 2 * 1024 * 1024;

function versionFrom(re, text, combine = false) {
  const m = re.exec(text);
  if (!m) return null;
  return combine ? `${m[1]}.${m[2]}` : m[1];
}

/** @returns {Array<{npm,label,version,eol}>} libraries recognized in one file */
function identify(name, text) {
  const found = [];
  const head = text.length > MAX_SCAN ? text.slice(0, MAX_SCAN) : text;
  for (const lib of LIBRARIES) {
    let version = null;
    for (const re of lib.banner || []) {
      version = versionFrom(re, head);
      if (version) break;
    }
    if (!version && lib.marker && lib.marker.test(head)) {
      for (const re of lib.version || []) {
        version = versionFrom(re, head, lib.combine);
        if (version) break;
      }
    }
    if (!version && lib.file) version = versionFrom(lib.file, name);
    if (version) found.push({ npm: lib.npm, label: lib.label, version, eol: lib.eol || null });
  }
  return found;
}

/**
 * @param {{files:Array}} project
 * @param {(f) => string|null} readText
 * @returns {Array} inventory packages (ecosystem npm, bundled: true)
 */
function detectBundled(project, readText) {
  const out = [];
  for (const f of project.files) {
    if (!JS_EXT.has(f.ext)) continue;
    const text = readText(f);
    if (!text) continue;
    for (const lib of identify(f.name, text)) {
      out.push({ ecosystem: 'npm', name: lib.npm, label: lib.label, version: lib.version, eolProduct: lib.eol, bundled: true, dev: false, file: f.rel, line: 1 });
    }
  }
  return out;
}

module.exports = { detectBundled, identify, LIBRARIES };
