'use strict';
/*
 * Configuration rules for Node.js applications, evaluated on the Babel AST:
 * helmet / security headers, CORS, session cookies, JWT verification, TLS validation,
 * express.static() on the project folder, weak password hashing and Math.random() tokens.
 * Module bindings are resolved the same way as in the taint lowering, so
 * `const session = require('express-session')` and `import session from 'express-session'`
 * are both recognized.
 */
const { JsLowerer, unwrap, stringOf, propName } = require('../taint/lower');
const { lifecycle } = require('../../../core/lifecycle');

const line = (n) => (n && n.loc ? n.loc.start.line : null);
const col = (n) => (n && n.loc ? n.loc.start.column + 1 : null);

function walk(node, visit, parent = null) {
  if (!node || typeof node.type !== 'string') return;
  visit(node, parent);
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key.endsWith('Comments')) continue;
    const v = node[key];
    if (Array.isArray(v)) v.forEach((x) => walk(x, visit, node));
    else if (v && typeof v.type === 'string') walk(v, visit, node);
  }
}

function objectProps(n) {
  const o = unwrap(n);
  const out = new Map();
  if (!o || o.type !== 'ObjectExpression') return null;
  for (const p of o.properties) {
    if (p.type !== 'ObjectProperty' || !p.key) continue;
    const key = p.key.type === 'Identifier' ? p.key.name : stringOf(p.key);
    if (key) out.set(key, unwrap(p.value));
  }
  return out;
}

const isFalse = (n) => n && ((n.type === 'BooleanLiteral' && n.value === false) || (n.type === 'NumericLiteral' && n.value === 0) || (n.type === 'StringLiteral' && /^(0|false)$/.test(n.value)));
const isTrue = (n) => n && n.type === 'BooleanLiteral' && n.value === true;

/** Origin callbacks that accept everything: (origin, cb) => cb(null, true) */
function acceptsAnyOrigin(fn) {
  if (!fn || !['ArrowFunctionExpression', 'FunctionExpression'].includes(fn.type)) return false;
  let any = false;
  let conditional = false;
  walk(fn.body, (n) => {
    if (n.type === 'IfStatement' || n.type === 'ConditionalExpression' || n.type === 'LogicalExpression') conditional = true;
    if (n.type === 'CallExpression' && n.arguments.length >= 2 && isTrue(unwrap(n.arguments[1]))) any = true;
  });
  return any && !conditional;
}

const SECRET_NAME = /(^|_)(token|secret|password|passwd|pwd|nonce|salt|otp|apikey|api_key|sessionid|session_id|csrf|resetcode|reset_code|key)($|_)|token$|secret$|password$|nonce$|salt$|apiKey$/i;

/**
 * @param {object} ast Babel AST of one file
 * @param {string} rel file path
 * @param {string} text file contents
 * @returns {{hits:Array, facts:{expressApps:Array, helmet:boolean, headers:boolean, poweredByOff:boolean}}}
 */
