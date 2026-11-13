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
  ];
}

module.exports = { commonRules };
