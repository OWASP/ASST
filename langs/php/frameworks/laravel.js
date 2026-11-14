'use strict';
/*
 * Laravel pack: request sources, raw query builders, redirects and HTTP client for the
 * taint engine; Blade raw output, mass assignment, debug mode and CSRF exemptions.
 */

const REQUEST_METHODS = new Set(['input', 'query', 'post', 'all', 'only', 'except', 'get', 'cookie', 'header', 'json', 'route', 'string', 'str', 'collect', 'validated', 'safe']);
const RAW_SQL_METHODS = new Set(['whereraw', 'orwhereraw', 'havingraw', 'orhavingraw', 'orderbyraw', 'selectraw', 'groupbyraw', 'fromraw', 'joinraw']);
const DB_STATIC = new Set(['raw', 'select', 'insert', 'update', 'delete', 'statement', 'unprepared', 'selectone', 'scalar']);

function detect(project, readText, composer) {
  const req = composer ? { ...(composer.require || {}), ...(composer['require-dev'] || {}) } : {};
  if (req['laravel/framework']) return { version: String(req['laravel/framework']).replace(/[^\d.]/g, '') || null };
  if (project.files.some((f) => f.rel === 'artisan') && project.files.some((f) => f.rel.startsWith('app/'))) return { version: null };
  return null;
}

function isRequestReceiver(recv) {
  return recv && recv.k === 'path' && /^(request|req|httpRequest)$/i.test(recv.base) && recv.segs.length === 0;
}

function call(callee, args, e, ctx, { V, S }) {
  const line = e.line;
  const method = callee.startsWith('m:') ? callee.slice(2) : null;
  if (method && REQUEST_METHODS.has(method) && isRequestReceiver(e.recv)) {
    return { value: V.source('src', `$request->${method}()`, line, method === 'validated' || method === 'safe' ? 1 : 0) };
  }
  if (callee === 'fn:request' && args.length > 0) return { value: V.source('src', 'request()', line, 0) };
  if (callee === 'fn:old') return { value: V.source('src', 'old()', line, 1) };
  if (/^sm:(request|input)::(input|get|all|query|only|except)$/.test(callee)) return { value: V.source('src', callee.slice(3), line, 0) };
  if (callee === 'fn:e') return { value: V.sanitize(args[0], { enc: { html: true, htmlQuotes: true } }, line, 'e()') };
  if (method && RAW_SQL_METHODS.has(method)) return { value: { t: false, obj: { cls: 'Builder', fields: new Map() } }, sinks: [S('PHP-SQLI-001', 0, 'sql')] };
  const st = /^sm:db::(\w+)$/.exec(callee);
  if (st && DB_STATIC.has(st[1])) return { value: V.CLEAN, sinks: [S('PHP-SQLI-001', 0, 'sql')] };
  if (callee === 'fn:redirect' || /^sm:redirect::(to|away)$/.test(callee) || (method === 'away') || (method === 'to' && e.recv && e.recv.k === 'call' && e.recv.callee === 'fn:redirect')) {
    return { value: V.CLEAN, sinks: args.length ? [S('PHP-REDIR-001', 0, 'urlControl')] : [] };
  }
  if (/^sm:http::(get|post|put|patch|delete|head)$/.test(callee)) return { value: V.CLEAN, sinks: [S('PHP-SSRF-001', 0, 'urlControl')] };
  if (/^sm:storage::(get|put|delete|download|exists)$/.test(callee) || (method === 'download' && e.recv && e.recv.k === 'call' && e.recv.callee === 'fn:response')) {
    return { value: V.CLEAN, sinks: [S('PHP-PATH-001', 0, 'path')] };
  }
  return null;
}

/** Blade templates: unescaped output. */
function templateRules(file, text) {
  if (!file.name.endsWith('.blade.php')) return [];
  const hits = [];
  text.split('\n').forEach((l, i) => {
    const re = /\{!!\s*(.+?)\s*!!\}/g;
    let m;
    while ((m = re.exec(l)) !== null) {
      const expr = m[1];
      if (/^(csrf_field|method_field|\$__env|config\(|trans\(|__\(|json_encode|@json|Js::from)/.test(expr)) continue;
      const direct = /request\(|\$request|old\(|\$_(GET|POST|REQUEST|COOKIE)|input\(/.test(expr);
      hits.push({ ruleId: 'PHP-XSS-002', line: i + 1, column: m.index + 1, confidence: direct ? 'high' : 'medium', message: `Blade prints "${expr.slice(0, 60)}" without escaping ({!! !!}). Use {{ }} unless the value is trusted HTML that has been sanitized.` });
    }
  });
  return hits;
}

/** Mass assignment, debug mode and CSRF exemptions. */
function projectRules(phpFiles, envFiles) {
  const hits = [];
  for (const { rel, text } of phpFiles) {
    text.split('\n').forEach((l, i) => {
      if (/protected\s+\$guarded\s*=\s*(\[\s*\]|array\s*\(\s*\))\s*;/.test(l)) {
        hits.push({ ruleId: 'PHP-MASS-001', file: rel, line: i + 1, confidence: 'medium', message: 'This model has an empty $guarded list, so every attribute can be mass-assigned. Use $fillable with the fields users may set.' });
      }
      if (/::(create|forceCreate|firstOrCreate|updateOrCreate)\s*\(\s*\$request->all\(\)|->(fill|update|forceFill)\s*\(\s*\$request->all\(\)/.test(l)) {
        hits.push({ ruleId: 'PHP-MASS-001', file: rel, line: i + 1, confidence: 'high', message: 'All request fields are mass-assigned to a model. Pass $request->validated() or $request->only([...]) instead.' });
      }
      if (/(^|\/)config\/app\.php$/.test(rel) && /['"]debug['"]\s*=>\s*true\b/.test(l)) {
        hits.push({ ruleId: 'PHP-CONF-003', file: rel, line: i + 1, message: "'debug' => true is hard-coded in config/app.php. Read it from APP_DEBUG and keep it false in production." });
      }
    });
    if (/VerifyCsrfToken|ValidateCsrfToken/.test(text)) {
      const m = /protected\s+\$except\s*=\s*\[([\s\S]*?)\]/.exec(text);
      if (m && /['"]/.test(m[1])) {
        const line = text.slice(0, m.index).split('\n').length;
        hits.push({ ruleId: 'PHP-CSRF-002', file: rel, line, message: `CSRF protection is switched off for: ${m[1].replace(/\s+/g, ' ').trim().slice(0, 120)}. Make sure these routes do not change state for logged-in users.` });
      }
    }
  }
  for (const { rel, text } of envFiles) {
    const debug = /^\s*APP_DEBUG\s*=\s*(true|1)\s*$/im.test(text);
    const prod = /^\s*APP_ENV\s*=\s*prod(uction)?\s*$/im.test(text);
    if (debug && (prod || !/\.(example|dist|sample|testing)$/.test(rel))) {
      const line = text.split('\n').findIndex((l) => /^\s*APP_DEBUG\s*=/.test(l)) + 1;
      hits.push({ ruleId: 'PHP-CONF-003', file: rel, line, severity: prod ? 'high' : 'medium', message: `APP_DEBUG is true${prod ? ' while APP_ENV is production' : ''}. Debug pages reveal code, configuration and secrets; set APP_DEBUG=false in production.` });
    }
  }
  return hits;
}

module.exports = { name: 'Laravel', detect, call, templateRules, projectRules, CSRF_HELPERS: /@csrf|csrf_field\s*\(|csrf_token\s*\(/ };
