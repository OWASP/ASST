'use strict';
/*
 * Secret detection: provider tokens with well-known formats (high confidence), private
 * keys, credentials in connection URLs, and password/secret/token assignments in code
 * and configuration files (entropy and placeholder checks, medium confidence).
 *
 * The secret itself never reaches a report: messages show a masked form and every hit
 * carries the raw value in `redact`, which the report builder masks in code snippets.
 */

const PROVIDERS = [
  { label: 'AWS access key ID', hint: ['AKIA', 'ASIA', 'ABIA', 'ACCA'], re: /\b((?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16})\b/g },
  { label: 'AWS secret access key', hint: /secret_?access_?key/i, re: /aws_?secret_?access_?key['"]?\s*(?:=>|[:=])\s*['"]?([A-Za-z0-9/+]{40})(?![A-Za-z0-9/+])/gi },
  { label: 'GitHub token', hint: ['ghp_', 'gho_', 'ghu_', 'ghs_', 'ghr_'], re: /\b(gh[pousr]_[A-Za-z0-9]{36,251})\b/g },
  { label: 'GitHub fine-grained token', hint: ['github_pat_'], re: /\b(github_pat_[A-Za-z0-9_]{60,255})\b/g },
  { label: 'GitLab token', hint: ['glpat-'], re: /\b(glpat-[A-Za-z0-9_-]{20,})\b/g },
  { label: 'Slack token', hint: ['xox'], re: /\b(xox[abposr]-[A-Za-z0-9-]{10,})\b/g },
  { label: 'Slack webhook URL', hint: ['hooks.slack.com'], re: /(https:\/\/hooks\.slack\.com\/services\/T[A-Za-z0-9_]+\/B[A-Za-z0-9_]+\/[A-Za-z0-9_]{16,})/g, severity: 'medium' },
  { label: 'Stripe secret key', hint: ['_live_'], re: /\b((?:sk|rk)_live_[A-Za-z0-9]{20,})\b/g },
  { label: 'Google API key', hint: ['AIza'], re: /\b(AIza[0-9A-Za-z_-]{35})(?![0-9A-Za-z_-])/g, severity: 'medium', confidence: 'medium', note: 'Browser keys are public by design; make sure this key is restricted to your sites and APIs.' },
  { label: 'SendGrid API key', hint: ['SG.'], re: /\b(SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43})(?![A-Za-z0-9_-])/g },
  { label: 'npm access token', hint: ['npm_'], re: /\b(npm_[A-Za-z0-9]{36})\b/g },
  { label: 'OpenAI API key', hint: ['T3BlbkFJ'], re: /\b(sk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{16,}T3BlbkFJ[A-Za-z0-9_-]{16,})(?![A-Za-z0-9_-])/g },
  { label: 'Anthropic API key', hint: ['sk-ant-'], re: /\b(sk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_-]{80,})(?![A-Za-z0-9_-])/g },
  { label: 'private key', hint: ['PRIVATE KEY'], re: /-----BEGIN ((?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?)-----/g, whole: true },
  { label: 'JSON Web Token', hint: ['eyJ'], re: /\b(eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{16,})(?![A-Za-z0-9_-])/g, severity: 'medium', confidence: 'low' },
  { label: 'password in a connection URL', hint: ['://'], re: /\b(?:mysqli?|postgres(?:ql)?|mongodb(?:\+srv)?|redis|amqps?|s?ftp|smtps?):\/\/[^\s:@/'"]+:([^\s@/'"]{3,})@[^\s'"]+/g, confidence: 'medium' },
];

const SECRET_NAME = /(?:passw(?:or)?d|passwd|\bpwd\b|_pwd\b|secret|api_?key|apikey|access_?token|auth_?token|client_?secret|private_?key|signing_?key|encryption_?key|app_key)/i;
const SECRET_NAME_G = new RegExp(SECRET_NAME.source, 'gi');

/** Cheap substring pre-check before running a provider pattern over a whole file. */
function hinted(hint, text) {
  if (!hint) return true;
  if (hint instanceof RegExp) return hint.test(text);
  return hint.some((h) => text.includes(h));
}

/** The header line plus every line of a private key block, so snippets never show key material. */
function keyMaterial(text, m) {
  const end = text.indexOf('-----END', m.index + m[0].length);
  const body = end === -1 ? '' : text.slice(m.index + m[0].length, end);
  return [m[0], ...body.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length >= 8)];
}
const NOT_SECRET_NAME = /(?:_?(?:host|user(?:name)?|port|name|url|uri|path|file|id|type|length|min|max|field|label|placeholder|hint|reset|policy|confirm(?:ation)?|strength|regex|pattern|rules?|expires?|ttl|header|param|input)$)/i;

