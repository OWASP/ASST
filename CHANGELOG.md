# Changelog

All notable changes to OWASP ASST are documented in this file.

## [2.0.0] - Unreleased

ASST 2.0 is a major upgrade built on the foundation of the original thesis release.

### Added
- Benchmark harness (`npm run bench`) that measures precision, recall and F1 per CWE on labeled PHP datasets: the ASST fixture corpus, DVWA, and the NIST SARD PHP Vulnerability Test Suite (42,212 cases), plus throughput on WordPress core.
- Fixture corpus of vulnerable and safe PHP code samples covering 25 CWEs, used as ground truth for automated tests.
- Automated test suite (`npm test`) and continuous integration on Windows, Linux and macOS with Node.js 18, 20, 22 and 24, including a check that the documented XAMPP installation layout keeps working.

## [1.0.0] - Original thesis release

- Source-code security scanner for PHP/MySQL web projects, organized around the OWASP Top 10 categories.
- HTML report that points to the file and line of each finding and links to a remediation guide explaining the attack and how to prevent it.
- Eleven remediation guides (PDF/DOCX) covering injection, authentication, sensitive data exposure, XXE, security misconfiguration, XSS, vulnerable components, CSRF, SSRF and additional hardening.
- Server checks for PHP, XML parser and MySQL versions, and database checks for password storage.
- Installation guides and video walkthroughs for Windows, Ubuntu and macOS.