function configRules(ast, rel, text) {
  const resolver = new JsLowerer(rel);
  resolver.collect(ast.program);
  const q = (n) => resolver.qualify(n);
  const hits = [];
  const facts = { expressApps: [], helmet: false, headers: false, poweredByOff: false };
  for (const mod of resolver.bindings.values()) if (/^helmet(\.|$)/.test(mod)) facts.helmet = true;

  walk(ast.program, (n, parent) => {
    if (n.type === 'CallExpression') {
      const callee = q(n.callee);
      const args = n.arguments.map(unwrap);
      if (callee === 'express') facts.expressApps.push({ file: rel, line: line(n) });
      if (callee && /^helmet(\.|$)/.test(callee)) facts.helmet = true;

      // res.set('Content-Security-Policy', ...) and friends count as manual security headers
      const prop = n.callee.type === 'MemberExpression' ? propName(n.callee) : null;
      if (prop && ['set', 'setHeader', 'header'].includes(prop) && /^(content-security-policy|x-content-type-options|x-frame-options|strict-transport-security)$/i.test(stringOf(args[0]) || '')) facts.headers = true;
      if (prop === 'disable' && /^x-powered-by$/i.test(stringOf(args[0]) || '')) facts.poweredByOff = true;

      // CORS
      if (callee === 'cors' && args[0]) {
        const o = objectProps(args[0]);
        if (o) {
          const origin = o.get('origin');
          const credentials = isTrue(o.get('credentials'));
          const reflects = isTrue(origin) || acceptsAnyOrigin(origin);
          if (reflects && credentials) {
            hits.push({ ruleId: 'NODE-CORS-001', file: rel, line: line(n), column: col(n), message: 'cors() reflects every Origin and allows credentials, so any website can make authenticated requests and read the answers. List the trusted origins explicitly.' });
          } else if (origin && origin.type === 'RegExpLiteral' && (!origin.pattern.startsWith('^') || !origin.pattern.endsWith('$'))) {
            hits.push({ ruleId: 'NODE-CORS-001', file: rel, line: line(n), column: col(n), severity: 'medium', message: `The CORS origin pattern /${origin.pattern}/ is not anchored with ^ and $, so domains such as "attacker-example.com" or "example.com.attacker.net" also match.` });
          }
        }
      }

      // session cookies
      if (callee === 'express-session' || callee === 'cookie-session') {
        const o = args[0] ? objectProps(args[0]) : null;
        if (o) {
          const cookie = callee === 'cookie-session' ? o : objectProps(o.get('cookie')) || new Map();
          const issues = [];
          let severity = 'low';
          if (isFalse(cookie.get('httpOnly'))) {
            issues.push('httpOnly is false (scripts can read the session cookie)');
            severity = 'medium';
          }
          if (!cookie.has('secure') || isFalse(cookie.get('secure'))) issues.push('secure is not enabled (set it to true, or "auto" behind a TLS proxy with app.set("trust proxy", 1))');
          if (!cookie.has('sameSite')) issues.push('sameSite is not set (use "lax" or "strict")');
          if (issues.length) hits.push({ ruleId: 'NODE-SESS-001', file: rel, line: line(n), column: col(n), severity, message: `${callee}() cookie settings: ${issues.join('; ')}.` });
        }
      }

      // JWT
      if (callee === 'jsonwebtoken.verify') {
        const o = args[2] ? objectProps(args[2]) : null;
        const algs = o && o.get('algorithms');
        const listed = algs && algs.type === 'ArrayExpression' ? algs.elements.map((x) => stringOf(x)).filter(Boolean) : null;
        if (listed && listed.some((a) => a.toLowerCase() === 'none')) hits.push({ ruleId: 'NODE-JWT-001', file: rel, line: line(n), column: col(n), severity: 'high', message: 'jwt.verify() accepts the "none" algorithm, so unsigned tokens are valid.' });
        else if (!algs) hits.push({ ruleId: 'NODE-JWT-001', file: rel, line: line(n), column: col(n), message: 'jwt.verify() is called without an algorithms list. Pin the expected algorithm, for example { algorithms: ["HS256"] }.' });
      }
      if (callee === 'jsonwebtoken.sign') {
        const o = args[2] ? objectProps(args[2]) : null;
        if (o && /^none$/i.test(stringOf(o.get('algorithm')) || '')) hits.push({ ruleId: 'NODE-JWT-001', file: rel, line: line(n), column: col(n), severity: 'high', message: 'jwt.sign() creates unsigned tokens (algorithm "none").' });
      }
      if ((callee === 'jsonwebtoken.sign' || callee === 'jsonwebtoken.verify') && args[1] && stringOf(args[1]) && stringOf(args[1]).length >= 4) {
        hits.push({ ruleId: 'SECRET-001', file: rel, line: line(args[1]), column: col(args[1]), confidence: 'high', redact: stringOf(args[1]), message: `The JWT signing key is written in the source (${'*'.repeat(8)} (${stringOf(args[1]).length} characters)). Load it from the environment and rotate it.` });
      }

      // express.static() on the project folder
      if (callee === 'express.static' && args[0]) {
        const a = args[0];
        const projectRoot = (a.type === 'Identifier' && a.name === '__dirname')
          || (a.type === 'StringLiteral' && /^(\.?\/?|\.\/?\.?)$/.test(a.value))
          || (a.type === 'CallExpression' && q(a.callee) === 'process.cwd')
          || (a.type === 'CallExpression' && /^path\.(join|resolve)$/.test(q(a.callee) || '') && a.arguments.every((x) => {
            const u = unwrap(x);
            return (u.type === 'Identifier' && u.name === '__dirname') || (u.type === 'StringLiteral' && /^(\.?\/?)$/.test(u.value));
          }))
          || (a.type === 'CallExpression' && a.callee.type === 'MemberExpression' && propName(a.callee) === 'cwd');
        if (projectRoot) hits.push({ ruleId: 'NODE-STATIC-001', file: rel, line: line(n), column: col(n), message: 'express.static() serves the application folder itself: source code, .env files and node_modules can be downloaded. Serve a dedicated folder such as "public" instead.' });
      }

      // fast hashes for passwords: crypto.createHash('md5').update(password)
      if (prop === 'update' && n.callee.object && n.callee.object.type === 'CallExpression' && q(n.callee.object.callee) === 'crypto.createHash') {
        const alg = (stringOf(n.callee.object.arguments[0]) || '').toLowerCase();
        const argText = args[0] && typeof args[0].start === 'number' ? text.slice(args[0].start, args[0].end) : '';
        if (/^(md5|md4|sha1|sha-1|sha224|sha256|sha384|sha512|sha3-\d+)$/.test(alg) && /pass(word)?|pwd/i.test(argText)) {
          hits.push({ ruleId: 'NODE-CRYPTO-001', file: rel, line: line(n), column: col(n), message: `The password is hashed with ${alg.toUpperCase()}, which is built for speed and can be brute-forced quickly. Use bcrypt, scrypt (crypto.scrypt) or argon2.` });
        }
      }
    }

    // TLS validation switched off
    if (n.type === 'ObjectProperty' && n.key && ['rejectUnauthorized', 'strictSSL'].includes(n.key.name || stringOf(n.key)) && isFalse(unwrap(n.value))) {
      hits.push({ ruleId: 'NODE-TLS-001', file: rel, line: line(n), column: col(n), message: `${n.key.name || stringOf(n.key)}: false turns off certificate checks for outgoing HTTPS connections. Trust the certificate properly (for example with the ca option) instead.` });
    }
    if (n.type === 'AssignmentExpression' && resolver.chainOf(n.left).join('.') === 'process.env.NODE_TLS_REJECT_UNAUTHORIZED' && isFalse(unwrap(n.right))) {
      hits.push({ ruleId: 'NODE-TLS-001', file: rel, line: line(n), column: col(n), severity: 'critical', message: 'NODE_TLS_REJECT_UNAUTHORIZED = "0" disables certificate checks for every HTTPS connection of the process.' });
    }

    // Math.random() for tokens and secrets
    let named = null;
    let valueNode = null;
    if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init) { named = n.id.name; valueNode = n.init; }
    if (n.type === 'AssignmentExpression') { named = resolver.chainOf(n.left).pop() || null; valueNode = n.right; }
    if (n.type === 'ObjectProperty' && n.key && !n.computed) { named = n.key.name || stringOf(n.key); valueNode = n.value; }
    if (named && valueNode && SECRET_NAME.test(named)) {
      let random = null;
      walk(valueNode, (x) => { if (x.type === 'CallExpression' && resolver.chainOf(x.callee).join('.') === 'Math.random') random = random || x; });
      if (random) hits.push({ ruleId: 'NODE-CRYPTO-002', file: rel, line: line(random), column: col(random), message: `"${named}" is generated with Math.random(), which is predictable. Use crypto.randomBytes() or crypto.randomUUID().` });
    }
    void parent;
  });
  return { hits, facts };
}

