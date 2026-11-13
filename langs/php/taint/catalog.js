'use strict';
/*
 * PHP knowledge base for the taint interpreter: sources, sinks, sanitizers,
 * propagators and guards. Framework packs extend it through `extend()`.
 */
const V = require('../../../core/taint/value');
const { allowlist, replaceEffect, splitPattern, WORD, DIGITS } = require('./regex');

const NUM = { t: false, num: true };
const URLENC = `${WORD}-.~%+`;
const B64 = `${WORD.replace('_', '')}+/=`;
const EMAIL_VALID = `${WORD}!#$%&'*+-=?^\`{|}~@.`;
const HEX = `${DIGITS}abcdefABCDEF`;

/* ------------------------------------------------------------------ helpers */

function str(v) {
  return v && v.str !== undefined ? v.str : undefined;
}

function constName(v) {
  const s = str(v);
  return s === undefined ? '' : s;
}

function arrStrings(v) {
  if (!v) return null;
  if (v.str !== undefined) return [v.str];
  if (v.arr && v.arr.size) {
    const out = [];
    for (const [, item] of v.arr) {
      if (item.t || item.str === undefined) return null;
      out.push(item.str);
    }
    return out;
  }
  return null;
}

function propagate(v, line, note) {
  if (!v || !v.t) return v && v.arr ? { t: false } : V.CLEAN;
  const out = { ...v };
  delete out.segs;
  delete out.str;
  return V.step(out, line, note);
}

function reset(v, line, note) {
  if (!v || !v.t) return V.CLEAN;
  return V.step({ t: true, c: v.c, g: v.g, allowed: null, enc: {}, trace: v.trace, origins: v.origins }, line, note);
}

function elementOf(v) {
  if (!v) return V.CLEAN;
  if (v.arr && v.arr.size) return V.joinAll([...v.arr.values()]);
  return v.t ? propagate(v) : V.CLEAN;
}

function arrayOf(v, line, note) {
  if (!v || !v.t) return { t: false, arr: new Map() };
  const el = propagate(v, line, note);
  return { ...el, arr: new Map([['*', el]]) };
}

/* ----------------------------------------------------------------- sinks */

const S = (rule, arg, check, extra = {}) => ({ rule, arg, check, ...extra });
const sql = (arg) => S('PHP-SQLI-001', arg, 'sql');

