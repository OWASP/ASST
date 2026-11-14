'use strict';
/*
 * Rule metadata for the PHP plugin (OWASP Top 10:2025 and 2021 mapping, CWE, severity,
 * remediation guide anchor and the original PDF guide).
 */

const PDF = {
  injection: 'langs/php/docs/php_injection_prevention.pdf',
  xss: 'langs/php/docs/php_cross_site_scripting_prevention.pdf',
  auth: 'langs/php/docs/php_broken_authentication_prevention.pdf',
  crypto: 'langs/php/docs/php_sensitive_data_exposure_prevention.pdf',
  xxe: 'langs/php/docs/php_xml_external_entity_injection_prevention.pdf',
  misconfig: 'langs/php/docs/php_security_misconfiguration_prevention.pdf',
  components: 'langs/php/docs/php_using_components_with_known_vulnerabilities_prevention.pdf',
  csrf: 'langs/php/docs/php_cross_site_request_forgery_prevention.pdf',
  ssrf: 'langs/php/docs/php_server_side_request_forgery_prevention.pdf',
  hardening: 'langs/php/docs/php_extra_web_security_hardenings.pdf',
  other: 'langs/php/docs/php_other_web_security_suggestions.pdf',
};

const OWASP_2025 = {
  A01: 'A01:2025 Broken Access Control',
  A02: 'A02:2025 Security Misconfiguration',
  A03: 'A03:2025 Software Supply Chain Failures',
  A04: 'A04:2025 Cryptographic Failures',
  A05: 'A05:2025 Injection',
  A06: 'A06:2025 Insecure Design',
  A07: 'A07:2025 Authentication Failures',
  A08: 'A08:2025 Software or Data Integrity Failures',
  A09: 'A09:2025 Security Logging & Alerting Failures',
  A10: 'A10:2025 Mishandling of Exceptional Conditions',
};

const { commonRules } = require('../../../core/rules/common');

const R = (id, title, cwe, a2025, a2021, severity, guide, pdf, summary) => ({ id, title, cwe, category: `${a2025}:2025`, owasp2021: `${a2021}:2021`, severity, guide, pdf: PDF[pdf], summary });

