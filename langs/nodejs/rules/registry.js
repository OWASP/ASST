'use strict';
/*
 * Rule metadata for the Node.js plugin (OWASP Top 10:2025 and 2021 mapping, CWE, severity,
 * remediation guide anchor in langs/nodejs/guides).
 */
const { commonRules } = require('../../../core/rules/common');

const R = (id, title, cwe, a2025, a2021, severity, guide, _pdf, summary) => ({ id, title, cwe, category: `${a2025}:2025`, owasp2021: `${a2021}:2021`, severity, guide, pdf: null, summary });

const RULES = [
  // data flow (taint) rules
  R('NODE-SQLI-001', 'SQL injection', 'CWE-89', 'A05', 'A03', 'high', 'injection#sql-injection', null,
    'User-controlled data is placed into an SQL query. Use placeholders (?, $1) with a values array, or a query builder.'),
  R('NODE-NOSQL-001', 'NoSQL injection', 'CWE-943', 'A05', 'A03', 'high', 'injection#nosql-injection', null,
    'Request data reaches a MongoDB query as-is. JSON bodies and query strings can carry objects such as {"$ne": ""} that change the query.'),
  R('NODE-CMDI-001', 'OS command injection', 'CWE-78', 'A05', 'A03', 'critical', 'injection#command-injection', null,
    'User-controlled data reaches a shell command. Use execFile/spawn with an argument array and no shell, and validate the values.'),
  R('NODE-CMDI-002', 'Argument injection', 'CWE-88', 'A05', 'A03', 'high', 'injection#command-injection', null,
    'User-controlled data is passed as a program argument. Values starting with "-" can switch on dangerous options.'),
  R('NODE-CODE-001', 'Code injection', 'CWE-95', 'A05', 'A03', 'critical', 'injection#code-injection', null,
    'User-controlled data is executed as JavaScript (eval, Function, vm, string timers).'),
  R('NODE-CODE-002', 'Module loaded from user input', 'CWE-829', 'A05', 'A08', 'critical', 'injection#code-injection', null,
    'require() or import() loads a module whose name comes from the request.'),
  R('NODE-XSS-001', 'Cross-site scripting (XSS)', 'CWE-79', 'A05', 'A03', 'medium', 'xss#output-encoding', null,
    'User-controlled data is sent as HTML without encoding. Use a template engine with auto-escaping, or escape the value for its HTML context.'),
  R('NODE-XSS-002', 'Unescaped template output', 'CWE-79', 'A05', 'A03', 'medium', 'xss#template-escaping', null,
    'A template prints a value without escaping (EJS <%- %>, Handlebars {{{ }}}, Pug !=, Nunjucks | safe).'),
  R('NODE-PATH-001', 'Path traversal', 'CWE-22', 'A01', 'A01', 'high', 'access-control#path-traversal', null,
    'User-controlled data is used in a file path. "../" sequences can reach other files on the server.'),
  R('NODE-SSRF-001', 'Server-side request forgery (SSRF)', 'CWE-918', 'A01', 'A10', 'high', 'access-control#ssrf', null,
    'The server requests a URL that the user controls, which can reach internal services and cloud metadata endpoints.'),
  R('NODE-REDIR-001', 'Open redirect', 'CWE-601', 'A01', 'A01', 'medium', 'access-control#open-redirect', null,
    'The redirect target comes from the request, so links on your domain can forward visitors to any site.'),
  R('NODE-REDOS-001', 'Regular expression built from user input', 'CWE-1333', 'A05', 'A03', 'medium', 'injection#regex-injection', null,
    'A regular expression is created from request data. Crafted patterns can block the event loop (ReDoS) or change what is matched.'),
  R('NODE-PROTO-001', 'Prototype pollution', 'CWE-1321', 'A08', 'A08', 'medium', 'integrity#prototype-pollution', null,
    'Request data is deep-merged into an object. Keys such as "__proto__" can change the behaviour of every object in the application.'),
  R('NODE-DESER-001', 'Insecure deserialization', 'CWE-502', 'A08', 'A08', 'critical', 'integrity#deserialization', null,
    'Request data is deserialized with a library that can execute embedded functions.'),
  R('NODE-CORS-001', 'Cross-origin requests allowed from any site', 'CWE-942', 'A01', 'A01', 'high', 'access-control#cors', null,
    'CORS accepts every origin together with credentials, so any website can read responses with the visitor\'s cookies.'),

  // configuration rules
  R('NODE-HDR-001', 'Security headers not configured', 'CWE-693', 'A02', 'A05', 'low', 'misconfiguration#security-headers', null,
    'The Express app does not use helmet() or set security headers, and announces itself with X-Powered-By.'),
  R('NODE-SESS-001', 'Weak session cookie settings', 'CWE-1004', 'A07', 'A07', 'medium', 'authentication#session-cookies', null,
    'The session cookie is configured without HttpOnly, Secure or SameSite protection.'),
  R('NODE-JWT-001', 'JWT signature not strictly verified', 'CWE-347', 'A04', 'A02', 'medium', 'authentication#jwt', null,
    'JSON Web Tokens are verified without a fixed list of algorithms, or the "none" algorithm is allowed.'),
  R('NODE-TLS-001', 'TLS certificate validation disabled', 'CWE-295', 'A04', 'A07', 'high', 'cryptography#tls-verification', null,
    'Outgoing HTTPS connections accept any certificate, so traffic can be intercepted.'),
  R('NODE-STATIC-001', 'Application folder served as static files', 'CWE-538', 'A02', 'A05', 'high', 'misconfiguration#static-files', null,
    'express.static() serves the project folder itself, which exposes source code, .env files and dependencies.'),
  R('NODE-CRYPTO-001', 'Weak password hashing', 'CWE-916', 'A04', 'A02', 'high', 'cryptography#password-storage', null,
    'Passwords are hashed with a fast general-purpose hash. Use bcrypt, scrypt or argon2.'),
  R('NODE-CRYPTO-002', 'Predictable random value for a security token', 'CWE-338', 'A04', 'A02', 'medium', 'cryptography#randomness', null,
    'Math.random() is used for a token, password or key. Use crypto.randomBytes() or crypto.randomUUID().'),
  R('NODE-COMP-001', 'Node.js version is end of life', 'CWE-1104', 'A03', 'A06', 'high', 'components#runtime-versions', null,
    'The Node.js version the project is set up for no longer receives security fixes.'),

  // browser-side JavaScript (shared detection with the PHP plugin)
  R('JS-XSS-001', 'DOM-based cross-site scripting', 'CWE-79', 'A05', 'A03', 'medium', 'xss#dom-xss', null,
    'Browser-controlled data (URL, hash, referrer, messages) is written into the page as HTML.'),
  R('JS-CODE-001', 'JavaScript code built from untrusted data', 'CWE-95', 'A05', 'A03', 'high', 'xss#dom-xss', null,
    'eval(), new Function() or string timers execute data that comes from the URL or other untrusted input.'),

  // dependencies, secrets and live checks (shared with other language plugins)
  ...commonRules(R),
];

const BY_ID = new Map(RULES.map((r) => [r.id, r]));

function rule(id) {
  const r = BY_ID.get(id);
  if (!r) throw new Error(`unknown rule ${id}`);
  return r;
}

module.exports = { RULES, rule };