const SINKS = {
  'fn:mysql_query': [sql(0)], 'fn:mysql_unbuffered_query': [sql(0)], 'fn:mysql_db_query': [sql(1)],
  'fn:mysqli_query': [sql(1)], 'fn:mysqli_real_query': [sql(1)], 'fn:mysqli_multi_query': [sql(1)],
  'fn:mysqli_prepare': [sql(1)], 'fn:mysqli_send_query': [sql(1)],
  'fn:pg_send_query': [sql(1)], 'fn:pg_prepare': [sql(2)], 'fn:pg_query_params': [sql(1)],
  'fn:sqlsrv_query': [sql(1)], 'fn:sqlsrv_prepare': [sql(1)], 'fn:odbc_exec': [sql(1)], 'fn:odbc_prepare': [sql(1)],
  'fn:oci_parse': [sql(1)], 'fn:db2_exec': [sql(1)], 'fn:db2_prepare': [sql(1)], 'fn:sqlite_query': [sql(1)], 'fn:sqlite_exec': [sql(1)],
  'm:multi_query': [sql(0)], 'm:real_query': [sql(0)], 'm:querysingle': [sql(0)], 'm:unbuffered_query': [sql(0)],

  '@echo': [S('PHP-XSS-001', 0, 'html', { name: 'echo' })],
  '@print': [S('PHP-XSS-001', 0, 'html', { name: 'print' })],
  '@exit': [S('PHP-XSS-001', 0, 'html', { name: 'exit/die' })],
  'fn:print_r': [S('PHP-XSS-001', 0, 'html', { name: 'print_r', confPenalty: 1 })],
  'fn:var_dump': [S('PHP-XSS-001', 0, 'html', { name: 'var_dump', confPenalty: 1 })],

  'fn:system': [S('PHP-CMDI-001', 0, 'shell')], 'fn:exec': [S('PHP-CMDI-001', 0, 'shell')],
  'fn:shell_exec': [S('PHP-CMDI-001', 0, 'shell')], 'fn:passthru': [S('PHP-CMDI-001', 0, 'shell')],
  'fn:popen': [S('PHP-CMDI-001', 0, 'shell')], 'fn:pcntl_exec': [S('PHP-CMDI-001', 0, 'shell')],
  '@shell': [S('PHP-CMDI-001', 0, 'shell', { name: 'backtick operator' })],

  '@eval': [S('PHP-CODE-001', 0, 'code', { name: 'eval' })],
  'fn:assert': [S('PHP-CODE-001', 0, 'code')],
  'fn:create_function': [S('PHP-CODE-001', 1, 'code')],
  'fn:call_user_func': [S('PHP-CODE-002', 0, 'any')], 'fn:call_user_func_array': [S('PHP-CODE-002', 0, 'any')],
  '@dyncall': [S('PHP-CODE-002', 0, 'any', { name: 'variable function call' })],

  '@include': [S('PHP-INCL-001', 0, 'any', { name: 'include/require' })],

  'fn:unlink': [S('PHP-PATH-001', 0, 'path')], 'fn:mkdir': [S('PHP-PATH-001', 0, 'path')], 'fn:rmdir': [S('PHP-PATH-001', 0, 'path')],
  'fn:opendir': [S('PHP-PATH-001', 0, 'path')], 'fn:scandir': [S('PHP-PATH-001', 0, 'path')], 'fn:file_put_contents': [S('PHP-PATH-001', 0, 'path')],
  'fn:highlight_file': [S('PHP-PATH-001', 0, 'path')], 'fn:show_source': [S('PHP-PATH-001', 0, 'path')],
  'fn:parse_ini_file': [S('PHP-PATH-001', 0, 'path')], 'fn:touch': [S('PHP-PATH-001', 0, 'path')],
  'fn:chmod': [S('PHP-PATH-001', 0, 'path')], 'fn:symlink': [S('PHP-PATH-001', 1, 'path')],
  'fn:copy': [S('PHP-PATH-001', 0, 'path'), S('PHP-PATH-001', 1, 'path')],
  'fn:rename': [S('PHP-PATH-001', 0, 'path'), S('PHP-PATH-001', 1, 'path')],
  'fn:move_uploaded_file': [S('PHP-PATH-001', 1, 'path')],
  'new:splfileobject': [S('PHP-PATH-001', 0, 'path')], 'new:directoryiterator': [S('PHP-PATH-001', 0, 'path')],

  'fn:curl_init': [S('PHP-SSRF-001', 0, 'urlControl')],
  'fn:http_redirect': [S('PHP-REDIR-001', 0, 'urlControl')],
  'fn:fsockopen': [S('PHP-SSRF-001', 0, 'urlControl')], 'fn:pfsockopen': [S('PHP-SSRF-001', 0, 'urlControl')],
  'fn:stream_socket_client': [S('PHP-SSRF-001', 0, 'urlControl')], 'fn:get_headers': [S('PHP-SSRF-001', 0, 'urlControl')],
  'new:soapclient': [S('PHP-SSRF-001', 0, 'urlControl')],

  'fn:ldap_search': [S('PHP-LDAP-001', 2, 'ldap')], 'fn:ldap_list': [S('PHP-LDAP-001', 2, 'ldap')], 'fn:ldap_read': [S('PHP-LDAP-001', 2, 'ldap')],
  'm:xpath': [S('PHP-XPATH-001', 0, 'xpath')],
  'fn:extract': [S('PHP-EXTRACT-001', 0, 'any')],
  'fn:unserialize': [S('PHP-DESER-001', 0, 'any')],
  'fn:error_log': [S('PHP-LOG-001', 0, 'crlf')], 'fn:syslog': [S('PHP-LOG-001', 1, 'crlf')],
  'fn:mail': [S('PHP-MAIL-001', 3, 'crlf'), S('PHP-CMDI-002', 4, 'shell')],
};

/* functions that accept local paths and remote URLs */
const PATH_OR_URL = new Set(['fn:file_get_contents', 'fn:fopen', 'fn:file', 'fn:readfile', 'fn:getimagesize', 'fn:simplexml_load_file', 'fn:fpassthru', 'fn:md5_file', 'fn:sha1_file', 'fn:exif_read_data']);