const RULES = [
  // data flow (taint) rules
  R('PHP-SQLI-001', 'SQL injection', 'CWE-89', 'A05', 'A03', 'high', 'injection#sql-injection', 'injection',
    'User-controlled data is placed into an SQL query. Use prepared statements with bound parameters (PDO or MySQLi).'),
  R('PHP-XSS-001', 'Cross-site scripting (XSS)', 'CWE-79', 'A05', 'A03', 'medium', 'xss#output-encoding', 'xss',
    'User-controlled data is written to the page without encoding suitable for its HTML context.'),
  R('PHP-CMDI-001', 'OS command injection', 'CWE-78', 'A05', 'A03', 'critical', 'injection#command-injection', 'injection',
    'User-controlled data reaches a shell command. Avoid the shell, or pass each argument through escapeshellarg().'),
  R('PHP-CMDI-002', 'Argument injection', 'CWE-88', 'A05', 'A03', 'high', 'injection#command-injection', 'injection',
    'User-controlled data is passed as extra command-line arguments.'),
  R('PHP-CODE-001', 'Code injection', 'CWE-95', 'A05', 'A03', 'critical', 'injection#code-injection', 'injection',
    'User-controlled data is evaluated as PHP code.'),
  R('PHP-CODE-002', 'Unsafe dynamic function call', 'CWE-470', 'A05', 'A03', 'high', 'injection#code-injection', 'injection',
    'A function name taken from user input is called. Map allowed actions to functions explicitly.'),
  R('PHP-INCL-001', 'File inclusion', 'CWE-98', 'A05', 'A03', 'critical', 'injection#file-inclusion', 'ssrf',
    'A file path built from user input is included. Include only fixed files, or map user choices through an allow-list.'),
  R('PHP-PATH-001', 'Path traversal', 'CWE-22', 'A01', 'A01', 'high', 'access-control#path-traversal', 'ssrf',
    'A file system path is built from user input, which allows "../" sequences to reach other files.'),
  R('PHP-SSRF-001', 'Server-side request forgery (SSRF)', 'CWE-918', 'A01', 'A10', 'high', 'access-control#ssrf', 'ssrf',
    'The server fetches a URL whose scheme or host is controlled by the user.'),
  R('PHP-REDIR-001', 'Open redirect', 'CWE-601', 'A01', 'A01', 'medium', 'access-control#open-redirect', 'hardening',
    'The redirect target is taken from user input, which lets attackers send users to any site.'),
  R('PHP-HDR-001', 'HTTP header built from user input', 'CWE-113', 'A05', 'A03', 'low', 'injection#header-injection', 'injection',
    'A response header contains user input. Validate it and reject line breaks.'),
  R('PHP-LDAP-001', 'LDAP injection', 'CWE-90', 'A05', 'A03', 'high', 'injection#ldap-injection', 'injection',
    'User input is placed into an LDAP filter. Escape it with ldap_escape($value, "", LDAP_ESCAPE_FILTER).'),
  R('PHP-XPATH-001', 'XPath injection', 'CWE-643', 'A05', 'A03', 'high', 'injection#xpath-injection', 'injection',
    'User input is placed into an XPath expression. Allow-list the value or remove quotes and brackets.'),
  R('PHP-DESER-001', 'Insecure deserialization', 'CWE-502', 'A08', 'A08', 'high', 'integrity#deserialization', 'other',
    'unserialize() is called on user input, which can instantiate arbitrary objects. Use json_decode() instead.'),
  R('PHP-EXTRACT-001', 'Variables overwritten from user input', 'CWE-621', 'A08', 'A08', 'medium', 'integrity#variable-extraction', 'other',
    'extract() or parse_str() turns request data into local variables, letting users overwrite any variable.'),
  R('PHP-LOG-001', 'Log injection', 'CWE-117', 'A09', 'A09', 'low', 'logging#log-injection', 'injection',
    'User input is written to a log without removing line breaks, so attackers can forge log entries.'),
  R('PHP-MAIL-001', 'Mail header injection', 'CWE-93', 'A05', 'A03', 'medium', 'injection#header-injection', 'injection',
    'User input is placed into mail headers without removing line breaks.'),

  // structural rules
  R('PHP-EAR-001', 'Code keeps running after a redirect', 'CWE-698', 'A01', 'A01', 'medium', 'access-control#execution-after-redirect', 'hardening',
    'header("Location: ...") is not followed by exit; the rest of the page still runs and is sent to clients that ignore the redirect.'),
  R('PHP-CRYPTO-001', 'Weak password hashing', 'CWE-916', 'A04', 'A02', 'high', 'cryptography#password-storage', 'crypto',
    'Passwords are hashed with a fast hash (MD5/SHA). Use password_hash() and password_verify().'),
  R('PHP-CRYPTO-002', 'Predictable random value for a security token', 'CWE-338', 'A04', 'A02', 'medium', 'cryptography#randomness', 'crypto',
    'Tokens, salts or codes are generated with rand()/mt_rand()/uniqid(). Use random_bytes() or random_int().'),
  R('PHP-CRYPTO-003', 'Loose comparison of a secret value', 'CWE-697', 'A04', 'A02', 'medium', 'cryptography#comparisons', 'auth',
    'A token, hash or password is compared with ==. Use hash_equals() (or === for non-secret values).'),
  R('PHP-AUTH-001', 'Session not renewed after login', 'CWE-384', 'A07', 'A07', 'medium', 'authentication#session-fixation', 'auth',
    'The user is logged in without session_regenerate_id(true), which enables session fixation.'),
  R('PHP-CSRF-001', 'Form without CSRF protection', 'CWE-352', 'A01', 'A01', 'medium', 'access-control#csrf', 'csrf',
    'A POST form has no anti-CSRF token field. Add a per-session token and verify it with hash_equals().'),
  R('PHP-CONF-001', 'Errors are displayed to visitors', 'CWE-209', 'A02', 'A05', 'medium', 'misconfiguration#error-handling', 'misconfig',
    'display_errors is switched on in code. In production set display_errors=Off and log_errors=On.'),
  R('PHP-CONF-002', 'phpinfo() output exposed', 'CWE-200', 'A02', 'A05', 'medium', 'misconfiguration#information-disclosure', 'misconfig',
    'phpinfo() reveals the server configuration, paths and versions. Remove it from deployed code.'),
  R('PHP-ERR-001', 'Internal error details shown to users', 'CWE-209', 'A10', 'A04', 'low', 'exceptions#error-messages', 'misconfig',
    'Database or exception messages are printed to the page. Log them and show a generic message instead.'),
  R('PHP-XXE-001', 'XML external entities enabled', 'CWE-611', 'A02', 'A05', 'high', 'misconfiguration#xxe', 'xxe',
    'XML is parsed with entity substitution or external DTD loading enabled (LIBXML_NOENT / LIBXML_DTDLOAD).'),
  R('PHP-SECRET-001', 'Hard-coded credentials', 'CWE-798', 'A07', 'A07', 'high', 'authentication#credentials', 'auth',
    'A password is written in the source code. Read it from the environment or a configuration file outside the web root.'),
  R('PHP-FILE-001', 'Sensitive file inside the web root', 'CWE-538', 'A02', 'A05', 'high', 'misconfiguration#exposed-files', 'hardening',
    'A file that may contain secrets or data (database dump, backup, environment file, key) is inside the published folder.'),
  R('PHP-FILE-002', 'Version-control metadata inside the web root', 'CWE-527', 'A02', 'A05', 'high', 'misconfiguration#exposed-files', 'hardening',
    'A .git/.svn folder is inside the published folder; it can expose the complete source code and history.'),
  R('PHP-FILE-003', 'Dependency manifest inside the web root', 'CWE-538', 'A02', 'A05', 'low', 'misconfiguration#exposed-files', 'hardening',
    'Package manifests reveal the libraries and versions in use. Keep them outside the web root or deny access to them.'),
  R('PHP-HTA-001', 'Directory listing not disabled', 'CWE-548', 'A02', 'A05', 'low', 'misconfiguration#directory-listing', 'misconfig',
    'No "Options -Indexes" rule was found. If the site runs on Apache, folders without an index file can be listed.'),
  R('PHP-HTA-002', 'HTTPS is not enforced', 'CWE-319', 'A04', 'A02', 'medium', 'cryptography#https', 'crypto',
    'No HTTP-to-HTTPS redirect or HSTS header was found in .htaccess.'),
  R('PHP-HTTP-001', 'Insecure http:// URL', 'CWE-319', 'A04', 'A02', 'low', 'cryptography#https', 'crypto',
    'A resource or endpoint is referenced over plain HTTP.'),
  R('JS-XSS-001', 'DOM-based cross-site scripting', 'CWE-79', 'A05', 'A03', 'medium', 'xss#dom-xss', 'xss',
    'Browser-controlled data (URL, hash, referrer, messages) is written into the page as HTML.'),
  R('JS-CODE-001', 'JavaScript code built from untrusted data', 'CWE-95', 'A05', 'A03', 'high', 'xss#dom-xss', 'xss',
    'eval(), new Function() or string timers execute data that comes from the URL or other untrusted input.'),

  // framework rules
  R('PHP-XSS-002', 'Unescaped template output', 'CWE-79', 'A05', 'A03', 'medium', 'xss#template-escaping', 'xss',
    'A template prints a value without escaping (Blade {!! !!}, Twig |raw or autoescape off).'),
  R('PHP-CONF-003', 'Debug mode enabled', 'CWE-489', 'A02', 'A05', 'medium', 'misconfiguration#debug-mode', 'misconfig',
    'Framework debug mode is switched on; debug pages reveal source code, configuration values and secrets.'),
  R('PHP-MASS-001', 'Mass assignment from request data', 'CWE-915', 'A08', 'A08', 'medium', 'integrity#mass-assignment', 'other',
    'Request data is assigned to model attributes without an allow-list, so users can set fields such as is_admin.'),
  R('PHP-WP-001', 'WordPress action handler without nonce or capability check', 'CWE-352', 'A01', 'A01', 'high', 'access-control#wordpress-nonces', 'csrf',
    'An AJAX or admin-post handler changes data without verifying a nonce and the user\'s capabilities.'),
  R('PHP-CSRF-002', 'CSRF protection disabled for routes', 'CWE-352', 'A01', 'A01', 'low', 'access-control#csrf', 'csrf',
    'Routes are excluded from CSRF verification. Make sure they cannot be used to change state for logged-in users.'),

  // runtime rules
  R('PHP-COMP-001', 'PHP version is end of life', 'CWE-1104', 'A03', 'A06', 'high', 'components#runtime-versions', 'components',
    'The PHP version no longer receives security fixes.'),
  R('PHP-COMP-002', 'Outdated XML parser (libxml)', 'CWE-1104', 'A03', 'A06', 'medium', 'components#runtime-versions', 'components',
    'The libxml version used by PHP is old; versions before 2.9 load external entities by default.'),
  R('PHP-COMP-003', 'Database server version is end of life', 'CWE-1104', 'A03', 'A06', 'high', 'components#runtime-versions', 'components',
    'The MySQL/MariaDB server version no longer receives security fixes.'),
  R('PHP-DB-001', 'Passwords appear to be stored in plain text', 'CWE-256', 'A04', 'A02', 'critical', 'cryptography#password-storage', 'crypto',
    'Stored password values do not look like password hashes.'),
  R('PHP-DB-002', 'Passwords stored with a fast hash', 'CWE-916', 'A04', 'A02', 'high', 'cryptography#password-storage', 'crypto',
    'Stored passwords use a general-purpose hash (MD5/SHA family) instead of password_hash().'),
  R('PHP-DB-003', 'Password salts are reused', 'CWE-760', 'A04', 'A02', 'medium', 'cryptography#password-storage', 'crypto',
    'Several rows share the same salt value.'),
  R('PHP-INI-001', 'PHP configured to show errors to visitors', 'CWE-209', 'A02', 'A05', 'medium', 'misconfiguration#error-handling', 'misconfig',
    'display_errors is on in php.ini, so warnings with file paths and code details reach the browser.'),
  R('PHP-INI-002', 'PHP allows including code from URLs', 'CWE-98', 'A02', 'A05', 'high', 'misconfiguration#php-ini', 'misconfig',
    'allow_url_include lets include and require load and run code from remote URLs.'),
  R('PHP-INI-003', 'PHP version announced in responses', 'CWE-200', 'A02', 'A05', 'low', 'misconfiguration#information-disclosure', 'misconfig',
    'expose_php adds the PHP version to every response (X-Powered-By header).'),
  R('PHP-INI-004', 'Weak PHP session settings', 'CWE-1004', 'A07', 'A07', 'medium', 'authentication#session-cookies', 'auth',
    'php.ini lets scripts read the session cookie or accepts session ids the server did not create.'),
  R('PHP-INI-005', 'PHP hardening options not used', 'CWE-1188', 'A02', 'A05', 'low', 'misconfiguration#php-ini', 'misconfig',
    'Optional php.ini restrictions (open_basedir, disable_functions, allow_url_fopen) are not used.'),

  // dependencies, secrets and live checks (shared with other language plugins)
  ...commonRules(R),
];

const BY_ID = new Map(RULES.map((r) => [r.id, r]));

function rule(id) {
  const r = BY_ID.get(id);
  if (!r) throw new Error(`unknown rule ${id}`);
  return r;
}

module.exports = { RULES, rule, PDF, OWASP_2025 };
