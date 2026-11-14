'use strict';
/*
 * Structural PHP rules evaluated on the parsed AST (no data flow needed).
 * Each rule returns hits: { ruleId, line, column?, message?, confidence?, severity? }.
 */

function lastSegment(name) {
  return String(name || '').replace(/^\\/, '').split('\\').pop().toLowerCase();
}

function isNode(v) {
  return v && typeof v === 'object' && typeof v.kind === 'string';
}

function lineOf(n) {
  return n && n.loc ? n.loc.start.line : null;
}

function colOf(n) {
  return n && n.loc ? n.loc.start.column + 1 : null;
}

/** Depth-first visit of every node. */
function walk(node, visit) {
  if (!isNode(node)) return;
  visit(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue;
    if (Array.isArray(value)) { for (const child of value) if (isNode(child)) walk(child, visit); }
    else if (isNode(value)) walk(value, visit);
  }
}

function callName(n) {
  if (!n || n.kind !== 'call' || !n.what) return null;
  if (n.what.kind === 'name') return lastSegment(n.what.name);
  if ((n.what.kind === 'propertylookup' || n.what.kind === 'nullsafepropertylookup') && n.what.offset && n.what.offset.kind === 'identifier') return `->${n.what.offset.name.toLowerCase()}`;
  return null;
}

const namesCache = new WeakMap();

/** Names mentioned in a subtree: variables, array string keys, properties, constants. */
function names(n) {
  if (!isNode(n)) return [];
  if (namesCache.has(n)) return namesCache.get(n);
  const out = computeNames(n);
  namesCache.set(n, out);
  return out;
}

function computeNames(n) {
  const out = [];
  walk(n, (x) => {
    if (x.kind === 'variable' && typeof x.name === 'string') out.push(x.name);
    else if (x.kind === 'offsetlookup' && x.offset && x.offset.kind === 'string') out.push(String(x.offset.value));
    else if ((x.kind === 'propertylookup' || x.kind === 'nullsafepropertylookup') && x.offset && x.offset.kind === 'identifier') out.push(x.offset.name);
    else if (x.kind === 'call') { const c = callName(x); if (c) out.push(c.replace('->', '')); }
  });
  return out;
}

function literalString(n) {
  if (!n) return null;
  if (n.kind === 'string' || n.kind === 'nowdoc') return String(n.value);
  if (n.kind === 'encapsed' && n.value && n.value.length && n.value[0].expression && n.value[0].expression.kind === 'string') return String(n.value[0].expression.value);
  if (n.kind === 'bin' && n.type === '.') return literalString(n.left);
  return null;
}

function isLiteral(n) {
  return n && ['string', 'number', 'boolean', 'nullkeyword', 'nowdoc'].includes(n.kind);
}

function constNames(n) {
  const out = [];
  walk(n, (x) => { if (x.kind === 'name') out.push(lastSegment(x.name).toUpperCase()); });
  return out;
}

/* ------------------------------------------------------------ redirects */

function isHalt(s) {
  if (!s) return false;
  if (s.kind === 'return' || s.kind === 'throw') return true;
  if (s.kind === 'expressionstatement' && s.expression && (s.expression.kind === 'exit' || s.expression.kind === 'throw')) return true;
  if (s.kind === 'exit') return true;
  return false;
}

function isTrivial(s) {
  if (!s) return true;
  if (s.kind === 'inline') return String(s.value).trim() === '';
  if (s.kind === 'expressionstatement' && s.expression && s.expression.kind === 'call') {
    const n = callName(s.expression);
    return ['session_write_close', 'ob_end_flush', 'ob_flush', 'flush', 'ob_end_clean', 'header', 'http_response_code', 'setcookie', 'session_regenerate_id'].includes(n);
  }
  return ['break', 'continue', 'noop'].includes(s.kind);
}

