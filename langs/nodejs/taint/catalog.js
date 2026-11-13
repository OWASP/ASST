'use strict';
/*
 * Node.js knowledge base for the taint interpreter: Express-style request sources,
 * sinks in Node core modules and popular packages, sanitizers, propagators and guards.
 *
 * Callee keys come from langs/nodejs/taint/lower.js:
 *   fn:child_process.exec   module members (resolved from require/import)
 *   fn:eval                 global functions
 *   m:query                 methods (receiver value in ctx.recv)
 *   new:pg.pool             constructors (lower case)
 *   @require @import @jsx @tag:<name> @seq @invoke @dyncall   language constructs
 */
const V = require('../../../core/taint/value');
const { allowlist, replaceEffect, WORD, DIGITS } = require('../../php/taint/regex');

const NUM = Object.freeze({ t: false, num: true });
const LETTERS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const URI_COMPONENT = `${WORD}-.!~*'()%`;
const URI = `${URI_COMPONENT};,/?:@&=+$#`;
const HEX = `${DIGITS}abcdefABCDEF`;

const S = (rule, arg, check, extra = {}) => ({ rule, arg, check, ...extra });

/* ------------------------------------------------------------------- values */

function tag(cls) {
  return { t: false, obj: { cls, fields: new Map() } };
}

function clsOf(v) {
  return v && v.obj && v.obj.cls ? v.obj.cls : null;
}

function propagate(v, line, note) {
  if (!v || !v.t) return V.CLEAN;
  const out = { ...v };
  delete out.segs;
  delete out.str;
  delete out.arr;
  delete out.obj;
  return note ? V.step(out, line, note) : out;
}

/** A tainted value that is certainly a string (template, concatenation, String(), toString()). */
function asString(v, line, note) {
  if (!v || !v.t) return v && v.str !== undefined ? v : V.CLEAN;
  const out = propagate(v, line, note);
  out.strOnly = true;
  return out;
}

/** Decoding (decodeURIComponent, JSON.parse, ...) removes earlier encodings. */
function decoded(v, line, note) {
  if (!v || !v.t) return V.CLEAN;
  return V.step({ t: true, c: v.c, g: v.g, allowed: null, enc: {}, trace: v.trace, origins: v.origins }, line, note);
}

function elementOf(v) {
  if (!v) return V.CLEAN;
  if (v.arr && v.arr.size) return V.joinAll([...v.arr.values()]);
  return v.t ? propagate(v) : V.CLEAN;
}

function arrayOf(v) {
  const arr = new Map([['*', v && v.t ? propagate(v) : V.CLEAN]]);
  return v && v.t ? { ...propagate(v), arr } : { t: false, arr };
}

