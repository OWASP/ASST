'use strict';
/*
 * Parses the HTML report produced by ASST v1.0 (line-based engine) into structured
 * findings so it can be compared with v2 on the same ground truth.
 *
 * v1 groups results under "<-- Checking for ... -->" headings and writes one
 * <span> per finding. Findings are mapped to CWE ids by the matched function or
 * message, giving v1 credit for the weakness it actually pointed at.
 */

const MESSAGE_SPLIT = / (?=File |file |This line |XML usage |Package file |SQL file |Weird file )/;

const SSRF_FUNCTION_CWE = {
  include: 'CWE-98', include_once: 'CWE-98', require: 'CWE-98', require_once: 'CWE-98',
  get_file_content: 'CWE-918', imap_open: 'CWE-918', imap_reopen: 'CWE-918',
};

function sectionOf(raw) {
  const m = raw.match(/<-- Checking for (.+?) -->/);
  return m ? m[1] : null;
}

function stripTags(s) {
  return s.replace(/<[^>]*>/g, '').trim();
}

function mapCwe(section, message) {
  const s = (section || '').toLowerCase();
  const msg = message;
  if (s.startsWith('injection')) {
    if (/MySQL Injection/.test(msg)) return 'CWE-89';
    if (/LDAP Injection/.test(msg)) return 'CWE-90';
    if (/OS Command Injection/.test(msg)) return 'CWE-78';
    return 'CWE-74';
  }
  if (s.startsWith('broken authentication')) return 'CWE-307';
  if (s.startsWith('sensitive data exposure')) return 'CWE-319';
  if (s.startsWith('xml external entity')) return 'CWE-611';
  if (s.startsWith('security misconfiguration')) return /directory listing/.test(msg) ? 'CWE-548' : 'CWE-209';
  if (s.startsWith('cross-site scripting')) return /'eval\(\)'/.test(msg) ? 'CWE-95' : 'CWE-79';
  if (s.startsWith('cross-site request forgery')) return 'CWE-352';
  if (s.startsWith('using components')) return 'CWE-1104';
  if (s.startsWith('server-side request forgery')) {
    const fn = (msg.match(/'([a-z0-9_]+)\(\)'/i) || [])[1];
    if (fn && SSRF_FUNCTION_CWE[fn]) return SSRF_FUNCTION_CWE[fn];
    return 'CWE-22';
  }
  if (s.startsWith('extra web security')) {
    if (/redirection/.test(msg)) return 'CWE-698';
    return 'CWE-538';
  }
  return 'CWE-OTHER';
}

function relativize(absPath, datasetRoot) {
  const norm = absPath.replace(/\\/g, '/').replace(/\/+/g, '/');
  const root = datasetRoot.replace(/\\/g, '/').replace(/\/+$/, '');
  const idx = norm.indexOf(root + '/');
  if (idx !== -1) return norm.slice(idx + root.length + 1);
  const name = '/' + root.split('/').pop() + '/';
  const j = norm.lastIndexOf(name);
  return j !== -1 ? norm.slice(j + name.length) : norm;
}

/**
 * @param {string} html  v1 report.html contents
 * @param {string} datasetRoot  path segment(s) identifying the scanned folder (used to relativize paths)
 * @returns {Array<{file:string|null,line:number|null,cwe:string,section:string,message:string}>}
 */
function parseV1Report(html, datasetRoot) {
  const findings = [];
  let section = null;
  for (const raw of html.split(/<br\s*\/?>/i)) {
    const sec = sectionOf(raw);
    if (sec) { section = sec; continue; }
    if (!/color:\s*red/i.test(raw)) continue;
    const text = stripTags(raw);
    if (!text) continue;
    const parts = text.split(MESSAGE_SPLIT);
    let file = null;
    let message = text;
    if (parts.length > 1 && /^(?:[A-Za-z]:[\\/]|[\\/])/.test(parts[0])) {
      file = relativize(parts[0], datasetRoot);
      message = parts.slice(1).join(' ');
    }
    const cwe = mapCwe(section, message);
    const lines = [];
    let m = message.match(/\(Found in line number: (\d+)\)/);
    if (m) lines.push(Number(m[1]));
    m = message.match(/on line (\d+)/);
    if (m) lines.push(Number(m[1]));
    m = message.match(/lines number: ([\d,]+)/);
    if (m) m[1].split(',').filter(Boolean).forEach((n) => lines.push(Number(n)));
    if (lines.length === 0) findings.push({ file, line: null, cwe, section, message });
    for (const line of lines) findings.push({ file, line, cwe, section, message });
  }
  return findings;
}

module.exports = { parseV1Report, mapCwe, relativize };
