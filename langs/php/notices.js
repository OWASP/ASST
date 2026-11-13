'use strict';
/*
 * Manual-review notes: important practices that cannot be verified from source code
 * alone. They are listed at the end of every report.
 */
const { PDF } = require('./rules/registry');

module.exports = [
  { kind: 'review', title: 'A01:2025 Broken Access Control', message: 'Check that every page and API endpoint verifies the logged-in user\'s permissions on the server, and that object ids in URLs cannot be changed to reach other users\' data.', guide: 'access-control', pdf: PDF.other },
  { kind: 'review', title: 'A06:2025 Insecure Design', message: 'Review business flows (password reset, payments, sign-up, rate limits) for abuse cases; limit failed logins and other expensive operations per user and IP.', guide: 'design', pdf: PDF.auth },
  { kind: 'review', title: 'A07:2025 Authentication Failures', message: 'Offer multi-factor authentication for privileged accounts, reject breached and very short passwords, expire idle sessions and set session cookies with HttpOnly, Secure and SameSite.', guide: 'authentication', pdf: PDF.auth },
  { kind: 'review', title: 'A09:2025 Security Logging & Alerting Failures', message: 'Log logins, failed logins, access-control failures and server errors (without passwords or tokens), and make sure someone is alerted when they spike.', guide: 'logging', pdf: PDF.other },
  { kind: 'review', title: 'A02:2025 Security Misconfiguration', message: 'In production: display_errors=Off, log_errors=On, expose_php=Off, remove sample and test files, change default credentials, and send security headers (Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, frame-ancestors).', guide: 'misconfiguration', pdf: PDF.misconfig },
  { kind: 'review', title: 'A03:2025 Software Supply Chain Failures', message: 'Keep PHP, the database server and all libraries up to date; review composer.lock with "composer audit" and remove unused packages.', guide: 'components', pdf: PDF.components },
];