function pathOrUrlSinks(v) {
  const first = V.segmentsOf(v)[0];
  if (first && first.text !== undefined && /^[a-z][a-z0-9+.-]*:\/\//i.test(first.text)) return [S('PHP-SSRF-001', 0, 'urlControl')];
  return [S('PHP-PATH-001', 0, 'path')];
}

const DB_CLASSES = new Set(['mysqli', 'pdo', 'sqlite3', 'pgsql\\connection']);

function methodSqlSinks(e, ctx) {
  const recv = e.recv ? ctx.evalExpr(e.recv) : null;
  const cls = recv && recv.obj && recv.obj.cls ? String(recv.obj.cls).toLowerCase() : '';
  if (cls === 'domxpath') return [S('PHP-XPATH-001', 0, 'xpath')];
  const penalty = DB_CLASSES.has(cls) ? 0 : 1;
  return [S('PHP-SQLI-001', 0, 'sql', { confPenalty: penalty })];
}

/* --------------------------------------------------------- sanitizers */

const NUMERIC_FNS = ['intval', 'floatval', 'doubleval', 'boolval', 'abs', 'round', 'floor', 'ceil', 'count', 'sizeof', 'strlen',
  'mb_strlen', 'crc32', 'ord', 'time', 'mktime', 'strtotime', 'rand', 'mt_rand', 'random_int', 'ip2long', 'array_sum', 'array_product',
  'filesize', 'number_format', 'max', 'min', 'hexdec', 'octdec', 'bindec', 'is_numeric', 'strpos', 'stripos', 'strrpos', 'substr_count',
  'array_key_exists', 'in_array', 'array_search', 'preg_match', 'preg_match_all', 'strcmp', 'strcasecmp', 'strncmp', 'version_compare',
  'is_string', 'is_array', 'is_int', 'is_null', 'isset', 'empty', 'file_exists', 'is_file', 'is_dir', 'ctype_digit', 'ctype_alpha',
  'ctype_alnum', 'checkdate', 'hash_equals', 'password_verify', 'function_exists', 'method_exists', 'class_exists'];
const CLEAN_FNS = ['md5', 'sha1', 'hash', 'hash_hmac', 'password_hash', 'bin2hex', 'uniqid', 'random_bytes', 'openssl_random_pseudo_bytes',
  'spl_object_hash', 'date', 'gmdate', 'strftime', 'microtime', 'getenv', 'php_uname', 'phpversion', 'session_id', 'dechex', 'decbin',
  'decoct', 'json_last_error_msg', 'mysqli_error', 'mysql_error', 'mysqli_connect_error', 'gettype', 'get_class', 'mysqli_connect',
  'mysql_connect', 'pg_connect', 'ldap_connect', 'curl_init_ok', 'sys_get_temp_dir', 'getcwd', 'dirname', 'tempnam'];
const PROPAGATE_FNS = ['trim', 'ltrim', 'rtrim', 'chop', 'strtolower', 'strtoupper', 'mb_strtolower', 'mb_strtoupper', 'ucfirst', 'lcfirst',
  'ucwords', 'nl2br', 'wordwrap', 'substr', 'mb_substr', 'str_pad', 'strrev', 'str_repeat', 'strval', 'chunk_split', 'strstr', 'stristr',
  'strrchr', 'substr_replace', 'str_word_count', 'stripcslashes', 'quotemeta', 'iconv', 'mb_convert_encoding', 'utf8_encode', 'utf8_decode',
  'unserialize', 'json_decode', 'serialize', 'var_export', 'realpath', 'pathinfo', 'parse_url', 'current', 'reset', 'end', 'next',
  'prev', 'array_pop', 'array_shift', 'key', 'array_rand', 'html_entity_decode_noop', 'sprintf_noop'];
const RESET_FNS = ['urldecode', 'rawurldecode', 'base64_decode', 'hex2bin', 'html_entity_decode', 'htmlspecialchars_decode', 'stripslashes',
  'convert_uudecode', 'gzuncompress', 'gzinflate', 'str_rot13', 'json_encode'];
const ARRAY_FNS = ['array_values', 'array_keys', 'array_merge', 'array_merge_recursive', 'array_slice', 'array_reverse', 'array_unique',
  'array_filter', 'array_diff', 'array_intersect', 'array_flip', 'array_pad', 'array_replace', 'array_combine', 'array_chunk',
  'array_column', 'compact', 'func_get_args', 'iterator_to_array'];

const SQL_ESCAPE_FNS = { addslashes: 0, mysql_real_escape_string: 0, mysql_escape_string: 0, mysqli_real_escape_string: 1, mysqli_escape_string: 1, sqlite_escape_string: 0, pg_escape_string: -1, pg_escape_bytea: -1, db2_escape_string: 0, sqlsrv_escape: 0 };

const SECOND_ORDER_FNS = ['fgets', 'fgetss', 'fgetc', 'fread', 'fgetcsv', 'fscanf', 'stream_get_contents', 'stream_get_line', 'readline', 'file',
  'shell_exec', 'system', 'mysql_fetch_array', 'mysql_fetch_assoc', 'mysql_fetch_row', 'mysql_fetch_object', 'mysql_result',
  'mysqli_fetch_array', 'mysqli_fetch_assoc', 'mysqli_fetch_row', 'mysqli_fetch_object', 'mysqli_fetch_all', 'pg_fetch_array', 'pg_fetch_assoc',
  'pg_fetch_row', 'pg_fetch_object', 'pg_fetch_result', 'pg_fetch_all', 'sqlite_fetch_array', 'odbc_result', 'oci_fetch_array', 'oci_fetch_assoc'];
const SECOND_ORDER_METHODS = ['fetch', 'fetch_assoc', 'fetch_array', 'fetch_row', 'fetch_object', 'fetchall', 'fetchcolumn', 'fetchobject', 'fetcharray', 'fetch_all', 'fetchone'];

const KNOWN_METHODS = new Set(['query', 'exec', 'prepare', 'execute', 'real_query', 'multi_query', 'bind_param', 'bindparam', 'bindvalue',
  'fetch', 'fetch_assoc', 'fetch_array', 'fetchall', 'fetchcolumn', 'quote', 'escape_string', 'real_escape_string', 'xpath', 'evaluate',
  'loadxml', 'load', 'savexml', 'close', 'get_result', 'store_result', 'num_rows', 'setattribute', 'begintransaction', 'commit', 'rollback',
  'escapestring', 'querysingle', 'send', 'request', 'getbody', 'getcontents']);

function secondOrder(ctx, line, note) {
  if (!ctx.opts.secondOrder) return V.CLEAN;
  return V.source('src2', note, line, 1);
}

function filterEffect(filter, v, line) {
  switch (filter) {
    case 'FILTER_VALIDATE_INT': case 'FILTER_VALIDATE_FLOAT': case 'FILTER_VALIDATE_BOOLEAN': case 'FILTER_VALIDATE_BOOL':
      return NUM;
    case 'FILTER_VALIDATE_EMAIL':
      return V.sanitize(v, { allowed: EMAIL_VALID }, line, 'validated as email');
    case 'FILTER_VALIDATE_IP':
      return V.sanitize(v, { allowed: `${HEX}.:` }, line, 'validated as IP');
    case 'FILTER_SANITIZE_NUMBER_INT':
      return V.sanitize(v, { allowed: `${DIGITS}+-` }, line, 'number filter');
    case 'FILTER_SANITIZE_NUMBER_FLOAT':
      return V.sanitize(v, { allowed: `${DIGITS}+-.,eE` }, line, 'number filter');
    case 'FILTER_SANITIZE_SPECIAL_CHARS': case 'FILTER_SANITIZE_FULL_SPECIAL_CHARS': case 'FILTER_SANITIZE_STRING': case 'FILTER_SANITIZE_STRIPPED':
      return V.sanitize(v, { enc: { html: true, htmlQuotes: true } }, line, 'HTML special chars filter');
    case 'FILTER_SANITIZE_MAGIC_QUOTES': case 'FILTER_SANITIZE_ADD_SLASHES':
      return V.sanitize(v, { enc: { sql: true } }, line, 'add slashes filter');
    case 'FILTER_SANITIZE_EMAIL':
      return V.sanitize(v, { allowed: EMAIL_VALID + '[]' }, line, 'email filter');
    case 'FILTER_SANITIZE_ENCODED':
      return V.sanitize(v, { allowed: URLENC, enc: { url: true } }, line, 'URL-encoded filter');
    default:
      return propagate(v, line, `filter ${filter || 'default'}`);
  }
}

/** sprintf/vsprintf modelling: numeric conversions are safe, %s keeps quote context. */
function format(fmtVal, argVals, line, name) {
  const fmt = str(fmtVal);
  if (fmt === undefined) return V.weaken(V.joinAll([fmtVal, ...argVals].filter(Boolean)));
  const parts = [];
  let next = 0;
  let last = 0;
  const re = /%(?:(\d+)\$)?[-+ 0]*(?:'.)?\d*(?:\.\d+)?([bcdeEfFgGosuxX%])/g;
  let m;
  while ((m = re.exec(fmt)) !== null) {
    parts.push(V.constant(fmt.slice(last, m.index)));
    last = re.lastIndex;
    if (m[2] === '%') { parts.push(V.constant('%')); continue; }
    const idx = m[1] ? Number(m[1]) - 1 : next++;
    const arg = argVals[idx] || V.CLEAN;
    if (m[2] === 's') parts.push(arg.t ? V.step(arg, line, `${name} %s`) : arg);
    else parts.push(NUM);
  }
  parts.push(V.constant(fmt.slice(last)));
  return V.concat(parts);
}

function strReplaceEffect(search, replace, subject, line) {
  const searches = arrStrings(search);
  if (!searches) return propagate(subject, line, 'str_replace');
  const singles = searches.filter((s) => s.length === 1);
  if (singles.length === 0) return propagate(subject, line, 'str_replace');
  const removed = singles.join('');
  const enc = {};
  if (['*', '(', ')', '\\'].every((c) => removed.includes(c))) enc.ldap = true;
  const replaces = arrStrings(replace) || [];
  const reintroduced = replaces.join('');
  const effectiveRemoved = [...removed].filter((c) => !reintroduced.includes(c) || enc.ldap).join('');
  return V.sanitize(subject, { removeChars: effectiveRemoved, enc }, line, 'characters replaced');
}

/* ----------------------------------------------------------- main hook */

function call(callee, args, e, ctx) {
  const line = e.line;
  const name = callee.startsWith('fn:') ? callee.slice(3) : null;
  const a0 = args[0];

  // sinks attached to otherwise unknown calls
  if (SINKS[callee]) {
    let value = V.CLEAN;
    if (callee === 'fn:exec' || callee === 'fn:system' || callee === 'fn:shell_exec' || callee === 'fn:passthru' || callee === '@shell') {
      value = secondOrder(ctx, line, `output of ${callee.replace(/^\w+:|^@/, '')}`);
    } else if (callee === 'fn:popen') {
      value = V.CLEAN;
    }
    const result = { value, sinks: SINKS[callee].slice(), byRef: [] };
    if (callee === 'fn:exec' && ctx.opts.secondOrder) result.byRef.push([1, arrayOf(V.source('src2', 'output of exec()', line, 1), line)]);
    if (callee === 'fn:print_r' && args[1] && (args[1].str === undefined || args[1].str !== '')) {
      const ret = e.args[1] && e.args[1].k === 'lit' && e.args[1].value === true;
      if (ret) { result.sinks = []; result.value = propagate(a0, line, 'print_r'); }
    }
    if (callee === '@exit' && a0 && a0.num) result.sinks = [];
    if (callee === 'fn:unserialize') {
      result.value = propagate(a0, line, 'unserialize');
      if (args[1] && args[1].arr && args[1].arr.has('allowed_classes')) result.sinks = [S('PHP-DESER-001', 0, 'any', { confPenalty: 2 })];
    }
    if (callee === 'fn:curl_init' && (!a0 || !a0.t)) result.sinks = [];
    if (callee === 'fn:extract' && args[1] && /EXTR_SKIP|EXTR_PREFIX/.test(constName(args[1]))) result.sinks = [];
    if (callee === 'fn:assert' && a0 && !a0.t) result.sinks = [];
    return result;
  }

  if (PATH_OR_URL.has(callee)) {
    let value = V.CLEAN;
    if (callee === 'fn:file_get_contents' && a0 && /^php:\/\/input$/i.test(str(a0) || '')) value = V.source('src', 'php://input', line, 0);
    else if (callee === 'fn:file_get_contents' || callee === 'fn:file') value = secondOrder(ctx, line, `contents read by ${name}()`);
    return { value, sinks: a0 && a0.t ? pathOrUrlSinks(a0) : [] };
  }

  if (callee === 'fn:curl_setopt') {
    const opt = constName(args[1]);
    return { value: V.CLEAN, sinks: opt === 'CURLOPT_URL' ? [S('PHP-SSRF-001', 2, 'urlControl')] : [] };
  }

  if (callee === 'fn:header') {
    const first = V.segmentsOf(a0 || V.CLEAN);
    const prefix = first.length && first[0].text !== undefined ? first[0].text : '';
    if (/location\s*:/i.test(prefix)) return { value: V.CLEAN, sinks: [S('PHP-REDIR-001', 0, 'urlControl', { prefixRe: /^[\s\S]*?location\s*:\s*/i })] };
    return { value: V.CLEAN, sinks: [S('PHP-HDR-001', 0, 'crlf', { confPenalty: 1 })] };
  }

  if (callee === 'fn:proc_open') {
    const cmd = a0 || V.CLEAN;
    return { value: V.CLEAN, sinks: cmd.arr ? [] : [S('PHP-CMDI-001', 0, 'shell')], byRef: ctx.opts.secondOrder ? [[2, arrayOf(V.source('src2', 'process output', line, 1), line)]] : [] };
  }

  if (callee === 'fn:preg_replace' || callee === 'fn:preg_filter') {
    const pattern = str(args[0]);
    const sinks = [];
    const parts = pattern !== undefined ? splitPattern(pattern) : null;
    if (parts && parts.flags.includes('e')) sinks.push(S('PHP-CODE-001', 1, 'code', { name: 'preg_replace /e' }));
    const subject = args[2];
    const effect = pattern !== undefined ? replaceEffect(pattern, str(args[1])) : null;
    const value = effect ? V.sanitize(subject, effect, line, 'preg_replace') : propagate(subject, line, 'preg_replace');
    return { value, sinks };
  }

  // superglobal-equivalent sources
  if (callee === 'fn:getallheaders' || callee === 'fn:apache_request_headers') return { value: V.source('src', `${name}()`, line, 0) };
  if (callee === 'fn:filter_input' || callee === 'fn:filter_input_array') {
    const type = constName(a0);
    const src = /INPUT_(GET|POST|COOKIE|REQUEST|SERVER)/.test(type) ? V.source('src', `filter_input(${type})`, line, 0) : V.CLEAN;
    return { value: callee === 'fn:filter_input' ? filterEffect(constName(args[2]) || 'FILTER_DEFAULT', src, line) : src };
  }

  if (name && SECOND_ORDER_FNS.includes(name)) return { value: name === 'file' ? arrayOf(secondOrder(ctx, line, 'file()'), line) : secondOrder(ctx, line, `${name}()`) };
  if (callee.startsWith('m:') && SECOND_ORDER_METHODS.includes(callee.slice(2))) return { value: secondOrder(ctx, line, `${callee.slice(2)}() result`) };

  // method sinks with receiver-dependent meaning
  if (callee === 'm:query' || callee === 'm:exec' || callee === 'm:prepare') return { value: V.CLEAN, sinks: methodSqlSinks(e, ctx) };
  if (callee === 'm:evaluate') return { value: V.CLEAN, sinks: [S('PHP-XPATH-001', 0, 'xpath', { confPenalty: 1 })] };
  if (callee === 'fn:pg_query') return { value: V.CLEAN, sinks: [sql(args.length >= 2 ? 1 : 0)] };

  if (!name) {
    if (callee === 'm:quote') return { value: V.sanitize(a0, { enc: { sql: true, sqlQuoted: true } }, line, 'PDO::quote') };
    if (callee === 'm:real_escape_string' || callee === 'm:escape_string' || callee === 'm:escapestring') return { value: V.sanitize(a0, { enc: { sql: true } }, line, 'SQL escaping') };
    if (/^m:encodefor(html|htmlattribute|xml|xmlattribute)$/.test(callee)) return { value: V.sanitize(a0, { enc: { html: true, htmlQuotes: true } }, line, 'ESAPI encoder') };
    if (/^m:encodefor(javascript|css|vbscript|url|base64)$/.test(callee)) return { value: V.sanitize(a0, { allowed: `${WORD}%\\.,-` }, line, 'ESAPI encoder') };
    if (callee === 'm:encodeforsql') return { value: V.sanitize(a0, { enc: { sql: true } }, line, 'ESAPI encoder') };
    if (callee === 'm:encodeforos') return { value: V.sanitize(a0, { enc: { shell: true } }, line, 'ESAPI encoder') };
    if (callee === 'm:encodeforldap' || callee === 'm:encodefordn') return { value: V.sanitize(a0, { enc: { ldap: true } }, line, 'ESAPI encoder') };
    if (callee === 'm:encodeforxpath') return { value: V.sanitize(a0, { enc: { html: true, htmlQuotes: true } }, line, 'ESAPI encoder') };
    return null;
  }

  if (NUMERIC_FNS.includes(name)) return { value: NUM };
  if (CLEAN_FNS.includes(name)) return { value: V.CLEAN };

  if (name === 'htmlspecialchars' || name === 'htmlentities') {
    const flags = args[1] ? constName(args[1]) : '';
    const quotes = !args[1] || /ENT_QUOTES/.test(flags) || flags === '';
    return { value: V.sanitize(a0, { enc: { html: true, htmlQuotes: quotes && !/ENT_COMPAT|ENT_NOQUOTES/.test(flags) } }, line, `${name}()`) };
  }
  if (name === 'strip_tags') return { value: V.sanitize(a0, { removeChars: '<>' }, line, 'strip_tags()') };
  if (Object.prototype.hasOwnProperty.call(SQL_ESCAPE_FNS, name)) {
    const idx = SQL_ESCAPE_FNS[name] === -1 ? args.length - 1 : SQL_ESCAPE_FNS[name];
    return { value: V.sanitize(args[idx], { enc: { sql: true } }, line, `${name}()`) };
  }
  if (name === 'pg_escape_literal' || name === 'pg_escape_identifier') return { value: V.sanitize(args[args.length - 1], { enc: { sql: true, sqlQuoted: true } }, line, `${name}()`) };
  if (name === 'escapeshellarg') return { value: V.sanitize(a0, { enc: { shell: true } }, line, 'escapeshellarg()') };
  if (name === 'escapeshellcmd') return { value: V.sanitize(a0, { enc: { shellCmd: true } }, line, 'escapeshellcmd()') };
  if (name === 'ldap_escape') return { value: V.sanitize(a0, { enc: { ldap: true } }, line, 'ldap_escape()') };
  if (name === 'urlencode' || name === 'rawurlencode') return { value: V.sanitize(a0, { allowed: URLENC, enc: { url: true } }, line, `${name}()`) };
  if (name === 'http_build_query') return { value: V.sanitize(elementOf(a0), { allowed: `${URLENC}=&`, enc: { url: true } }, line, 'http_build_query()') };
  if (name === 'base64_encode') return { value: V.sanitize(a0, { allowed: B64 }, line, 'base64_encode()') };
  if (name === 'basename') return { value: V.sanitize(a0, { removeChars: '/\\' }, line, 'basename()') };
  if (name === 'filter_var') return { value: filterEffect(constName(args[1]) || 'FILTER_DEFAULT', a0, line) };
  if (name === 'settype') {
    const t = (str(args[1]) || '').toLowerCase();
    return { value: NUM, byRef: ['int', 'integer', 'float', 'double', 'bool', 'boolean'].includes(t) ? [[0, NUM]] : [] };
  }
  if (name === 'str_replace' || name === 'str_ireplace') return { value: strReplaceEffect(args[0], args[1], args[2], line) };
  if (name === 'sprintf' || name === 'vsprintf') {
    const vals = name === 'vsprintf' ? (args[1] && args[1].arr ? [...args[1].arr.values()] : [elementOf(args[1])]) : args.slice(1);
    return { value: format(a0, vals, line, name) };
  }
  if (name === 'printf' || name === 'vprintf') {
    const vals = name === 'vprintf' ? (args[1] && args[1].arr ? [...args[1].arr.values()] : [elementOf(args[1])]) : args.slice(1);
    const out = format(a0, vals, line, name);
    return { value: NUM, sinks: [S('PHP-XSS-001', 0, 'html', { name, value: out })] };
  }
  if (name === 'implode' || name === 'join') {
    const pieces = args.length > 1 ? args[1] : a0;
    const glue = args.length > 1 ? a0 : V.constant('');
    const el = elementOf(pieces && pieces.arr ? pieces : (pieces || V.CLEAN));
    return { value: el.t ? V.step(V.join(el, glue && glue.t ? glue : null), line, name) : V.CLEAN };
  }
  if (name === 'explode' || name === 'str_split' || name === 'preg_split' || name === 'mb_str_split') return { value: arrayOf(name === 'explode' ? args[1] : a0, line, name) };
  if (name === 'array_map') {
    // a named callback (e.g. 'intval', 'esc_html') is applied to every element
    const cb = str(a0);
    let element = elementOf(args[1]);
    if (cb && element.t && ctx.callCatalog) {
      const r = ctx.callCatalog(`fn:${cb.toLowerCase().replace(/^\\/, '')}`, [element], line);
      if (r && r.value && !(r.sinks && r.sinks.length)) element = r.value;
    }
    return { value: element.t ? arrayOf(element, line, 'array_map') : { t: false, arr: new Map([['*', element]]) } };
  }
  if (ARRAY_FNS.includes(name)) {
    const joined = V.joinAll(args.map((x) => (x && x.arr ? V.joinAll([...x.arr.values()]) : x || V.CLEAN)));
    return { value: joined.t ? { ...propagate(joined, line, name), arr: new Map([['*', propagate(joined)]]) } : { t: false, arr: a0 && a0.arr ? new Map(a0.arr) : new Map() } };
  }
  if (PROPAGATE_FNS.includes(name)) return { value: name === 'current' || name === 'reset' || name === 'end' || name === 'array_pop' || name === 'array_shift' || name === 'next' || name === 'prev' ? elementOf(a0) : propagate(a0, line, `${name}()`) };
  if (RESET_FNS.includes(name)) return { value: reset(a0, line, `${name}()`) };
  return null;
}

/* ---------------------------------------------------------------- guards */

function guard(test, evalExpr) {
  const callee = test.callee || '';
  const args = test.args || [];
  const name = callee.startsWith('fn:') ? callee.slice(3) : '';
  if (!name) return null;
  if (name === 'in_array' && args[0] && args[0].k === 'path') {
    const hay = evalExpr(args[1]);
    const constants = arrStrings(hay);
    if (constants) return { target: args[0], effect: { clean: true }, note: 'checked against an allow-list' };
    return { target: args[0], effect: { guarded: true }, note: 'checked with in_array()' };
  }
  if ((name === 'array_key_exists' || name === 'isset') && args[0] && args[0].k === 'path') return { target: args[0], effect: { guarded: true }, note: `${name}() check` };
  if (name === 'preg_match' && args[1] && args[1].k === 'path') {
    const pattern = str(evalExpr(args[0]));
    const chars = pattern !== undefined ? allowlist(pattern) : null;
    if (chars !== null) return { target: args[1], effect: { allowed: chars }, note: 'validated by an allow-list pattern' };
    return null;
  }
  if (['ctype_digit', 'is_numeric', 'is_int', 'is_integer', 'is_float', 'ctype_xdigit'].includes(name) && args[0] && args[0].k === 'path') {
    return { target: args[0], effect: { clean: true, num: true }, note: `${name}() check` };
  }
  if (name === 'ctype_alpha' && args[0] && args[0].k === 'path') return { target: args[0], effect: { allowed: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' }, note: 'ctype_alpha() check' };
  if (name === 'ctype_alnum' && args[0] && args[0].k === 'path') return { target: args[0], effect: { allowed: WORD.replace('_', '') }, note: 'ctype_alnum() check' };
  if (name === 'filter_var' && args[0] && args[0].k === 'path') {
    const f = constName(evalExpr(args[1]));
    if (/FILTER_VALIDATE_(INT|FLOAT|BOOL)/.test(f)) return { target: args[0], effect: { clean: true, num: true }, note: `${f} check` };
  }
  return null;
}

/* ---------------------------------------------------------- superglobals */

const SERVER_TAINTED = /^(HTTP_\w+|REQUEST_URI|QUERY_STRING|PHP_SELF|PATH_INFO|PATH_TRANSLATED|ORIG_PATH_INFO|REDIRECT_URL|REDIRECT_QUERY_STRING|argv|PHP_AUTH_USER|PHP_AUTH_PW|CONTENT_TYPE)$/;

function superglobal(base, segs, line, opts) {
  const key = segs.length && segs[0].key !== undefined && segs[0].key !== '*' ? segs[0].key : null;
  const label = key !== null ? `$${base}['${key}']` : `$${base}`;
  switch (base) {
    case '_GET': case '_POST': case '_REQUEST': case '_COOKIE': case 'HTTP_RAW_POST_DATA':
      return V.source('src', label, line, 0);
    case '_FILES': {
      const field = segs.length > 1 && segs[1].key !== undefined ? segs[1].key : null;
      if (field && !['name', 'type', 'full_path'].includes(field)) return V.CLEAN;
      return V.source('src', `${label}${field ? `['${field}']` : ''}`, line, field ? 0 : 1);
    }
    case '_SERVER':
      if (key === null) return V.source('src', label, line, 1);
      return SERVER_TAINTED.test(key) ? V.source('src', label, line, 0) : V.CLEAN;
    case '_SESSION':
      return opts && opts.secondOrder ? V.source('src2', label, line, 1) : V.CLEAN;
    case '_ENV':
      return V.CLEAN;
    default:
      return undefined;
  }
}

function constant(name) {
  if (name === 'PHP_EOL') return V.constant('\n');
  if (name === 'DIRECTORY_SEPARATOR') return V.constant('/');
  if (/^(true|false|null)$/i.test(name)) return V.CLEAN;
  return V.constant(name);
}

const catalog = {
  call,
  guard,
  superglobal,
  constant,
  isKnownMethod: (name) => KNOWN_METHODS.has(name),
};

/** Lets framework packs add sources/sinks/sanitizers (called before analysis). */
function extend(pack) {
  const base = { ...catalog };
  return {
    ...base,
    call(callee, args, e, ctx) {
      if (pack.call) {
        const r = pack.call(callee, args, e, ctx, { V, S, propagate });
        if (r) return r;
      }
      return base.call(callee, args, e, ctx);
    },
    superglobal(name, segs, line, opts) {
      if (pack.superglobal) {
        const r = pack.superglobal(name, segs, line, opts, { V });
        if (r !== undefined) return r;
      }
      return base.superglobal(name, segs, line, opts);
    },
  };
}

module.exports = { catalog, extend, SINKS, format, filterEffect };
