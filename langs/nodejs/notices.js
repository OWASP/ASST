'use strict';
/*
 * Manual-review notes for Node.js applications: practices that cannot be verified from
 * source code alone. They are listed at the end of every report.
 */
module.exports = [
  { kind: 'review', title: 'A01:2025 Broken Access Control', message: 'Check that every route and API endpoint verifies the logged-in user\'s permissions on the server (middleware on the router, not only in the front end), and that ids in URLs or bodies cannot be changed to reach other users\' data.', guide: 'access-control' },
  { kind: 'review', title: 'A06:2025 Insecure Design', message: 'Limit request rates and body sizes (express-rate-limit, express.json({ limit })), validate every request body against a schema (zod, joi, ajv), and review business flows such as password reset and payments for abuse cases.', guide: 'injection' },
  { kind: 'review', title: 'A07:2025 Authentication Failures', message: 'Hash passwords with bcrypt, scrypt or argon2, limit failed logins, offer multi-factor authentication for administrators, expire idle sessions and rotate the session id after login (req.session.regenerate).', guide: 'authentication' },
  { kind: 'review', title: 'A09:2025 Security Logging & Alerting Failures', message: 'Log logins, failed logins, access-control failures and server errors with a structured logger (without passwords or tokens), and make sure someone is alerted when they spike.', guide: 'misconfiguration' },
  { kind: 'review', title: 'A10:2025 Mishandling of Exceptional Conditions', message: 'Use an error-handling middleware that logs the error and returns a generic message, run with NODE_ENV=production, and handle rejected promises so a single failing request cannot stop the process.', guide: 'misconfiguration' },
  { kind: 'review', title: 'A03:2025 Software Supply Chain Failures', message: 'Commit package-lock.json, install with npm ci, run npm audit regularly, review new dependencies before adding them, and keep Node.js on a supported LTS release.', guide: 'components' },
];
