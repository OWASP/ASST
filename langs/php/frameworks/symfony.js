'use strict';
/*
 * Symfony / Twig pack: request bags as sources, Doctrine raw SQL and DQL, redirects;
 * Twig |raw output and disabled autoescaping.
 */

const BAGS = new Set(['query', 'request', 'cookies', 'headers', 'attributes', 'files', 'server']);

function detect(project, readText, composer) {
  const req = composer ? { ...(composer.require || {}), ...(composer['require-dev'] || {}) } : {};
  const symfony = Object.keys(req).some((k) => k.startsWith('symfony/'));
  const twig = Boolean(req['twig/twig']) || project.files.some((f) => f.ext === 'twig');
  if (!symfony && !twig) return null;
  return { symfony, twig, version: req['symfony/framework-bundle'] ? String(req['symfony/framework-bundle']).replace(/[^\d.]/g, '') || null : null };
}

function call(callee, args, e, ctx, { V, S }) {
  const line = e.line;
  const method = callee.startsWith('m:') ? callee.slice(2) : null;
  // $request->query->get('x'), $request->request->all(), ...
  if (method && ['get', 'all', 'getint', 'getalpha', 'getalnum', 'getdigits', 'getboolean', 'getstring'].includes(method) && e.recv && e.recv.k === 'path') {
    const segs = e.recv.segs;
    const bag = segs.length ? segs[segs.length - 1].prop : null;
    if (/^(request|req)$/i.test(e.recv.base) && bag && BAGS.has(bag)) {
      if (['getint', 'getdigits', 'getboolean'].includes(method)) return { value: { t: false, num: true } };
      if (method === 'getalpha') return { value: V.sanitize(V.source('src', `$request->${bag}->getAlpha()`, line), { allowed: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' }, line, 'getAlpha()') };
      if (method === 'getalnum') return { value: V.sanitize(V.source('src', `$request->${bag}->getAlnum()`, line), { allowed: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }, line, 'getAlnum()') };
      return { value: V.source('src', `$request->${bag}->${method}()`, line, 0) };
    }
    if (/^(request|req)$/i.test(e.recv.base) && segs.length === 0 && method === 'get') return { value: V.source('src', '$request->get()', line, 0) };
  }
  if (method === 'getcontent' && e.recv && e.recv.k === 'path' && /^(request|req)$/i.test(e.recv.base)) return { value: V.source('src', '$request->getContent()', line, 0) };
  if (method && ['executequery', 'executestatement', 'executeupdate', 'fetchallassociative', 'fetchassociative', 'fetchone', 'fetchall'].includes(method)) {
    return { value: V.CLEAN, sinks: [S('PHP-SQLI-001', 0, 'sql')] };
  }
  if (method === 'createquery' || method === 'createnativequery') return { value: { t: false, obj: { cls: 'Query', fields: new Map() } }, sinks: [S('PHP-SQLI-001', 0, 'sql')] };
  if (method === 'redirect' && e.recv && e.recv.k === 'path' && e.recv.base === 'this') return { value: V.CLEAN, sinks: [S('PHP-REDIR-001', 0, 'urlControl')] };
  if (callee === 'new:redirectresponse') return { value: V.CLEAN, sinks: [S('PHP-REDIR-001', 0, 'urlControl')] };
  if (callee === 'new:response') return { value: V.CLEAN, sinks: [S('PHP-XSS-001', 0, 'html', { name: 'new Response()', confPenalty: 1 })] };
  return null;
}

/** Twig templates: |raw and disabled autoescaping. */
function templateRules(file, text) {
  if (file.ext !== 'twig') return [];
  const hits = [];
  text.split('\n').forEach((l, i) => {
    const re = /\{\{\s*([^}]*?)\|\s*raw\b[^}]*\}\}/g;
    let m;
    while ((m = re.exec(l)) !== null) {
      hits.push({ ruleId: 'PHP-XSS-002', line: i + 1, column: m.index + 1, confidence: /app\.request|request\./.test(m[1]) ? 'high' : 'medium', message: `Twig prints "${m[1].trim().slice(0, 60)}" with the |raw filter, which turns off escaping.` });
    }
    if (/\{%\s*autoescape\s+false\s*%\}/.test(l)) {
      hits.push({ ruleId: 'PHP-XSS-002', line: i + 1, column: 1, confidence: 'medium', message: 'Autoescaping is switched off for this block; every value inside is printed without escaping.' });
    }
  });
  return hits;
}

module.exports = { name: 'Symfony/Twig', detect, call, templateRules, CSRF_HELPERS: /csrf_token\s*\(|form_rest\s*\(|form_end\s*\(|form_widget\s*\(/ };