function headerLocationCall(s) {
  if (!s || s.kind !== 'expressionstatement' || !s.expression) return null;
  let e = s.expression;
  if (e.kind === 'assign') e = e.right;
  if (e.kind !== 'call' || callName(e) !== 'header' || !e.arguments || !e.arguments[0]) return null;
  const text = literalString(e.arguments[0]);
  return text !== null && /^['"\s]*location\s*:/i.test(text) ? e : null;
}

/** 'halt' | 'code' | 'none' for the statements that run after index i of list. */
function continuation(list, i) {
  for (let j = i + 1; j < list.length; j++) {
    const s = list[j];
    if (isTrivial(s)) continue;
    if (s.kind === 'function' || s.kind === 'class' || s.kind === 'interface' || s.kind === 'trait') continue;
    return isHalt(s) ? 'halt' : 'code';
  }
  return 'none';
}

function stmtList(n) {
  if (!n) return [];
  if (n.kind === 'block') return n.children || [];
  return [n];
}

function earRule(ast) {
  const hits = [];
  const scan = (list, outer) => {
    list.forEach((s, i) => {
      const header = headerLocationCall(s);
      if (header) {
        let verdict = continuation(list, i);
        if (verdict === 'none') verdict = outer();
        if (verdict === 'code') hits.push({ ruleId: 'PHP-EAR-001', line: lineOf(header), column: colOf(header) });
      }
      const after = () => { const v = continuation(list, i); return v === 'none' ? outer() : v; };
      switch (s && s.kind) {
        case 'if':
          scan(stmtList(s.body), after);
          if (s.alternate) scan(stmtList(s.alternate), after);
          break;
        case 'block': case 'namespace': case 'declare':
          scan(s.children || [], after);
          break;
        case 'while': case 'do': case 'for': case 'foreach':
          scan(stmtList(s.body), after);
          break;
        case 'switch':
          for (const c of (s.body && s.body.children) || []) scan(stmtList(c.body), after);
          break;
        case 'try':
          scan(stmtList(s.body), after);
          for (const c of s.catches || []) scan(stmtList(c.body), after);
          break;
        case 'function': case 'method':
          scan(stmtList(s.body), () => 'none');
          break;
        case 'class': case 'trait':
          for (const m of s.body || []) if (m.kind === 'method') scan(stmtList(m.body), () => 'none');
          break;
        default:
          break;
      }
    });
  };
  scan(ast.children || [], () => 'none');
  return hits;
}

/* ---------------------------------------------------------- cryptography */

const PASS_RE = /^(pass(word|wd|phrase)?|pwd|user_?pass(word)?|new_?pass(word)?|old_?pass(word)?|pass_?\w*|\w*_?password)$/i;
const FAST_HASHES = new Set(['md5', 'sha1', 'sha224', 'sha256', 'sha384', 'sha512', 'sha512/224', 'sha512/256', 'sha3-224', 'sha3-256', 'sha3-384', 'sha3-512', 'ripemd128', 'ripemd160', 'whirlpool', 'crc32', 'crc32b', 'md4', 'tiger192,3', 'fnv1a32', 'fnv1a64', 'xxh64', 'xxh128']);
const TOKEN_RE = /token|secret|nonce|csrf|salt|reset|otp|verif|activation|api_?key|session_?id|passw|pwd|invite|confirm/i;
const WEAK_RANDOM = new Set(['rand', 'mt_rand', 'uniqid', 'lcg_value', 'microtime', 'array_rand', 'str_shuffle', 'mt_srand', 'srand']);
const SECRET_CMP_RE = /^(.*_)?(token|csrf\w*|hash|hashed\w*|signature|sig|hmac|secret|password|passwd|pwd|api_?key|nonce|otp|digest)(_\w*)?$/i;

function cryptoRules(nodes) {
  const hits = [];
  nodes.forEach((n) => {
    if (n.kind === 'call') {
      const name = callName(n);
      const args = n.arguments || [];
      let fast = false;
      if (name === 'md5' || name === 'sha1' || name === 'crc32') fast = true;
      if ((name === 'hash' || name === 'hash_hmac') && args[0]) {
        const algo = literalString(args[0]);
        fast = algo !== null && FAST_HASHES.has(algo.toLowerCase());
      }
      if (fast) {
        const data = name === 'hash' || name === 'hash_hmac' ? args.slice(1, 2) : args.slice(0, 1);
        if (data.some((a) => names(a).some((x) => PASS_RE.test(x)))) hits.push({ ruleId: 'PHP-CRYPTO-001', line: lineOf(n), column: colOf(n) });
      }
    }
    if (n.kind === 'assign') {
      const target = names(n.left).pop() || '';
      if (TOKEN_RE.test(target)) {
        let weak = false;
        walk(n.right, (x) => { if (x.kind === 'call' && WEAK_RANDOM.has(callName(x))) weak = true; });
        if (weak) hits.push({ ruleId: 'PHP-CRYPTO-002', line: lineOf(n), column: colOf(n) });
      }
    }
    if (n.kind === 'bin' && ['==', '!=', '<>'].includes(n.type)) {
      if (isLiteral(n.left) || isLiteral(n.right)) return;
      const numericCall = (x) => x && x.kind === 'call' && ['count', 'strlen', 'intval', 'time', 'mb_strlen'].includes(callName(x));
      if (numericCall(n.left) || numericCall(n.right)) return;
      const secret = (x) => names(x).some((nm) => SECRET_CMP_RE.test(nm));
      if (secret(n.left) || secret(n.right)) hits.push({ ruleId: 'PHP-CRYPTO-003', line: lineOf(n), column: colOf(n) });
    }
  });
  return hits;
}

/* ------------------------------------------------------- authentication */

const SESSION_KEY_RE = /user|uid|login|logged|auth|admin|role|member|account|^id$/i;

function sessionFixationRule(nodes) {
  let checksPassword = false;
  let regenerates = false;
  const assignments = [];
  nodes.forEach((n) => {
    if (n.kind === 'call') {
      const name = callName(n);
      if (name === 'password_verify' || name === 'ldap_bind' || name === 'crypt') checksPassword = true;
      if (name === 'session_regenerate_id') regenerates = true;
    }
    if (n.kind === 'bin' && ['==', '===', '!=', '!=='].includes(n.type) && (names(n.left).concat(names(n.right))).some((x) => PASS_RE.test(x))) checksPassword = true;
    if (n.kind === 'offsetlookup' && n.what && n.what.kind === 'variable' && ['_POST', '_REQUEST'].includes(n.what.name) && n.offset && n.offset.kind === 'string' && PASS_RE.test(String(n.offset.value))) checksPassword = true;
    if (n.kind === 'assign' && n.left && n.left.kind === 'offsetlookup' && n.left.what && n.left.what.kind === 'variable' && n.left.what.name === '_SESSION') {
      const key = n.left.offset && n.left.offset.kind === 'string' ? String(n.left.offset.value) : '';
      if (SESSION_KEY_RE.test(key)) assignments.push(n);
    }
  });
  if (!checksPassword || regenerates || assignments.length === 0) return [];
  return [{ ruleId: 'PHP-AUTH-001', line: lineOf(assignments[0]), column: colOf(assignments[0]) }];
}

/* -------------------------------------------------------- configuration */

const TRUTHY = /^(1|on|true|yes|stdout|stderr)$/i;
const DB_ERROR_FNS = new Set(['mysqli_error', 'mysql_error', 'pg_last_error', 'pg_result_error', 'sqlsrv_errors', 'oci_error', 'db2_stmt_errormsg', 'odbc_errormsg', 'mysqli_connect_error', 'mysqli_stmt_error', '->geterrormessage']);
const EXC_METHODS = new Set(['->getmessage', '->gettraceasstring', '->errorinfo', '->gettrace']);

function configRules(nodes) {
  const hits = [];
  nodes.forEach((n) => {
    if (n.kind === 'call') {
      const name = callName(n);
      const args = n.arguments || [];
      if (name === 'ini_set' && args.length >= 2) {
        const key = literalString(args[0]);
        const val = args[1];
        const text = val.kind === 'number' ? String(val.value) : val.kind === 'boolean' ? String(val.value) : literalString(val);
        if (key && /^display_(startup_)?errors$/i.test(key) && text !== null && TRUTHY.test(text)) hits.push({ ruleId: 'PHP-CONF-001', line: lineOf(n), column: colOf(n) });
      }
      if (name === 'phpinfo') hits.push({ ruleId: 'PHP-CONF-002', line: lineOf(n), column: colOf(n) });
    }
    const outputs = n.kind === 'echo' ? n.expressions : (n.kind === 'print' ? [n.expression] : (n.kind === 'exit' && n.expression ? [n.expression] : null));
    if (outputs) {
      let leaks = false;
      for (const o of outputs) {
        walk(o, (x) => {
          if (x.kind !== 'call') return;
          const c = callName(x);
          if (DB_ERROR_FNS.has(c) || EXC_METHODS.has(c)) leaks = true;
        });
      }
      if (leaks) hits.push({ ruleId: 'PHP-ERR-001', line: lineOf(n), column: colOf(n) });
    }
  });
  return hits;
}

/* ------------------------------------------------------------------ XXE */

const XML_LOADERS = new Set(['->loadxml', '->loadhtml', '->load', '->loadhtmlfile', 'simplexml_load_string', 'simplexml_load_file', 'simplexml_import_dom', '->xml', '->open']);

function xxeRules(nodes) {
  const hits = [];
  nodes.forEach((n) => {
    if (n.kind === 'call') {
      const name = callName(n);
      if (XML_LOADERS.has(name) || (name && name.startsWith('new'))) {
        const flags = constNames({ kind: 'array', items: n.arguments || [] });
        if (flags.some((f) => f === 'LIBXML_NOENT' || f === 'LIBXML_DTDLOAD' || f === 'LIBXML_DTDATTR')) hits.push({ ruleId: 'PHP-XXE-001', line: lineOf(n), column: colOf(n) });
      }
      if (name === 'libxml_disable_entity_loader' && n.arguments && n.arguments[0] && n.arguments[0].kind === 'boolean' && n.arguments[0].value === false) {
        hits.push({ ruleId: 'PHP-XXE-001', line: lineOf(n), column: colOf(n) });
      }
      if (name === '->setparserproperty' && constNames({ kind: 'array', items: n.arguments || [] }).some((f) => /SUBST_ENTITIES|LOADDTD/.test(f))) {
        const v = n.arguments[1];
        if (v && v.kind === 'boolean' && v.value) hits.push({ ruleId: 'PHP-XXE-001', line: lineOf(n), column: colOf(n) });
      }
    }
    if (n.kind === 'new' && n.what && n.what.kind === 'name' && /^(simplexmlelement)$/i.test(lastSegment(n.what.name))) {
      if (constNames({ kind: 'array', items: n.arguments || [] }).some((f) => f === 'LIBXML_NOENT' || f === 'LIBXML_DTDLOAD')) hits.push({ ruleId: 'PHP-XXE-001', line: lineOf(n), column: colOf(n) });
    }
    if (n.kind === 'assign' && n.left && n.left.kind === 'propertylookup' && n.left.offset && n.left.offset.kind === 'identifier' &&
      /^(substituteEntities|resolveExternals)$/i.test(n.left.offset.name) && n.right && n.right.kind === 'boolean' && n.right.value) {
      hits.push({ ruleId: 'PHP-XXE-001', line: lineOf(n), column: colOf(n) });
    }
  });
  return hits;
}

/* --------------------------------------------------- hard-coded secrets */

const PLACEHOLDERS = /^(|password|passwd|your[_-]?password|changeme|change[_-]?me|secret|xxx+|\*+|<[^>]*>|\$\{?\w+\}?|%\w+%|todo|dummy|example|test|null)$/i;
const CONNECT_PASSWORD_ARG = { mysqli_connect: 2, mysql_connect: 2, mysql_pconnect: 2, mysqli_real_connect: 3, ldap_bind: 2, oci_connect: 1, odbc_connect: 2, db2_connect: 2 };
const NEW_PASSWORD_ARG = { mysqli: 2, pdo: 2 };

function secretRules(nodes) {
  const hits = [];
  const check = (arg, n) => {
    const s = arg && (arg.kind === 'string' || arg.kind === 'nowdoc') ? String(arg.value) : null;
    if (s !== null && !PLACEHOLDERS.test(s.trim()) && s.length >= 4) hits.push({ ruleId: 'PHP-SECRET-001', line: lineOf(n), column: colOf(n), redact: s });
  };
  nodes.forEach((n) => {
    if (n.kind === 'call') {
      const name = callName(n);
      if (name && Object.prototype.hasOwnProperty.call(CONNECT_PASSWORD_ARG, name)) check((n.arguments || [])[CONNECT_PASSWORD_ARG[name]], n);
      if (name === 'pg_connect') {
        const s = literalString((n.arguments || [])[0]);
        const m = s && /password\s*=\s*'?([^'\s]+)/i.exec(s);
        if (m && !PLACEHOLDERS.test(m[1])) hits.push({ ruleId: 'PHP-SECRET-001', line: lineOf(n), column: colOf(n), redact: m[1] });
      }
      if (name === 'define' && n.arguments && n.arguments.length >= 2) {
        const key = literalString(n.arguments[0]);
        if (key && /(PASS(WORD)?|PWD|SECRET|API_?KEY)$/i.test(key)) check(n.arguments[1], n);
      }
    }
    if (n.kind === 'new' && n.what && n.what.kind === 'name') {
      const cls = lastSegment(n.what.name);
      if (Object.prototype.hasOwnProperty.call(NEW_PASSWORD_ARG, cls)) check((n.arguments || [])[NEW_PASSWORD_ARG[cls]], n);
    }
  });
  return hits;
}

/** Runs every structural rule on one file's AST. */
function runAstRules(ast) {
  const nodes = [];
  walk(ast, (n) => { nodes.push(n); });
  return [
    ...earRule(ast),
    ...cryptoRules(nodes),
    ...sessionFixationRule(nodes),
    ...configRules(nodes),
    ...xxeRules(nodes),
    ...secretRules(nodes),
  ];
}

module.exports = { runAstRules, walk, callName, literalString };
