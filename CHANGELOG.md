# Changelog

All notable changes to OWASP ASST are documented in this file.

## [2.0.0] - Unreleased

ASST 2.0 is a major upgrade built on the foundation of the original thesis release.

### Added

- Data-flow (taint) analysis for PHP. Every PHP file is parsed, and user input is followed from request sources to dangerous functions through variables, arrays, string building, `sprintf`, functions, methods and classes. Sanitizers and validation checks are understood per output context: SQL quoting, HTML text/attribute/script/URL, shell quoting, LDAP filters, XPath, file paths and URLs. Each finding shows the data-flow trace from source to sink.
- New detections: server-side request forgery, open redirect, path traversal, XPath injection, insecure deserialization, variable extraction (`extract`/`parse_str`), log and mail-header injection, code injection through `eval`/`assert`/`create_function`, unsafe dynamic calls, execution after redirect, weak password hashing, predictable random tokens, loose comparison of secrets, session fixation, hard-coded credentials, errors and `phpinfo()` shown to visitors, database error disclosure, DOM-based XSS and JavaScript `eval`, and version-control folders, backups, keys and dumps inside the web root.
- Remediation guides in Markdown (`langs/php/guides/`), one section per rule, written for current PHP 8 practice and the OWASP Top 10:2025. The relevant section is shown under each finding in the HTML report and used as rule help in SARIF.
- Cross-file analysis: `include`/`require` targets are resolved (including `__DIR__`, `define()`d paths and file names chosen in a `switch`) and run in the including scope, and functions and classes are resolved across the whole project. A vulnerability inside a shared helper lists the entry scripts that reach it.
- Framework packs for Laravel, WordPress and Symfony, detected automatically. Framework request objects, escaping helpers (`e()`, `esc_html()`, `esc_attr()`, `esc_url()`, `absint()`, `sanitize_*()`), query builders, `$wpdb` and HTTP clients are part of the data-flow analysis. New checks cover raw Blade (`{!! !!}`) and Twig (`|raw`, `autoescape false`) output, mass assignment (`$guarded = []` with `create($request->all())`), debug mode in `.env`, `config/app.php` and `wp-config.php`, CSRF exemptions in `VerifyCsrfToken`, `$wpdb` queries built without `prepare()`, and WordPress AJAX/admin-post handlers without nonce and capability checks. CSRF checks recognize `@csrf`, `csrf_field()`, `wp_nonce_field()` and Symfony `csrf_token()`. The report header lists the detected frameworks.
- Callback-aware data flow for `array_map()` with built-in callbacks such as `intval` or `htmlspecialchars`.
- Software supply chain checks. Every report gets a Components section listing:
  - the dependencies from `composer.lock`, `package-lock.json` (v1–v3) and `yarn.lock`;
  - JavaScript libraries copied into the project: jQuery, jQuery UI, Bootstrap, AngularJS, Lodash, Underscore, Moment.js, Handlebars, Vue, DOMPurify, TinyMCE and Knockout.

  Published advisories for these libraries ship with ASST. With `--online` (or `ONLINE_CHECKS: true`), every package is checked against OSV.dev. Only package names and versions are sent, and answers are cached for a day.
- End-of-life checks for frameworks and libraries: Laravel, Symfony, Drupal, WordPress, jQuery, Bootstrap, AngularJS and Vue. Also new: detection of development packages installed in a production `vendor/` folder, and of abandoned Composer packages.
- Secrets detection covers:
  - API keys and tokens with well-known formats: AWS, GitHub, GitLab, Slack, Stripe, Google, SendGrid, npm, OpenAI and Anthropic;
  - private keys and JSON Web Tokens;
  - passwords in connection URLs;
  - password, secret and key assignments in code, `.env` files and configuration files.

  Secrets are masked everywhere in the reports, including the code snippets of other findings.
- `npm run update-data` refreshes the bundled lifecycle and advisory data. `--online` also refreshes lifecycle dates from endoflife.date during a scan.
- Opt-in live checks of the running site with `--url http://localhost/YourProject/` (or `LIVE_SCAN_URL`). They report:
  - missing security headers, version banners, and cookies without HttpOnly/Secure/SameSite;
  - plain HTTP when HTTPS is available, and CORS origin reflection;
  - PHP error output and directory listings;
  - whether backups, dumps, `.env` files, `.git` data and manifests found by the static scan can actually be downloaded. Confirmed files are raised to critical.

  The checks are read-only: GET and HEAD requests only, at most 60 requests at five per second, no cookies or form submissions, and no response content copied into reports. Only localhost and private networks are contacted, unless `--allow-remote` is given for a site you are authorized to test.
- php.ini audit through the configured PHP binary. It covers:
  - `display_errors`, `expose_php` and `allow_url_include`;
  - session cookie and session id settings (`HttpOnly`, `SameSite`, `Secure`, `use_strict_mode`);
  - optional hardening: `open_basedir`, `disable_functions`, `allow_url_fopen`, `zend.assertions`.
