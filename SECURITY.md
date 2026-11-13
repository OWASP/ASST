# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 2.x | Yes |
| 1.0.x (original thesis release) | Please upgrade to 2.x |

## Reporting a vulnerability in ASST

Please report vulnerabilities in ASST itself privately, through GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability** (https://github.com/OWASP/ASST/security/advisories/new).

Please include the ASST version (`node main.js --version`), the Node.js version, the steps or input that trigger the problem, and its impact. We aim to answer within a week and to publish a fix and an advisory once it is available. Thank you for helping keep ASST and its users safe.

Findings that ASST reports in *your* code are not vulnerabilities in ASST. A wrong or missing finding is welcome as a regular issue, ideally with a small code sample.

## What ASST does on your machine

ASST is designed to be safe to run on development machines and servers:

- **Files:** it reads the project folder you point it to and writes the reports (and, with `--online`, a cache in `.asst-cache/`). It never changes the scanned project.
- **Programs:** it runs the configured PHP binary with a fixed `php -r` snippet to read the PHP version, libxml version and php.ini settings. No shell is involved and no project code is executed.
- **Database:** only when `IS_DBMS_USED` is true. It connects with the configured account and reads the server version, plus the length and the first seven characters of stored password hashes to recognize their format. It never reads the hashes themselves; a read-only database user is enough.
- **Network:** none by default.
  - `--online` sends package names and versions to OSV.dev and product names to endoflife.date.
  - `--url` sends at most 60 read-only GET/HEAD requests to the site you name, to localhost and private networks only unless `--allow-remote` is given.
- **Reports:** secrets found in the code are masked in every report format; response bodies from live checks are never copied into reports.