const CODE_ASSIGN = /(['"]?)([A-Za-z_$][\w$.-]{0,60})\1\s*\]?\s*(?:=>|:|=)\s*(['"])([^'"\r\n]{6,200})\3/g;
const CONFIG_ASSIGN = /^\s*(?:export\s+)?([A-Za-z_][\w.-]{0,60})\s*[:=]\s*(['"]?)([^'"\s#;]{6,200})\2\s*(?:[#;].*)?$/;

const PLACEHOLDER = /^(?:x+|\*+|\.+|-+|_+|0+|#+|null|nil|none|true|false|empty|undefined|changeme|change[_-]?me|password\d*|passwd|secret|example|sample|dummy|demo|test(?:ing)?|todo|fixme|redacted|placeholder|default|your[_-].*|my[_-]?(?:password|secret|key|token).*|enter[_-].*|insert[_-].*|put[_-].*|replace[_-].*|<[^>]*>|\$\{[^}]*\}|\$[A-Z_]+|%[^%]*%|\{\{[^}]*\}\}|\[[^\]]*\]|env\(.*|getenv\(.*)$/i;
const PLACEHOLDER_PART = /(?:EXAMPLE|xxxx|placeholder|dummy|change[_-]?me|your[_-]|<your|lorem)/i;

const CODE_EXT = new Set(['php', 'phtml', 'inc', 'module', 'js', 'mjs', 'cjs', 'ts', 'jsx', 'tsx', 'json', 'xml', 'py', 'rb', 'go', 'java', 'cs', 'sh', 'bash', 'ps1', 'html', 'htm', 'twig', 'vue']);
const CONFIG_EXT = new Set(['env', 'ini', 'conf', 'cnf', 'cfg', 'config', 'properties', 'yml', 'yaml', 'toml', 'htpasswd']);
const SKIP_NAME = /(?:\.min\.js|\.map|\.lock|-lock\.json|\.example|\.sample|\.dist|\.template|\.tpl\.env)$/i;
const TEST_PATH = /(?:^|\/)(?:tests?|spec|__tests__|__mocks__|fixtures?|examples?|samples?|docs?|demo)(?:\/|$)/i;

function entropy(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  let h = 0;
  for (const n of counts.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function charClasses(s) {
  return [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(s)).length;
}

function looksLikeSecretValue(v) {
  if (PLACEHOLDER.test(v) || PLACEHOLDER_PART.test(v)) return false;
  if (/\s/.test(v) && v.split(/\s+/).length > 2) return false; // prose, labels
  if (/^[_-]*[a-z]+(?:[_-][a-z0-9]+)*$/.test(v)) return false; // identifiers such as "user_password"
  if (/^[A-Z]+(?:_[A-Z0-9]+)+$/.test(v)) return false; // constant names such as FTP_PRIKEY
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) return false; // e-mail addresses
  if (/^(?:https?:)?\/\//.test(v) || /^[./\\]/.test(v)) return false; // URLs and paths
  if (/^\d+$/.test(v) && v.length < 10) return false;
  if (/^(?:[A-Za-z_]\w*::|\$|\{|%|\\)/.test(v)) return false; // code, templates, escapes
  if (/^[0-9a-f]{40,128}$/i.test(v) === false && charClasses(v) < 2) return false;
  return entropy(v) >= (charClasses(v) >= 3 ? 2.4 : 2.8);
}

function mask(value, keepPrefix = 0) {
  const prefix = keepPrefix ? value.slice(0, keepPrefix) : '';
  return `${prefix}${'*'.repeat(Math.min(8, Math.max(4, value.length - prefix.length)))} (${value.length} characters)`;
}

function knownPrefix(value) {
  const m = /^(AKIA|ASIA|ABIA|ACCA|gh[pousr]_|github_pat_|glpat-|xox[abposr]-|sk_live_|rk_live_|AIza|SG\.|npm_|sk-ant-|sk-proj-|sk-|eyJ)/.exec(value);
  return m ? m[1].length : 0;
}

function lineAt(starts, index) {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= index) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
}

/**
 * @param {{rel:string, name:string, ext:string}} file
 * @param {string} text
 * @returns {Array<{ruleId, line, column, severity?, confidence, message, redact}>}
 */
function kindOf(file) {
  if (SKIP_NAME.test(file.name)) return null;
  const isEnv = /^\.env(?:\.|$)/.test(file.name) && !/\.(?:example|sample|dist|template|defaults?)$/i.test(file.name);
  if (isEnv || CONFIG_EXT.has(file.ext)) return 'config';
  if (CODE_EXT.has(file.ext)) return 'code';
  return null;
}

/** True when scanSecrets() looks at this file (lets callers skip reading other files). */
function wants(file) {
  return kindOf(file) !== null;
}

function scanSecrets(file, text) {
  const kind = kindOf(file);
  if (!kind) return [];
  const isConfig = kind === 'config';
  const isCode = kind === 'code';
  if (!text || text.length > 2 * 1024 * 1024) return [];
  if (file.ext === 'js' && /\n/.test(text) === false && text.length > 5000) return []; // minified bundle

  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) starts.push(i + 1);
  const testLike = TEST_PATH.test(file.rel);
  const hits = [];
  const seen = new Set();
  const add = (index, value, fields) => {
    const line = lineAt(starts, index);
    const key = `${line}|${value}`;
    if (seen.has(key)) return;
    seen.add(key);
    hits.push({
      ruleId: 'SECRET-001',
      line,
      column: index - starts[line - 1] + 1,
      ...fields,
      confidence: testLike ? 'low' : (fields.confidence || 'high'),
      redact: value,
    });
  };

  for (const p of PROVIDERS) {
    if (!hinted(p.hint, text)) continue;
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(text)) !== null) {
      const value = m[1];
      if (PLACEHOLDER.test(value) || PLACEHOLDER_PART.test(value) || /(.)\1{9,}/.test(value)) continue;
      const shown = p.whole ? value : mask(value, knownPrefix(value));
      add(m.index, p.whole ? keyMaterial(text, m) : value, {
        severity: p.severity,
        confidence: p.confidence,
        message: `A ${p.label} is stored in the source${p.whole ? '' : ` (${shown})`}. Remove it from the code, rotate it, and load it from the environment or a secrets manager.${p.note ? ` ${p.note}` : ''}`,
      });
    }
  }

  const reportAssignment = (index, name, value) => {
    if (!SECRET_NAME.test(name) || NOT_SECRET_NAME.test(name)) return;
    if (!looksLikeSecretValue(value)) return;
    add(index, value, {
      confidence: 'medium',
      message: `"${name}" is set to a literal value (${mask(value)}). Keep passwords, keys and tokens out of source files; load them from environment variables or a secrets manager, and rotate this one.`,
    });
  };

  if (isConfig) {
    const lines = text.split('\n');
    lines.forEach((l, i) => {
      const m = CONFIG_ASSIGN.exec(l.replace(/\r$/, ''));
      if (m) reportAssignment(starts[i] + l.indexOf(m[3]), m[1], m[3]);
    });
  }
  if (isCode) {
    // only lines that mention a secret-like name (plus the next line, for wrapped assignments)
    SECRET_NAME_G.lastIndex = 0;
    let k;
    while ((k = SECRET_NAME_G.exec(text)) !== null) {
      const line = lineAt(starts, k.index);
      const begin = starts[line - 1];
      const lineEnd = line < starts.length ? starts[line] : text.length;
      const end = line + 1 < starts.length ? starts[line + 1] : text.length;
      const chunk = text.slice(begin, end);
      CODE_ASSIGN.lastIndex = 0;
      let m;
      while ((m = CODE_ASSIGN.exec(chunk)) !== null) {
        if (m.index >= lineEnd - begin) break;
        reportAssignment(begin + m.index + m[0].lastIndexOf(m[4]), m[2], m[4]);
      }
      SECRET_NAME_G.lastIndex = Math.max(SECRET_NAME_G.lastIndex, lineEnd);
    }
  }
  return hits.sort((a, b) => a.line - b.line || a.column - b.column);
}

module.exports = { scanSecrets, wants, mask, entropy, looksLikeSecretValue };
