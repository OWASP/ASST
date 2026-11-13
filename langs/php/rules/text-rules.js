'use strict';
/*
 * Text-level rules for templates, HTML and JavaScript, plus the fallback rules used
 * for PHP files that cannot be parsed.
 */

const TEMPLATE_EXT = new Set(['php', 'phtml', 'html', 'htm', 'tpl', 'twig', 'inc', 'xhtml', 'ctp', 'latte', 'mustache', 'hbs']);
const SCRIPT_EXT = new Set(['js', 'mjs', 'cjs', 'html', 'htm', 'php', 'phtml', 'tpl', 'twig', 'xhtml']);

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

function lineStarts(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  return starts;
}

function lineFromStarts(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid; else hi = mid - 1;
  }
  return lo + 1;
}

/* ------------------------------------------------------------------ CSRF */

const TOKEN_FIELD = /name\s*=\s*["']?[^"'\s>]*(csrf|xsrf|token|nonce|authenticity|_wpnonce|form_key|__requestverificationtoken)/i;
const TOKEN_HELPER = /@csrf|csrf_field\s*\(|csrf_token\s*\(|wp_nonce_field\s*\(|\{\{\s*csrf|form_token\s*\(|security->get_csrf|\$this->Form->|form_open\s*\(|->csrf|check_admin_referer|\bnonce\b|getCsrf|csrfToken|_token/i;

function csrfForms(file, text) {
  if (!TEMPLATE_EXT.has(file.ext) && !file.name.endsWith('.blade.php')) return [];
  const hits = [];
  const re = /<form\b([^>]*)>/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const attrs = m[1];
    const method = /\bmethod\s*=\s*["']?\s*(\w+)/i.exec(attrs);
    if (!method || method[1].toLowerCase() !== 'post') continue;
    const end = text.toLowerCase().indexOf('</form>', re.lastIndex);
    const body = text.slice(re.lastIndex, end === -1 ? text.length : end);
    if (TOKEN_FIELD.test(body) || TOKEN_HELPER.test(body) || TOKEN_HELPER.test(attrs)) continue;
    hits.push({ ruleId: 'PHP-CSRF-001', line: lineAt(text, m.index), column: 1 });
  }
  return hits;
}

/* ------------------------------------------------------------ DOM XSS */

const DOM_SOURCE = /(?<![\w$.])(?:(?:window|document|self|top)\s*\.\s*)?location\s*\.\s*(?:hash|search|href|pathname)\b|(?:window|document)\s*\.\s*location\b(?!\s*\.\s*(?:reload|assign|replace))|document\s*\.\s*(?:URL|documentURI|baseURI|referrer)\b|window\s*\.\s*name\b|URLSearchParams|\.searchParams\b/;
const MESSAGE_SOURCE = /(?<![\w$.])(?:event|evt|e|msg|message)\s*\.\s*data\b/;
const HTML_SINK = /(\.(?:innerHTML|outerHTML)\s*\+?=(?!=)|document\s*\.\s*write(?:ln)?\s*\(|\.insertAdjacentHTML\s*\(\s*[^,]+,|\.(?:html|append|prepend|after|before|replaceWith)\s*\(\s*(?=[^'"`)\s]))/;
const CODE_SINK = /(\beval\s*\(|\bnew\s+Function\s*\(|\bset(?:Timeout|Interval)\s*\(\s*(?=['"`]|[^'"`,)]*\+))/;

function scriptTexts(file, text) {
  if (['js', 'mjs', 'cjs'].includes(file.ext)) return [{ offset: 0, code: text }];
  const out = [];
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(text)) !== null) out.push({ offset: m.index + m[0].indexOf(m[1]), code: m[1] });
  return out;
}

function isMinified(code) {
  if (code.length < 2000) return false;
  const lines = code.split('\n').length;
  return code.length / lines > 400;
}

function identifierMatcher(ids) {
  if (ids.size === 0) return null;
  const alt = [...ids].map((id) => id.replace(/[$]/g, '\\$')).join('|');
  return new RegExp(`(?<![\\w$])(?:${alt})(?![\\w$])`);
}

function domRules(file, text) {
  if (!SCRIPT_EXT.has(file.ext)) return [];
  const hits = [];
  const starts = lineStarts(text);
  for (const { offset, code } of scriptTexts(file, text)) {
    // minified bundles are third-party builds; their sources are reviewed through dependency checks
    if (isMinified(code)) continue;
    if (!HTML_SINK.test(code) && !CODE_SINK.test(code)) continue;
    const statements = code.split(/(?<=[;\n])/);
    const listensForMessages = /addEventListener\(\s*['"]message['"]|onmessage\s*=/.test(code);
    const isSource = (t) => DOM_SOURCE.test(t) || (listensForMessages && MESSAGE_SOURCE.test(t));
    const tainted = new Set();
    // two passes so that later-declared derived variables are recognized
    for (let pass = 0; pass < 2; pass++) {
      let matcher = identifierMatcher(tainted);
      for (const stmt of statements) {
        const m = /(?:\b(?:var|let|const)\s+)?([A-Za-z_$][\w$]*)\s*=(?!=)([\s\S]*)/.exec(stmt);
        if (!m || tainted.has(m[1])) continue;
        const rhs = m[2];
        if (isSource(rhs) || (matcher && matcher.test(rhs))) {
          tainted.add(m[1]);
          matcher = identifierMatcher(tainted);
        }
      }
    }
    const matcher = identifierMatcher(tainted);
    let pos = 0;
    for (const stmt of statements) {
      const idx = pos;
      pos += stmt.length;
      if (/^\s*(\/\/|\*|\/\*)/.test(stmt)) continue;
      for (const [re, ruleId] of [[HTML_SINK, 'JS-XSS-001'], [CODE_SINK, 'JS-CODE-001']]) {
        const sm = re.exec(stmt);
        if (!sm) continue;
        const after = stmt.slice(sm.index + sm[0].length);
        const direct = isSource(after);
        const viaVar = Boolean(matcher && matcher.test(after));
        if (!direct && !viaVar) continue;
        hits.push({ ruleId, line: lineFromStarts(starts, offset + idx + sm.index), column: 1, confidence: direct ? 'high' : 'medium' });
      }
    }
  }
  return hits;
}

/* ------------------------------------------------------------ http:// */

const SAFE_HOSTS = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|[\w.-]*example\.(com|org|net)|www\.w3\.org|w3\.org|schemas\.[\w.-]+|purl\.org|ns\.adobe\.com|xmlns\.com|ogp\.me|json-schema\.org|www\.opengis\.net|[\w.-]+\.local|[\w.-]+\.test|[\w.-]+\.localhost|php\.net|www\.php\.net)(?=[:/'"\s]|$)/i;

function httpUrls(file, lines) {
  if (!TEMPLATE_EXT.has(file.ext) && !['js', 'css'].includes(file.ext)) return [];
  const hits = [];
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|#|\*|\/\*|<!--)/.test(line) || /xmlns(:\w+)?\s*=|<!DOCTYPE|@link|@see|license/i.test(line)) return;
    const re = /(["'(=]\s*)http:\/\/([^\s"'<>)]+)/gi;
    let m;
    while ((m = re.exec(line)) !== null) {
      if (SAFE_HOSTS.test(m[2])) continue;
      hits.push({ ruleId: 'PHP-HTTP-001', line: i + 1, column: m.index + m[1].length + 1, message: `Plain HTTP URL: http://${m[2].slice(0, 80)}` });
      break;
    }
  });
  return hits;
}

/* ----------------------------------------------------- PHP fallbacks */

const SUPER = '\\$_(GET|POST|REQUEST|COOKIE|FILES|SERVER\\s*\\[\\s*[\'"](HTTP_\\w+|REQUEST_URI|QUERY_STRING|PHP_SELF)[\'"])';
const FALLBACK = [
  ['PHP-SQLI-001', new RegExp(`\\b(mysqli?_query|mysql_db_query|pg_query|->query|->exec|->prepare)\\s*\\([^;]*${SUPER}`, 'i')],
  ['PHP-XSS-001', new RegExp(`^(?!.*(htmlspecialchars|htmlentities|intval|\\(int\\)|json_encode|urlencode)).*\\b(echo|print)\\b[^;]*${SUPER}`, 'i')],
  ['PHP-XSS-001', new RegExp(`^(?!.*(htmlspecialchars|htmlentities|intval)).*<\\?=\\s*${SUPER}`, 'i')],
  ['PHP-CMDI-001', new RegExp(`\\b(system|exec|shell_exec|passthru|popen|proc_open)\\s*\\([^;]*${SUPER}`, 'i')],
  ['PHP-INCL-001', new RegExp(`\\b(include|require)(_once)?\\b[^;]*${SUPER}`, 'i')],
  ['PHP-CODE-001', new RegExp(`\\b(eval|assert|create_function)\\s*\\([^;]*${SUPER}`, 'i')],
  ['PHP-DESER-001', new RegExp(`\\bunserialize\\s*\\([^;]*${SUPER}`, 'i')],
  ['PHP-REDIR-001', new RegExp(`\\bheader\\s*\\(\\s*["']location:[^;]*${SUPER}`, 'i')],
];

function phpFallback(lines) {
  const hits = [];
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|#|\*|\/\*)/.test(line)) return;
    for (const [ruleId, re] of FALLBACK) {
      if (re.test(line)) hits.push({ ruleId, line: i + 1, column: 1, confidence: 'medium', message: 'Request data is used directly in this call (heuristic check: the file could not be fully parsed).' });
    }
  });
  return hits;
}

module.exports = { csrfForms, domRules, httpUrls, phpFallback, TEMPLATE_EXT, lineAt };