function constStrings(v) {
  if (!v) return null;
  if (v.str !== undefined) return [v.str];
  if (v.strs) return v.strs;
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

const str = (v) => (v && v.str !== undefined ? v.str : undefined);
const isClosure = (v) => Boolean(v && v.fn);

/** The HTTP request object of a handler: user-controlled parts are sources. */
function requestValue(line, opts = {}) {
  const src = (part, conf = 0) => V.source('src', `req.${part}`, line, conf);
  const arr = new Map([
    ['query', src('query')],
    ['body', src('body')],
    ['params', src('params')],
    ['cookies', src('cookies')],
    ['signedCookies', src('signedCookies', 1)],
    ['headers', src('headers')],
    ['url', src('url')],
    ['originalUrl', src('originalUrl')],
    ['path', src('path')],
    ['hostname', src('hostname', 1)],
    ['host', src('host', 1)],
    ['subdomains', src('subdomains', 1)],
    ['ip', src('ip', 2)],
    ['ips', src('ips', 2)],
    ['files', src('files', 1)],
    ['file', src('file', 1)],
    ['rawBody', src('rawBody')],
  ]);
  if (opts.secondOrder) arr.set('session', V.source('src2', 'req.session', line, 1));
  return { t: false, arr, obj: { cls: 'http:Request', fields: new Map() } };
}

function responseValue(kind) {
  return tag(kind === 'reply' ? 'fastify:Reply' : 'http:Response');
}

/** Arguments for a request handler, by parameter name, falling back to (req, res, next) order. */
function handlerArgs(fn, line, opts) {
  const out = [];
  let recognized = false;
  fn.params.forEach((p, i) => {
    const n = String(p.name).toLowerCase();
    if (n === 'req' || n === 'request') { out[i] = requestValue(line, opts); recognized = true; } else if (n === 'res' || n === 'response') { out[i] = responseValue('express'); recognized = true; } else if (n === 'reply') { out[i] = responseValue('reply'); recognized = true; } else out[i] = V.CLEAN;
  });
  if (!recognized) {
    const off = fn.params.length >= 4 ? 1 : 0; // error handlers: (err, req, res, next)
    if (fn.params.length > off) out[off] = requestValue(line, opts);
    if (fn.params.length > off + 1) out[off + 1] = responseValue('express');
  }
  return out;
}

/** Entry points for functions nobody calls: request handlers recognized by their parameter names. */
function entryArgs(fn, opts = {}) {
  if (!fn.params.some((p) => /^(req|request)$/i.test(p.name))) return null;
  return handlerArgs(fn, fn.line, opts);
}

/** Runs callback arguments (closures) with the given parameter values. */
function runCallbacks(args, ctx, line, params = []) {
  let ret = V.CLEAN;
  for (const a of args) {
    if (isClosure(a)) ret = V.join(ret, ctx.invokeClosure(a, params, line));
    else if (a && a.arr) for (const [, item] of a.arr) if (isClosure(item)) ret = V.join(ret, ctx.invokeClosure(item, params, line));
  }
  return ret;
}

/* ---------------------------------------------------------------- sanitizers */

const HTML_SAFE = { enc: { html: true, htmlQuotes: true } };

const SANITIZERS = {
  'escape-html': HTML_SAFE,
  'html-escaper.escape': HTML_SAFE,
  'he.encode': HTML_SAFE,
  'he.escape': HTML_SAFE,
  'lodash.escape': HTML_SAFE,
  'underscore.escape': HTML_SAFE,
  'validator.escape': HTML_SAFE,
  'xss': HTML_SAFE,
  'xss.filterXSS': HTML_SAFE,
  'dompurify.sanitize': HTML_SAFE,
  'isomorphic-dompurify.sanitize': HTML_SAFE,
  'sanitize-html': HTML_SAFE,
  'entities.encode': HTML_SAFE,
  'entities.encodeHTML': HTML_SAFE,
  'mysql.escape': { enc: { sqlQuoted: true } },
  'mysql2.escape': { enc: { sqlQuoted: true } },
  'mysql.escapeId': { enc: { sqlQuoted: true } },
  'mysql2.escapeId': { enc: { sqlQuoted: true } },
  'sqlstring.escape': { enc: { sqlQuoted: true } },
  'sqlstring.escapeId': { enc: { sqlQuoted: true } },
  'pg-format.literal': { enc: { sqlQuoted: true } },
  'pg-format.ident': { enc: { sqlQuoted: true } },
  'shell-quote.quote': { enc: { shell: true } },
  'shell-escape': { enc: { shell: true } },
  'path.basename': { removeChars: '/\\' },
  'sanitize-filename': { removeChars: '/\\:' },
};

const CLEANERS = new Set(['escape-string-regexp', 'lodash.escapeRegExp', 'lodash.escaperegexp', 'validator.toInt', 'validator.toFloat', 'validator.toBoolean', 'uuid.v4', 'crypto.randomUUID', 'crypto.randomBytes']);
const PROPAGATORS = new Set(['path.normalize', 'path.dirname', 'path.extname', 'path.relative', 'url.parse', 'url.format', 'querystring.parse', 'querystring.stringify', 'qs.parse', 'qs.stringify', 'util.format', 'util.inspect', 'lodash.get', 'lodash.trim', 'lodash.toString', 'lodash.template', 'buffer.Buffer.from', 'lodash.pick', 'lodash.omit', 'lodash.clone', 'lodash.cloneDeep', 'iconv-lite.decode']);

/* -------------------------------------------------------------------- sinks */

const SHELL_EXEC = new Set(['child_process.exec', 'child_process.execSync', 'shelljs.exec', 'execa.execaCommand', 'execa.execaCommandSync', 'execa.command', 'execa.commandSync']);
const PROCESS_SPAWN = new Set(['child_process.spawn', 'child_process.spawnSync', 'child_process.execFile', 'child_process.execFileSync', 'cross-spawn', 'cross-spawn.sync', 'execa', 'execa.execa', 'execa.sync', 'execa.execaSync']);
const CODE_EVAL = new Set(['vm.runInNewContext', 'vm.runInThisContext', 'vm.runInContext', 'vm.compileFunction', 'vm2.VM.run', 'safe-eval', 'notevil', 'static-eval']);
const FS_PATH_0 = new Set(['readFile', 'readFileSync', 'createReadStream', 'createWriteStream', 'writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'unlink', 'unlinkSync', 'rm', 'rmSync', 'rmdir', 'rmdirSync', 'readdir', 'readdirSync', 'mkdir', 'mkdirSync', 'stat', 'statSync', 'lstat', 'lstatSync', 'access', 'accessSync', 'open', 'openSync', 'exists', 'existsSync', 'truncate', 'truncateSync', 'chmod', 'chmodSync', 'opendir', 'opendirSync', 'readlink', 'readlinkSync', 'realpath', 'realpathSync', 'watch', 'outputFile', 'outputFileSync', 'readJson', 'readJsonSync', 'remove', 'removeSync', 'pathExists']);
const FS_PATH_01 = new Set(['copyFile', 'copyFileSync', 'rename', 'renameSync', 'link', 'linkSync', 'symlink', 'symlinkSync', 'cp', 'cpSync', 'copy', 'copySync', 'move', 'moveSync']);
const HTTP_CLIENTS = new Set([
  'axios', 'axios.get', 'axios.post', 'axios.put', 'axios.patch', 'axios.delete', 'axios.head', 'axios.options', 'axios.request',
  'got', 'got.get', 'got.post', 'got.put', 'got.patch', 'got.delete', 'got.head', 'got.stream',
  'node-fetch', 'undici.request', 'undici.fetch', 'undici.stream',
  'request', 'request.get', 'request.post', 'request-promise', 'request-promise-native',
  'needle', 'needle.get', 'needle.post', 'needle.request',
  'superagent', 'superagent.get', 'superagent.post', 'superagent.put', 'superagent.delete',
  'http.get', 'http.request', 'https.get', 'https.request', 'phin', 'bent', 'ky', 'ky.get', 'ky.post',
]);
const PROTO_MERGE = new Set(['lodash.merge', 'lodash.mergeWith', 'lodash.defaultsDeep', 'lodash.set', 'lodash.setWith', 'lodash.zipObjectDeep', 'lodash.merge', 'lodash.mergewith', 'lodash.defaultsdeep', 'lodash.set', 'deepmerge', 'merge', 'merge.recursive', 'merge-deep', 'deep-extend', 'defaults-deep', 'mixin-deep', 'set-value', 'dot-prop.set', 'object-path.set', 'jquery.extend', 'extend']);
const DESERIALIZE = new Set(['node-serialize.unserialize', 'serialize-to-js.deserialize', 'funcster.deepDeserialize', 'cryo.parse']);
const SQL_CONNECTORS = new Set(['mysql.createConnection', 'mysql.createPool', 'mysql.createPoolCluster', 'mysql2.createConnection', 'mysql2.createPool', 'mysql2.createPoolCluster', 'mariadb.createConnection', 'mariadb.createPool', 'knex', 'better-sqlite3', 'sqlite.open', 'postgres', 'oracledb.getConnection', 'oracledb.createPool', 'mssql.connect']);
const SQL_CLASSES = new Set(['pg.pool', 'pg.client', 'sequelize', 'sequelize.sequelize', 'sqlite3.database', 'sqlite3.verbose.database', 'better-sqlite3', 'mssql.connectionpool', 'mssql.request', 'typeorm.datasource']);

const ROUTE_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'del', 'all', 'use', 'options', 'head', 'route', 'any', 'register']);
const RESPONSE_CHAIN = new Set(['status', 'type', 'contentType', 'set', 'header', 'append', 'vary', 'links', 'attachment', 'cookie', 'clearCookie', 'code', 'headers']);
const SQL_METHODS_RAW = new Set(['raw', 'whereRaw', 'orWhereRaw', 'andWhereRaw', 'havingRaw', 'orHavingRaw', 'orderByRaw', 'groupByRaw', 'joinRaw', 'fromRaw', 'selectRaw', '$queryRawUnsafe', '$executeRawUnsafe', 'unsafe']);
const SQL_METHODS_QB = new Set(['where', 'andWhere', 'orWhere', 'having', 'andHaving', 'orHaving', 'orderBy', 'addOrderBy', 'groupBy', 'addGroupBy']);
const NOSQL_METHODS = new Set(['find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndRemove', 'findOneAndReplace', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'replaceOne', 'countDocuments', 'count', 'exists', 'remove', 'update']);
const STRING_PROPAGATE = new Set(['trim', 'trimStart', 'trimEnd', 'trimLeft', 'trimRight', 'toLowerCase', 'toUpperCase', 'toLocaleLowerCase', 'toLocaleUpperCase', 'slice', 'substring', 'substr', 'padStart', 'padEnd', 'normalize', 'repeat', 'at', 'charAt', 'toString', 'valueOf', 'toJSON', 'trimEnd', 'link', 'anchor']);
const ARRAY_PROPAGATE = new Set(['filter', 'slice', 'sort', 'reverse', 'flat', 'concat', 'splice', 'toSorted', 'toReversed', 'values', 'entries', 'keys', 'find', 'findLast', 'pop', 'shift']);
const BOOLEAN_METHODS = new Set(['includes', 'startsWith', 'endsWith', 'indexOf', 'lastIndexOf', 'test', 'has', 'some', 'every', 'localeCompare', 'isArray', 'hasOwnProperty', 'search', 'codePointAt', 'charCodeAt']);
const GLOBAL_OBJECTS = new Set(['JSON', 'Math', 'Object', 'Array', 'Number', 'String', 'Promise', 'Buffer', 'console', 'process', 'Reflect', 'Date', 'Symbol', 'Boolean', 'Intl', 'crypto', 'globalThis', 'window', 'document']);

/** Values that may be objects (from JSON bodies or qs-parsed query strings), not just strings. */
function objectCapable(v) {
  return Boolean(v && v.t && !v.segs && !v.strOnly && !v.num && !v.nosqlSafe && !(v.enc && Object.keys(v.enc).length) && (v.allowed === null || v.allowed === undefined));
}

/** Tainted parts of a MongoDB filter that can carry query operators ({"$ne": ""}) or JavaScript ($where). */
function nosqlUnsafe(filter) {
  if (!filter) return [];
  if (!filter.arr) return objectCapable(filter) ? [filter] : [];
  const out = [];
  for (const [key, v] of filter.arr) {
    if (!v || !v.t) continue;
    if (key === '$where' || key === '$function' || key === '$accumulator') out.push(v);
    else if (v.arr) out.push(...nosqlUnsafe(v));
    else if (objectCapable(v)) out.push(v);
  }
  return out;
}

function sqlArg(v) {
  if (!v) return null;
  if (v.arr && (v.arr.has('sql') || v.arr.has('text'))) return v.arr.get('sql') || v.arr.get('text');
  if (v.arr) return null; // option objects without SQL text (GraphQL clients and the like)
  return v;
}

/* --------------------------------------------------------------- call model */

function requireValue(spec) {
  const s = str(spec);
  if (s === undefined) return V.CLEAN;
  return tag(`module:${s.replace(/^node:/, '')}`);
}

function moduleCall(name, args, e, ctx) {
  const line = e.line;
  const a0 = args[0];
  const recvLess = name.replace(/\.promises\./, '.').replace(/^fs-extra\./, 'fs.').replace(/^graceful-fs\./, 'fs.');
  const [mod] = recvLess.split('.');
  const member = recvLess.slice(mod.length + 1);

  if (SANITIZERS[recvLess]) {
    runCallbacks(args.slice(1), ctx, line);
    return { value: a0 && a0.t ? V.sanitize(a0, SANITIZERS[recvLess], line, `${recvLess}()`) : (a0 && a0.str !== undefined ? a0 : V.CLEAN) };
  }
  if (CLEANERS.has(recvLess)) return { value: NUM };
  if (recvLess === 'express') return { value: tag('express:App') };
  if (recvLess === 'express.Router' || recvLess === 'express.router') return { value: tag('express:Router') };
  if (/^(fastify|koa|restify\.createServer|hapi\.server|@hapi\/hapi\.server)$/.test(recvLess)) return { value: tag('express:App') };
  if (recvLess === 'http.createServer' || recvLess === 'https.createServer' || recvLess === 'http2.createServer' || recvLess === 'http2.createSecureServer') {
    for (const a of args) if (isClosure(a)) ctx.invokeClosure(a, handlerArgs(a.fn, line, ctx.opts), line);
    return { value: tag('express:App') };
  }
  if (SQL_CONNECTORS.has(recvLess)) return { value: tag('sql:Connection') };
  if (recvLess === 'mongoose.model' || recvLess === 'mongoose.connection.model') return { value: tag('mongo:Model') };
  if (recvLess === 'mongo-sanitize' || recvLess === 'express-mongo-sanitize.sanitize') return { value: a0 && a0.t ? { ...propagate(a0, line, 'mongo-sanitize()'), nosqlSafe: true } : V.CLEAN };

  if (SHELL_EXEC.has(recvLess)) {
    runCallbacks(args.slice(1), ctx, line);
    return { value: V.CLEAN, sinks: [S('NODE-CMDI-001', 0, 'shell', { name: `${recvLess}()` })] };
  }
  if (PROCESS_SPAWN.has(recvLess)) {
    const opts = args.find((a, i) => i > 0 && a && a.arr && !isClosure(a) && (a.arr.has('shell') || a.arr.has('cwd') || a.arr.has('env') || a.arr.has('stdio')));
    const shell = opts && opts.arr.has('shell') && opts.arr.get('shell') && (opts.arr.get('shell').str === undefined || opts.arr.get('shell').str !== 'false');
    runCallbacks(args, ctx, line);
    if (shell) return { value: V.CLEAN, sinks: [S('NODE-CMDI-001', 'all', 'shell', { name: `${recvLess}() with shell: true` })] };
    // "--" before the user values ends option parsing, so they cannot become options
    const argv = args[1];
    const separated = argv && argv.arr && [...argv.arr.values()].some((v) => v.str === '--');
    const sinks = [S('NODE-CMDI-001', 0, 'any', { name: `${recvLess}()` })];
    if (!separated) sinks.push(S('NODE-CMDI-002', 1, 'any', { name: `${recvLess}() arguments`, confPenalty: 1 }));
    return { value: V.CLEAN, sinks };
  }
  if (recvLess === 'child_process.fork') return { value: V.CLEAN, sinks: [S('NODE-CODE-002', 0, 'any', { name: 'child_process.fork()' })] };
  if (CODE_EVAL.has(recvLess)) return { value: V.CLEAN, sinks: [S('NODE-CODE-001', 0, 'any', { name: `${recvLess}()` })] };

  if (mod === 'fs') {
    const fsName = member.replace(/^promises\./, '');
    runCallbacks(args, ctx, line);
    if (FS_PATH_01.has(fsName)) return { value: V.CLEAN, sinks: [S('NODE-PATH-001', 0, 'path', { name: `fs.${fsName}()` }), S('NODE-PATH-001', 1, 'path', { name: `fs.${fsName}()` })] };
    if (FS_PATH_0.has(fsName)) return { value: V.CLEAN, sinks: [S('NODE-PATH-001', 0, 'path', { name: `fs.${fsName}()` })] };
    return { value: V.CLEAN };
  }
  if (recvLess === 'path.join' || recvLess === 'path.resolve' || recvLess === 'path.posix.join' || recvLess === 'path.win32.join') {
    const parts = [];
    args.forEach((a, i) => { if (i) parts.push(V.constant('/')); parts.push(a || V.CLEAN); });
    return { value: V.concat(parts) };
  }
  if (PROPAGATORS.has(recvLess)) return { value: V.joinAll(args.map((a) => (a && a.t ? propagate(a, line, `${recvLess}()`) : V.CLEAN))) };

  if (HTTP_CLIENTS.has(recvLess)) {
    const target = a0 && a0.arr ? (a0.arr.get('url') || a0.arr.get('uri') || a0.arr.get('baseURL') || a0.arr.get('hostname') || a0.arr.get('host')) : a0;
    runCallbacks(args, ctx, line);
    return { value: V.CLEAN, sinks: target ? [S('NODE-SSRF-001', 0, 'urlControl', { value: target, name: `${recvLess}()` })] : [] };
  }
  if (PROTO_MERGE.has(recvLess) || PROTO_MERGE.has(recvLess.toLowerCase())) {
    const setLike = /\.set(With)?$|set-value|object-path|dot-prop/.test(recvLess);
    if (setLike) return { value: args[0] || V.CLEAN, sinks: [S('NODE-PROTO-001', 1, 'any', { name: `${recvLess}()`, confPenalty: 1 })] };
    const sources = args.slice(1).filter((a) => a && a.t && !a.strOnly && !a.segs);
    return { value: V.joinAll(args), sinks: sources.map((v) => S('NODE-PROTO-001', null, 'any', { value: v, name: `${recvLess}()`, confPenalty: 1 })), byRef: [[0, V.joinAll(args)]] };
  }
  if (DESERIALIZE.has(recvLess)) return { value: propagate(a0, line, `${recvLess}()`), sinks: [S('NODE-DESER-001', 0, 'any', { name: `${recvLess}()` })] };
  if (recvLess === 'util.promisify' || recvLess === 'bluebird.promisify') return { value: a0 || V.CLEAN };
  if (recvLess === 'validator.blacklist' || recvLess === 'validator.whitelist' || recvLess === 'validator.stripLow' || recvLess === 'validator.trim' || recvLess === 'validator.normalizeEmail') {
    return { value: propagate(a0, line, `${recvLess}()`) };
  }
  if (mod === 'validator' && /^is/.test(member)) return { value: V.CLEAN };
  if (recvLess === 'jsonwebtoken.verify' || recvLess === 'jsonwebtoken.decode') {
    runCallbacks(args, ctx, line);
    return { value: a0 && a0.t ? V.weaken(propagate(a0, line, 'decoded JWT'), 1) : V.CLEAN };
  }
  // other module functions: run callbacks; the result probably derives from the arguments
  runCallbacks(args, ctx, line);
  const joined = V.joinAll(args.filter((a) => a && a.t));
  return { value: joined.t ? V.weaken(propagate(joined, line, `${recvLess}()`)) : V.CLEAN };
}

function globalCall(name, args, e, ctx) {
  const line = e.line;
  const a0 = args[0];
  switch (name) {
    case 'eval':
      return { value: V.CLEAN, sinks: [S('NODE-CODE-001', 0, 'any', { name: 'eval()' })] };
    case 'Function':
      return { value: V.CLEAN, sinks: [S('NODE-CODE-001', 'all', 'any', { name: 'Function()' })] };
    case 'setTimeout': case 'setInterval': case 'setImmediate':
      if (isClosure(a0)) {
        ctx.invokeClosure(a0, args.slice(2), line);
        return { value: NUM };
      }
      return { value: NUM, sinks: [S('NODE-CODE-001', 0, 'any', { name: `${name}() with a string` })] };
    case 'RegExp':
      return { value: V.CLEAN, sinks: a0 && a0.regexEscaped ? [] : [S('NODE-REDOS-001', 0, 'any', { name: 'RegExp()' })] };
    case 'parseInt': case 'parseFloat': case 'Number': case 'isNaN': case 'isFinite': case 'Boolean': case 'BigInt':
      return { value: NUM };
    case 'String':
      return { value: asString(a0, line, 'String()') };
    case 'encodeURIComponent': case 'escape':
      return { value: V.sanitize(a0, { allowed: URI_COMPONENT, enc: { url: true } }, line, `${name}()`) };
    case 'encodeURI':
      return { value: V.sanitize(a0, { allowed: URI, enc: { url: true } }, line, 'encodeURI()') };
    case 'decodeURIComponent': case 'decodeURI': case 'unescape': case 'atob':
      return { value: decoded(a0, line, `${name}()`) };
    case 'btoa':
      return { value: V.sanitize(a0, { allowed: `${WORD.replace('_', '')}+/=` }, line, 'btoa()') };
    case 'fetch':
      return { value: V.CLEAN, sinks: [S('NODE-SSRF-001', 0, 'urlControl', { name: 'fetch()' })] };
    case 'structuredClone':
      return { value: a0 || V.CLEAN };
    case 'require':
      return null;
    default:
      return null;
  }
}

function globalObjectCall(obj, name, args, e, ctx) {
  const line = e.line;
  const a0 = args[0];
  const key = `${obj}.${name}`;
  switch (key) {
    case 'JSON.stringify': return { value: asString(a0, line, 'JSON.stringify()') };
    case 'JSON.parse': return { value: decoded(a0, line, 'JSON.parse()') };
    case 'Object.assign': return { value: V.joinAll(args), byRef: [[0, V.joinAll(args)]] };
    case 'Object.keys': case 'Object.values': case 'Object.entries': case 'Object.fromEntries': case 'Array.from': case 'Array.of': case 'Object.freeze':
      return { value: a0 && a0.t ? arrayOf(elementOf(a0)) : (a0 || V.CLEAN) };
    case 'Number.parseInt': case 'Number.parseFloat': case 'Number.isInteger': case 'Number.isFinite': case 'Number.isNaN': case 'Number.isSafeInteger': case 'Array.isArray':
      return { value: NUM };
    case 'String.raw': return { value: V.concat(args) };
    case 'Buffer.from': return { value: a0 && a0.t ? propagate(a0, line, 'Buffer.from()') : V.CLEAN };
    case 'Promise.resolve': return { value: a0 || V.CLEAN };
    case 'Promise.all': case 'Promise.allSettled': case 'Promise.race': case 'Promise.any': return { value: a0 || V.CLEAN };
    case 'process.exit': return { value: V.CLEAN };
    default:
      if (obj === 'Math' || obj === 'Date' || obj === 'crypto' || obj === 'Symbol') return { value: NUM };
      if (obj === 'console') return { value: V.CLEAN };
      return null;
  }
}

function responseCall(name, recv, args, e, ctx) {
  const reply = clsOf(recv) === 'fastify:Reply';
  const penalty = reply ? 2 : 0; // Fastify sends strings as text/plain unless a type is set
  const a0 = args[0];
  switch (name) {
    case 'send': case 'write': case 'end': case 'sendStatus': {
      if (name === 'sendStatus') return { value: recv };
      if (!a0 || (a0.arr && !a0.t) || a0.num || (a0.arr && a0.t && !a0.segs)) return { value: recv }; // objects are sent as JSON
      return { value: recv, sinks: [S('NODE-XSS-001', 0, 'html', { freshHtml: true, name: `res.${name}()`, confPenalty: penalty })] };
    }
    case 'redirect': {
      const idx = args.length > 1 ? 1 : 0;
      return { value: V.CLEAN, sinks: [S('NODE-REDIR-001', idx, 'urlControl', { name: 'res.redirect()' })] };
    }
    case 'location':
      return { value: recv, sinks: [S('NODE-REDIR-001', 0, 'urlControl', { name: 'res.location()' })] };
    case 'sendFile': case 'download': {
      const opts = args.find((a, i) => i > 0 && a && a.arr && a.arr.has('root'));
      if (opts) return { value: V.CLEAN };
      runCallbacks(args, ctx, e.line);
      return { value: V.CLEAN, sinks: [S('NODE-PATH-001', 0, 'path', { name: `res.${name}()` })] };
    }
    case 'set': case 'header': case 'setHeader': case 'append': {
      const hname = (str(a0) || '').toLowerCase();
      if (hname === 'location') return { value: recv, sinks: [S('NODE-REDIR-001', 1, 'urlControl', { name: 'Location header' })] };
      if (hname === 'access-control-allow-origin') return { value: recv, sinks: [S('NODE-CORS-001', 1, 'any', { name: 'Access-Control-Allow-Origin header' })] };
      return { value: recv };
    }
    case 'writeHead': {
      const headers = args.find((a, i) => i > 0 && a && a.arr);
      const loc = headers && (headers.arr.get('Location') || headers.arr.get('location'));
      return { value: recv, sinks: loc ? [S('NODE-REDIR-001', null, 'urlControl', { value: loc, name: 'Location header' })] : [] };
    }
    case 'render':
      runCallbacks(args, ctx, e.line);
      return { value: V.CLEAN };
    case 'json': case 'jsonp': case 'type': case 'contentType': case 'cookie': case 'clearCookie': case 'attachment': case 'status': case 'vary': case 'links': case 'code': case 'headers':
      return { value: recv };
    default:
      return RESPONSE_CHAIN.has(name) ? { value: recv } : null;
  }
}

function requestCall(name, recv, args, e, ctx) {
  const line = e.line;
  const label = str(args[0]);
  switch (name) {
    case 'get': case 'header': case 'param':
      return { value: V.source('src', `req.${name}(${label !== undefined ? JSON.stringify(label) : ''})`, line, name === 'param' ? 0 : 0) };
    case 'on': case 'once': case 'addListener': {
      const event = label;
      const chunk = event === 'data' ? V.source('src', 'request body chunk', line, 0) : V.CLEAN;
      runCallbacks(args.slice(1), ctx, line, [chunk]);
      return { value: recv };
    }
    case 'is': case 'accepts': case 'acceptsCharsets': case 'acceptsEncodings': case 'acceptsLanguages': case 'range':
      return { value: V.CLEAN };
    default:
      return null;
  }
}

function methodCall(name, recv, args, e, ctx) {
  const line = e.line;
  const rcls = clsOf(recv);
  const a0 = args[0];

  // a function exported by one of the project's own modules: const db = require('./db'); db.find(id)
  if (rcls && /^module:[./]/.test(rcls)) {
    const fn = ctx.findFunction(name);
    if (fn) return { value: ctx.invokeClosure({ t: false, fn }, args, line) };
  }

  if (rcls === 'http:Response' || rcls === 'fastify:Reply') {
    const r = responseCall(name, recv, args, e, ctx);
    if (r) return r;
  }
  if (rcls === 'http:Request') {
    const r = requestCall(name, recv, args, e, ctx);
    if (r) return r;
  }

  // route registration: app.get('/path', handler), router.post(...), app.use(mw)
  if (ROUTE_METHODS.has(name)) {
    const app = rcls === 'express:App' || rcls === 'express:Router';
    const pathArg = str(a0);
    const handlers = [];
    for (const a of args) {
      if (isClosure(a)) handlers.push(a);
      else if (a && a.arr) for (const [, item] of a.arr) if (isClosure(item)) handlers.push(item);
    }
    const looksLikeRoute = app || (pathArg !== undefined && /^[/*]/.test(pathArg)) || handlers.some((h) => h.fn.params.some((p) => /^(req|request)$/i.test(p.name)));
    if (looksLikeRoute && handlers.length) {
      for (const h of handlers) ctx.invokeClosure(h, handlerArgs(h.fn, line, ctx.opts), line);
      return { value: recv || V.CLEAN };
    }
    if (name === 'route' && app) return { value: recv };
  }

  // SQL
  if (name === 'query' || name === 'execute') {
    const sql = sqlArg(a0);
    runCallbacks(args.slice(1), ctx, line);
    if (!sql) return { value: V.CLEAN };
    const known = rcls && /^sql:/.test(rcls);
    return { value: V.CLEAN, sinks: [S('NODE-SQLI-001', null, 'sql', { value: sql, name: `${name}()`, confPenalty: known ? 0 : 1 })] };
  }
  if (SQL_METHODS_RAW.has(name)) {
    return { value: recv || V.CLEAN, sinks: [S('NODE-SQLI-001', 0, 'sql', { name: `${name}()` })] };
  }
  if (SQL_METHODS_QB.has(name) && args.length === 1 && a0 && a0.t && a0.segs) {
    return { value: recv || V.CLEAN, sinks: [S('NODE-SQLI-001', 0, 'sql', { name: `${name}()`, confPenalty: 1 })] };
  }
  if (name === 'escape' || name === 'escapeId' || name === 'escapeLiteral' || name === 'escapeIdentifier') {
    if (rcls && /^sql:/.test(rcls)) return { value: V.sanitize(a0, { enc: { sqlQuoted: true } }, line, `${name}()`) };
  }

  // MongoDB / Mongoose
  if (NOSQL_METHODS.has(name) && a0 && !isClosure(a0)) {
    const known = rcls === 'mongo:Model' || rcls === 'mongo:Collection';
    const unsafe = nosqlUnsafe(a0);
    runCallbacks(args.slice(1), ctx, line);
    const looksMongo = known || (a0.arr && !a0.str) || (a0.t && !a0.segs);
    if (looksMongo && unsafe.length) {
      const penalty = known ? 0 : 1;
      return { value: V.CLEAN, sinks: unsafe.map((v) => S('NODE-NOSQL-001', null, 'any', { value: v, name: `${name}()`, confPenalty: penalty + (ctx.opts && ctx.opts.mongoSanitize ? 2 : 0) })) };
    }
    if (name === 'find' && recv && recv.t && !known) return { value: elementOf(recv) };
    return { value: V.CLEAN };
  }
  if (name === 'collection' || name === 'db') return { value: tag(name === 'collection' ? 'mongo:Collection' : 'mongo:Db') };
  if (name === '$where' || (name === 'where' && rcls === 'mongo:Model' && a0 && a0.t)) {
    return { value: recv || V.CLEAN, sinks: [S('NODE-NOSQL-001', 0, 'any', { name: `${name}()` })] };
  }

  // strings
  if (STRING_PROPAGATE.has(name)) return { value: recv && recv.t ? asString(recv, line, `.${name}()`) : (recv && recv.str !== undefined && name === 'toString' ? recv : V.CLEAN) };
  if (name === 'replace' || name === 'replaceAll') {
    if (!recv || !recv.t) return { value: a0 && args[1] && args[1].t ? asString(args[1], line, `.${name}()`) : V.CLEAN };
    const pattern = str(a0);
    // the usual regex-escaping idiom: s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (pattern !== undefined && str(args[1]) === '\\$&' && pattern.includes('[') && pattern.includes('\\') && /[*+?]/.test(pattern)) {
      return { value: { ...asString(recv, line, 'escaped for RegExp'), regexEscaped: true } };
    }
    const effect = pattern !== undefined && /^\/.*\/[a-z]*$/s.test(pattern) ? replaceEffect(pattern, str(args[1])) : null;
    if (effect) return { value: V.sanitize(recv, effect, line, `.${name}() with ${pattern}`) };
    const replacement = args[1] && args[1].t ? args[1] : null;
    return { value: replacement ? V.join(asString(recv, line, `.${name}()`), propagate(replacement)) : asString(recv, line, `.${name}()`) };
  }
  if (name === 'split' || name === 'match' || name === 'matchAll') return { value: recv && recv.t ? arrayOf(asString(recv, line, `.${name}()`)) : V.CLEAN };
  if (name === 'exec' && recv && recv.str !== undefined && /^\/.*\/[a-z]*$/s.test(recv.str)) return { value: a0 && a0.t ? arrayOf(asString(a0, line, 'RegExp.exec()')) : V.CLEAN };
  if (name === 'concat' && recv && !recv.arr) return { value: V.concat([recv, ...args]) };
  if (name === 'join') return { value: recv && (recv.t || recv.arr) ? asString(elementOf(recv), line, '.join()') : V.CLEAN };
  if (BOOLEAN_METHODS.has(name)) {
    runCallbacks(args, ctx, line, [elementOf(recv)]);
    return { value: V.CLEAN };
  }

  // arrays
  if (name === 'push' || name === 'unshift') {
    const added = V.joinAll(args);
    const base = recv || { t: false, arr: new Map() };
    const arr = new Map(base.arr || []);
    arr.set('*', arr.has('*') ? V.join(arr.get('*'), added) : added);
    const updated = { ...V.join(base, added), arr };
    return { value: NUM, recvUpdate: updated };
  }
  if (name === 'map' || name === 'flatMap') {
    const out = runCallbacks(args, ctx, line, [elementOf(recv), NUM, recv || V.CLEAN]);
    return { value: arrayOf(out) };
  }
  if (name === 'forEach' || name === 'reduce' || name === 'reduceRight') {
    const ret = runCallbacks(args, ctx, line, name === 'forEach' ? [elementOf(recv), NUM, recv || V.CLEAN] : [args[1] || V.CLEAN, elementOf(recv)]);
    return { value: name === 'forEach' ? V.CLEAN : V.join(ret, args[1] || V.CLEAN) };
  }
  if (ARRAY_PROPAGATE.has(name)) {
    runCallbacks(args, ctx, line, [elementOf(recv)]);
    if (name === 'find' || name === 'findLast' || name === 'pop' || name === 'shift') return { value: elementOf(recv) };
    return { value: recv && (recv.t || recv.arr) ? recv : V.CLEAN };
  }

  // promises
  if (name === 'then' || name === 'catch' || name === 'finally') {
    const ret = runCallbacks(args, ctx, line, [name === 'then' ? (recv || V.CLEAN) : V.CLEAN]);
    return { value: ret };
  }

  // maps and URL search parameters
  if ((name === 'get' || name === 'getAll') && recv && recv.t) return { value: propagate(recv, line, `.${name}()`) };
  if (name === 'set' && recv && recv.obj && recv.obj.cls === 'Map') return { value: recv };

  return null;
}

function newCall(cls, args, e, ctx) {
  const line = e.line;
  const a0 = args[0];
  if (cls === 'function') return { value: V.CLEAN, sinks: [S('NODE-CODE-001', 'all', 'any', { name: 'new Function()' })] };
  if (cls === 'regexp') return { value: V.CLEAN, sinks: a0 && a0.regexEscaped ? [] : [S('NODE-REDOS-001', 0, 'any', { name: 'new RegExp()' })] };
  if (cls === 'vm.script' || cls === 'vm2.vm' || cls === 'vm2.nodevm') return { value: V.CLEAN, sinks: [S('NODE-CODE-001', 0, 'any', { name: `new ${cls}()` })] };
  if (SQL_CLASSES.has(cls) || /^(pg|mssql|sequelize|sqlite3|typeorm)\./.test(cls)) return { value: tag('sql:Connection') };
  if (cls === 'mongodb.mongoclient') return { value: tag('mongo:Client') };
  if (cls === 'url' || cls === 'url.url' || cls === 'urlsearchparams' || cls === 'url.urlsearchparams') {
    const v = a0 && a0.t ? asString(a0, line, `new ${cls === 'urlsearchparams' ? 'URLSearchParams' : 'URL'}()`) : V.CLEAN;
    return { value: v.t ? { ...v, arr: new Map([['searchParams', v], ['search', v], ['pathname', v], ['href', v], ['hostname', v], ['host', v]]) } : v };
  }
  if (cls === 'set' || cls === 'map') return { value: a0 ? { ...a0, obj: { cls: cls === 'set' ? 'Set' : 'Map', fields: new Map() } } : tag(cls === 'set' ? 'Set' : 'Map') };
  if (cls === 'promise' && isClosure(a0)) {
    ctx.invokeClosure(a0, [V.CLEAN, V.CLEAN], line);
    return { value: V.CLEAN };
  }
  if (cls === 'https.agent' || cls === 'http.agent') return { value: V.CLEAN };
  // unknown constructors: callbacks run, the object depends on its arguments
  runCallbacks(args, ctx, line);
  const joined = V.joinAll(args.filter((a) => a && a.t));
  return { value: joined.t ? V.weaken(propagate(joined, line, `new ${cls}()`)) : tag(cls) };
}

/* ------------------------------------------------------------------ catalog */

function call(callee, args, e, ctx) {
  const line = e.line;
  if (callee === '@require' || callee === '@import') {
    const a0 = args[0];
    if (a0 && a0.t) return { value: V.CLEAN, sinks: [S('NODE-CODE-002', 0, 'any', { name: callee === '@require' ? 'require()' : 'import()' })] };
    return { value: requireValue(a0) };
  }
  if (callee === '@seq') return { value: args[args.length - 1] || V.CLEAN };
  if (callee === '@invoke') return { value: isClosure(args[0]) ? ctx.invokeClosure(args[0], args.slice(1), line) : V.CLEAN };
  if (callee === '@jsx') return { value: V.CLEAN, sinks: args.map((_, i) => S('NODE-XSS-001', i, 'html', { freshHtml: true, name: 'dangerouslySetInnerHTML' })) };
  if (callee.startsWith('@tag:')) {
    const tagName = callee.slice(5);
    if (/(^|\.)(sql|SQL|raw|unsafe)$/.test(tagName) && !/(^|\.)(raw|unsafe)$/.test(tagName)) return { value: V.CLEAN }; // parameterized SQL templates
    if (/(^|\.)(html|css|gql|graphql)$/.test(tagName)) return { value: V.CLEAN };
    return { value: V.concat(args) };
  }
  if (callee === '@dyncall') {
    const fnVal = args[0];
    if (isClosure(fnVal)) return { value: ctx.invokeClosure(fnVal, args.slice(1), line) };
    return null;
  }

  if (callee.startsWith('fn:')) {
    const name = callee.slice(3);
    // module members (child_process.exec) and package default exports (escape-html, axios, ...)
    if (name.includes('.') || isModuleLike(name)) {
      const hit = moduleCall(name, args, e, ctx);
      if (hit) return hit;
    }
    const g = globalCall(name, args, e, ctx);
    if (g) return g;
    // a variable holding a function: handler(req, res)
    const v = ctx.readPath({ k: 'path', base: name, segs: [], line });
    if (isClosure(v)) return { value: ctx.invokeClosure(v, args, line) };
    runCallbacks(args, ctx, line);
    return null;
  }

  if (callee.startsWith('m:')) {
    const name = callee.slice(2);
    const recvExpr = e.recv;
    if (recvExpr && recvExpr.k === 'path' && recvExpr.segs.length === 0 && GLOBAL_OBJECTS.has(recvExpr.base)) {
      const g = globalObjectCall(recvExpr.base, name, args, e, ctx);
      if (g) return g;
    }
    const recv = ctx.recv || (recvExpr ? ctx.evalExpr(recvExpr) : null);
    const hit = methodCall(name, recv, args, e, ctx);
    if (hit) return hit;
    // a property holding a function: obj.callback(x)
    if (recvExpr && recvExpr.k === 'path') {
      const fnVal = ctx.readPath({ ...recvExpr, segs: recvExpr.segs.concat([{ key: name }]) });
      if (isClosure(fnVal)) return { value: ctx.invokeClosure(fnVal, args, line) };
    }
    runCallbacks(args, ctx, line);
    // unknown method on tainted data: the result is probably derived from it
    if (recv && recv.t) return { value: V.weaken(propagate(recv, line, `.${name}()`)) };
    return null;
  }

  if (callee.startsWith('new:')) return newCall(callee.slice(4), args, e, ctx);
  return null;
}

/** Module default exports used as functions: escape-html, axios, got, deepmerge, ... */
const MODULE_FUNCTIONS = new Set([
  'escape-html', 'xss', 'sanitize-html', 'axios', 'got', 'node-fetch', 'request', 'request-promise', 'request-promise-native', 'needle', 'superagent', 'phin', 'bent', 'ky',
  'deepmerge', 'merge', 'merge-deep', 'deep-extend', 'defaults-deep', 'mixin-deep', 'set-value', 'extend', 'express', 'fastify', 'koa', 'knex', 'postgres', 'better-sqlite3',
  'cross-spawn', 'execa', 'mongo-sanitize', 'shell-escape', 'sanitize-filename', 'escape-string-regexp', 'safe-eval', 'notevil', 'static-eval', 'lodash.merge', 'lodash.mergewith',
  'lodash.defaultsdeep', 'lodash.set', 'lodash.escape', 'lodash.escaperegexp',
]);
function isModuleLike(name) {
  return MODULE_FUNCTIONS.has(name);
}

/* ------------------------------------------------------------------- guards */

function guard(test, evalExpr) {
  const callee = test.callee || '';
  const args = test.args || [];
  const target = args[0];
  if (!target || target.k !== 'path') return null;
  // ALLOWED.includes(x) / allowed.has(x)
  if ((callee === 'm:includes' || callee === 'm:has') && test.recv) {
    const hay = evalExpr(test.recv);
    if (constStrings(hay)) return { target, effect: { clean: true }, note: 'checked against an allow-list' };
    return { target, effect: { guarded: true }, note: `.${callee.slice(2)}() check` };
  }
  // /^[a-z0-9]+$/.test(x)
  if (callee === 'm:test' && test.recv) {
    const pattern = str(evalExpr(test.recv));
    const chars = pattern !== undefined ? allowlist(pattern) : null;
    if (chars !== null) return { target, effect: { allowed: chars }, note: 'validated by an allow-list pattern' };
    return null;
  }
  const name = callee.replace(/^fn:/, '');
  if (/^validator\.(isInt|isNumeric|isFloat|isDecimal|isPort|isBoolean)$/.test(name)) return { target, effect: { clean: true, num: true }, note: `${name}() check` };
  if (/^validator\.(isUUID|isHexadecimal|isMongoId|isHash|isMD5)$/.test(name)) return { target, effect: { allowed: `${HEX}-` }, note: `${name}() check` };
  if (/^validator\.isAlphanumeric$/.test(name)) return { target, effect: { allowed: WORD.replace('_', '') }, note: `${name}() check` };
  if (/^validator\.isAlpha$/.test(name)) return { target, effect: { allowed: LETTERS }, note: `${name}() check` };
  if (/^validator\.(isEmail|isURL|isFQDN|isIP|isISO8601|isDate|isJWT|isSlug)$/.test(name)) return { target, effect: { guarded: true }, note: `${name}() check` };
  if (callee === 'm:isInteger' || callee === 'm:isSafeInteger' || callee === 'm:isFinite') return { target, effect: { clean: true, num: true }, note: `Number.${callee.slice(2)}() check` };
  return null;
}

const KNOWN_METHODS = new Set([
  'send', 'json', 'jsonp', 'end', 'write', 'redirect', 'render', 'status', 'set', 'get', 'post', 'put', 'patch', 'delete', 'use', 'all', 'route', 'listen',
  'query', 'execute', 'raw', 'find', 'findOne', 'then', 'catch', 'finally', 'map', 'filter', 'forEach', 'reduce', 'push', 'join', 'replace', 'split',
  'trim', 'toString', 'includes', 'test', 'exec', 'on', 'once', 'emit', 'pipe', 'update', 'remove', 'save', 'create', 'insert', 'select', 'where', 'has', 'add',
]);

const catalog = {
  call,
  guard,
  entryArgs,
  isKnownMethod: (name) => KNOWN_METHODS.has(name),
  style: { varPrefix: '', prop: '.', dotKeys: true },
  capturesScope: true, // closures see their module scope
};

module.exports = { catalog, requestValue, handlerArgs, nosqlUnsafe };
