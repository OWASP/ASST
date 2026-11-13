# Changelog

All notable changes to OWASP ASST are documented in this file.

## [2.0.0] - Unreleased

ASST 2.0 is a major upgrade built on the foundation of the original thesis release.

### Added

- Command-line options (`node main.js --help`): choose the folder to scan (`--path`), report location (`--out`), exclusions (`--exclude`), dependency folders (`--include-vendor`), PHP binary (`--php-bin`), skip database checks (`--no-db`), quiet and no-color modes. Running `node main.js` without options works exactly as before.
- `.asstignore` file and `EXCLUDE_PATHS` setting to skip paths; `YOUR_WEBAPP_DBMS_PORT` setting; `ASST_DB_PASSWORD` (and `ASST_DB_HOST`, `ASST_DB_USER`, `ASST_DB_NAME`, `ASST_DB_PORT`, `ASST_PHP_BIN`) environment variables so credentials do not have to be stored in a file.
- Benchmark harness (`npm run bench`) that measures precision, recall and F1 per CWE on labeled PHP datasets: the ASST fixture corpus, DVWA, and the NIST SARD PHP Vulnerability Test Suite (42,212 cases), plus throughput on WordPress core.
- Fixture corpus of vulnerable and safe PHP code samples covering 25 CWEs, used as ground truth for automated tests.
- Automated test suite (`npm test`) and continuous integration on Windows, Linux and macOS with Node.js 18, 20, 22 and 24, including a check that the documented XAMPP installation layout keeps working.

### Improved

- About 10x faster scans: the project tree is walked once and every file is read once per scan (NIST SARD sample: 97 s to 9 s; DVWA: 10 s to 1 s).
- Dependency folders (`vendor/`, `node_modules/`, `bower_components/`) and version-control folders are skipped by default.
- Paths are resolved relative to the ASST folder: ASST can be started from any directory, the folder may keep the name `ASST-main`, and `DEFAULT_PROJECT_PATH_TO_SCAN` accepts absolute paths on every operating system.
- The report is a complete, HTML-escaped document, and its links to the remediation guides are standard `file://` URLs that open on Windows, Linux and macOS.
- Database checks use a single connection, escaped identifiers and aggregate queries, and only ever read the length and prefix of stored password hashes, never the hashes themselves. MySQL 8 authentication is supported.
- A missing PHP binary or an unreachable database now produces a short note in the summary and the rest of the scan continues.

### Changed

- Requires Node.js 18 or newer. Older versions get a clear message pointing to the current LTS release and to ASST v1.0.0.
- Dependencies: `colors` and `sync-mysql` were replaced by `mysql2` and Node.js built-ins.

### Compatibility

- `config.js` and `config_php_lang.js` files from v1.0 work unchanged; all existing settings keep their meaning.

## [1.0.0] - Original thesis release

- Source-code security scanner for PHP/MySQL web projects, organized around the OWASP Top 10 categories.
- HTML report that points to the file and line of each finding and links to a remediation guide explaining the attack and how to prevent it.
- Eleven remediation guides (PDF/DOCX) covering injection, authentication, sensitive data exposure, XXE, security misconfiguration, XSS, vulnerable components, CSRF, SSRF and additional hardening.
- Server checks for PHP, XML parser and MySQL versions, and database checks for password storage.
- Installation guides and video walkthroughs for Windows, Ubuntu and macOS.