- When ASST runs from an XAMPP `htdocs` folder, the report suggests the matching `--url` for the live checks.
- Findings are mapped to the OWASP Top 10:2025 (with the 2021 category) and to CWE, and carry a severity, a confidence level and a code snippet.
- Interactive HTML report: one self-contained file that works offline, with severity tiles, search, filters (severity, confidence, OWASP category), grouping by category/file/rule, code snippets with the line highlighted, data-flow traces, dark mode and print layout. Content is fully HTML-escaped and protected by a strict Content-Security-Policy.
- SARIF 2.1.0 output (`--format sarif`) for GitHub code scanning and IDE viewers, with CWE/OWASP tags, security-severity scores, stable fingerprints and data-flow code flows.
- Markdown summary (`--format md`) for pull-request comments and CI job summaries.
- JSON report (`--format json`) with a versioned schema.
- Baseline comparison: `--update-baseline` records the current findings, and `--baseline` marks later findings as new or unchanged and lists fixed ones in every report format.
- Up-to-date lifecycle data (`data/eol.json`) for PHP, MySQL, MariaDB, Node.js and the frameworks and libraries above; stored passwords are classified by hash format (bcrypt/argon2, fast hashes, plain text) and the database server version is checked against its support dates.
- New options: `--second-order` (treat session data, files, database rows and command output as untrusted), `--min-severity`, `--min-confidence`, `--fail-on` for CI, `--rules`/`--disable-rules`, `--baseline`/`--update-baseline`, and inline `asst-ignore[RULE-ID]` comments.
- Command-line options (`node main.js --help`): choose the folder to scan (`--path`), report location (`--out`), exclusions (`--exclude`), dependency folders (`--include-vendor`), PHP binary (`--php-bin`), skip database checks (`--no-db`), quiet and no-color modes. Running `node main.js` without options works exactly as before.
- `.asstignore` file and `EXCLUDE_PATHS` setting to skip paths; `YOUR_WEBAPP_DBMS_PORT` setting; `ASST_DB_PASSWORD` (and `ASST_DB_HOST`, `ASST_DB_USER`, `ASST_DB_NAME`, `ASST_DB_PORT`, `ASST_PHP_BIN`) environment variables so credentials do not have to be stored in a file.
- Benchmark harness (`npm run bench`) that measures precision, recall and F1 per CWE on labeled PHP datasets: the ASST fixture corpus, DVWA, and the NIST SARD PHP Vulnerability Test Suite (42,212 cases), plus throughput on WordPress core.
- Fixture corpus of vulnerable and safe PHP code samples covering 25 CWEs, used as ground truth for automated tests.
- Automated test suite (`npm test`) and continuous integration on Windows, Linux and macOS with Node.js 18, 20, 22 and 24, including a check that the documented XAMPP installation layout keeps working.

### Improved

- SQL injection detection follows queries built over several lines and inside functions, and recognizes prepared statements, escaping inside quotes and numeric conversions.
- Cross-site scripting detection understands where each value is written in the page (text, quoted or unquoted attribute, event handler, script, URL).
- Command injection detection covers the backtick operator and recognizes `escapeshellarg()` per argument.
- Redirect checks recognize every way a script stops (`exit;`, `die;`, `return`, `throw`).
- CSRF checks focus on POST forms and recognize framework token helpers.
- XML checks focus on the parser options that enable external entities on current PHP versions.
- Benchmark results (see `bench/RESULTS.md`): on the NIST SARD PHP sample, F1 rises from 35.6% to 66.5% while scanning about 15 times faster; on DVWA, F1 rises from 84.6% to 96.3% with 100% precision. WordPress core (1,500 PHP files) is scanned in about 12 seconds.
- DOM-based XSS checks focus on real browser sources (URL, referrer, window name, cross-window messages) and skip minified third-party bundles.
- About 10x faster scans: the project tree is walked once and every file is read once per scan (NIST SARD sample: 97 s to 9 s; DVWA: 10 s to 1 s).
- Dependency folders (`vendor/`, `node_modules/`, `bower_components/`) and version-control folders are skipped by default.
- Paths are resolved relative to the ASST folder: ASST can be started from any directory, the folder may keep the name `ASST-main`, and `DEFAULT_PROJECT_PATH_TO_SCAN` accepts absolute paths on every operating system.
- The report is a complete, HTML-escaped document, and its links to the remediation guides are standard `file://` URLs that open on Windows, Linux and macOS.
- Database checks use a single connection, escaped identifiers and aggregate queries, and only ever read the length and prefix of stored password hashes, never the hashes themselves. MySQL 8 authentication is supported.
- A missing PHP binary or an unreachable database now produces a short note in the summary and the rest of the scan continues.

- The eleven PDF/DOCX guides were revised for PHP 8 and the OWASP Top 10:2025, covering prepared statements with PDO settings, per-argument shell escaping, context-aware output encoding, `password_hash()`-based password storage, HTTPS and HSTS configuration, current XML parser defaults, SSRF allow-lists, modern MongoDB and logging examples, and links to the 2025 categories.

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
