'use strict';
/*
 * Rules shared by every language plugin: dependencies (software supply chain) and
 * secrets. Plugins add them to their registry with their own guide/PDF locations.
 */

/** @param {(id,title,cwe,a2025,a2021,severity,guide,pdfKey,summary) => object} R the plugin's rule factory */
function commonRules(R) {
  return [
    R('DEP-001', 'Component with known vulnerabilities', 'CWE-1395', 'A03', 'A06', 'high', 'components#dependencies', 'components',
      'A third-party package or bundled library has published security advisories for the version in use. Upgrade to a fixed version.'),
    R('DEP-002', 'Component is end of life', 'CWE-1104', 'A03', 'A06', 'medium', 'components#dependencies', 'components',
      'The component version no longer receives security fixes. Plan an upgrade to a supported release.'),
    R('DEP-003', 'Development packages installed in production', 'CWE-1104', 'A02', 'A05', 'medium', 'components#dependencies', 'components',
      'Composer installed require-dev packages (test and debug tools) in this deployment. Deploy with composer install --no-dev.'),
    R('DEP-004', 'Abandoned package', 'CWE-1104', 'A03', 'A06', 'low', 'components#dependencies', 'components',
      'The package is marked as abandoned by its maintainers and will not receive fixes. Move to the suggested replacement.'),
    R('SECRET-001', 'Secret in source code', 'CWE-798', 'A07', 'A07', 'high', 'authentication#secrets', 'auth',
      'A password, API key, token or private key is stored in a project file. Move it to the environment or a secrets manager and rotate it.'),

    // opt-in live checks against the running site (--url)
    R('LIVE-HDR-001', 'Security headers missing', 'CWE-693', 'A02', 'A05', 'low', 'misconfiguration#security-headers', 'hardening',
      'The site does not send browser security headers such as Content-Security-Policy, X-Content-Type-Options or frame protection.'),
    R('LIVE-INFO-001', 'Server software versions disclosed', 'CWE-200', 'A02', 'A05', 'low', 'misconfiguration#information-disclosure', 'misconfig',
      'Response headers or error pages announce web server and PHP versions, which helps attackers pick matching exploits.'),
    R('LIVE-COOKIE-001', 'Cookie without security attributes', 'CWE-1004', 'A02', 'A05', 'medium', 'authentication#session-cookies', 'auth',
      'A cookie is set without HttpOnly, Secure or SameSite, so scripts, plain-HTTP requests or other sites can use it.'),
    R('LIVE-TLS-001', 'HTTP is not redirected to HTTPS', 'CWE-319', 'A04', 'A02', 'medium', 'cryptography#https', 'crypto',
      'The site answers over plain HTTP although HTTPS is available, so passwords and cookies can travel unencrypted.'),
    R('LIVE-CORS-001', 'Cross-origin requests allowed from any site', 'CWE-942', 'A01', 'A01', 'medium', 'access-control#cors', 'hardening',
      'The server copies any Origin into Access-Control-Allow-Origin, so other websites can read its responses in a visitor\'s browser.'),
    R('LIVE-LIST-001', 'Directory listing enabled', 'CWE-548', 'A02', 'A05', 'medium', 'misconfiguration#directory-listing', 'misconfig',
      'The web server lists the files of folders that have no index page.'),
    R('LIVE-FILE-001', 'Sensitive file can be downloaded', 'CWE-538', 'A02', 'A05', 'high', 'misconfiguration#exposed-files', 'hardening',
      'A file that should not be public (backup, database dump, environment file, version-control data) is served by the web server.'),
    R('LIVE-ERR-001', 'Error details shown in responses', 'CWE-209', 'A02', 'A05', 'medium', 'misconfiguration#error-handling', 'misconfig',
      'Pages show PHP warnings or stack traces with file paths and code details.'),
  ];
}

module.exports = { commonRules };