/** Project-level: Express apps without helmet() or manual security headers. */
function headerRule(allFacts) {
  const apps = allFacts.flatMap((f) => f.expressApps);
  if (!apps.length) return [];
  if (allFacts.some((f) => f.helmet || f.headers)) return [];
  const poweredByOff = allFacts.some((f) => f.poweredByOff);
  const first = apps[0];
  return [{
    ruleId: 'NODE-HDR-001',
    file: first.file,
    line: first.line,
    message: `The Express app does not use helmet() or set security headers such as Content-Security-Policy, X-Content-Type-Options and X-Frame-Options${poweredByOff ? '' : ', and it announces "X-Powered-By: Express"'}. Add app.use(helmet()).`,
  }];
}

/* -------------------------------------------------------------- templates */

const TEMPLATE_RULES = [
  { ext: /\.(ejs)$/i, re: /<%-\s*(?!\s*(include\b|body\b|layout\b|defineContent\b|script\b|style\b|partial\b))([^%]{1,120}?)%>/g, label: 'EJS <%- %>' },
  { ext: /\.(hbs|handlebars|mustache)$/i, re: /\{\{\{\s*(?!>)([^}]{1,120})\}\}\}/g, label: 'Handlebars {{{ }}}' },
  { ext: /\.(pug|jade)$/i, re: /(?:^\s*[\w.#-]*(?:\([^)]*\))?!=\s*(.{1,120})|!\{([^}]{1,120})\}|\w+!=\s*[\w"'`])/gm, label: 'Pug != / !{ }' },
  { ext: /\.(njk|nunjucks|html|twig)$/i, re: /\{\{[^}]{1,160}\|\s*safe\b[^}]*\}\}/g, label: 'Nunjucks | safe' },
  { ext: /\.(vue|html)$/i, re: /\bv-html\s*=\s*["']([^"']{1,120})["']/g, label: 'Vue v-html' },
];

function templateRules(file, text) {
  const hits = [];
  for (const rule of TEMPLATE_RULES) {
    if (!rule.ext.test(file.name)) continue;
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text)) !== null) {
      const lineNo = text.slice(0, m.index).split('\n').length;
      hits.push({ ruleId: 'NODE-XSS-002', line: lineNo, message: `${rule.label} prints "${m[0].replace(/\s+/g, ' ').trim().slice(0, 80)}" without HTML escaping. Use the escaping form, or sanitize the HTML first (for example with DOMPurify).` });
    }
  }
  if (/\.(njk|nunjucks|html)$/i.test(file.name)) {
    const re = /\{%\s*autoescape\s+false\s*%\}/g;
    let m;
    while ((m = re.exec(text)) !== null) hits.push({ ruleId: 'NODE-XSS-002', line: text.slice(0, m.index).split('\n').length, message: 'Auto-escaping is switched off for this template block.' });
  }
  return hits;
}

/* ---------------------------------------------------- Node.js lifecycle */

function majorFrom(spec) {
  const s = String(spec || '').trim();
  let m = /^v?(\d+)(?:\.\d+){0,2}$/.exec(s) || /^[~^=]\s*v?(\d+)(?:\.[\dx*]+)*$/.exec(s) || /^(\d+)\.x$/.exec(s) || /^>=\s*(\d+)(?:\.\d+)*\s*<\s*(\d+)/.exec(s);
  if (m && m[2] && Number(m[2]) !== Number(m[1]) + 1) m = null; // ">=14 <18" spans several majors
  return m ? m[1] : null;
}

/** Node.js versions the project is set up for (.nvmrc, .node-version, engines, Dockerfile). */
function nodeVersionRules(project, readText, today = new Date()) {
  const hits = [];
  const check = (file, lineNo, major, where) => {
    const lc = lifecycle('nodejs', major, today);
    if (lc.status !== 'eol') return;
    hits.push({ ruleId: 'NODE-COMP-001', file, line: lineNo, message: `${where} selects Node.js ${major}, which reached end of life${typeof lc.eol === 'string' ? ` on ${lc.eol}` : ''}. Move to a supported LTS release.` });
  };
  for (const f of project.files) {
    if (f.name === '.nvmrc' || f.name === '.node-version') {
      const text = (readText(f) || '').trim();
      const major = majorFrom(text.split(/\s/)[0]);
      if (major) check(f.rel, 1, major, f.name);
    } else if (f.name === 'package.json' && !f.rel.includes('node_modules/')) {
      try {
        const text = readText(f) || '';
        const pkg = JSON.parse(text);
        const major = pkg.engines && pkg.engines.node ? majorFrom(pkg.engines.node) : null;
        if (major) check(f.rel, text.split('\n').findIndex((l) => /"node"\s*:/.test(l)) + 1 || null, major, '"engines.node" in package.json');
      } catch (_) { /* not JSON */ }
    } else if (/^Dockerfile(\..+)?$/i.test(f.name) || /\.dockerfile$/i.test(f.name)) {
      (readText(f) || '').split('\n').forEach((l, i) => {
        const m = /^\s*FROM\s+(?:--platform=\S+\s+)?(?:docker\.io\/)?(?:library\/)?node:(\d+)/i.exec(l);
        if (m) check(f.rel, i + 1, m[1], `The Docker image "${l.trim().split(/\s+/).slice(-1)[0]}"`);
      });
    }
  }
  return hits;
}

module.exports = { configRules, headerRule, templateRules, nodeVersionRules, majorFrom };
