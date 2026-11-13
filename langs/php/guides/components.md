# Software supply chain failures (A03:2025)

Applications inherit the vulnerabilities of everything they run on and include: PHP itself, the database server, the web server, Composer and npm packages, and copied JavaScript libraries.

## Runtime versions {#runtime-versions}

Run PHP, MySQL/MariaDB and the web server on versions that still receive security fixes:

- [PHP supported versions](https://www.php.net/supported-versions.php)
- [MySQL](https://endoflife.date/mysql) and [MariaDB](https://endoflife.date/mariadb) lifecycles

Check the PHP version on the server:

```bash
php -v
php -r "echo LIBXML_DOTTED_VERSION;"
```

Plan upgrades before the end-of-life date. Each PHP release has migration notes in the manual.

## Dependencies {#dependencies}

- Install packages only from trusted sources, and commit the lock files (`composer.lock`, `package-lock.json`).
- Check them for known vulnerabilities regularly:

```bash
composer audit
npm audit
```

- Enable automated update pull requests (for example Dependabot or Renovate), and remove packages you no longer use.
- Keep copied front-end libraries (jQuery, Bootstrap, ...) up to date, or load them from your package manager instead of copying them.
- Generate a software bill of materials (SBOM, for example CycloneDX) for releases.

References: [OWASP Vulnerable Dependency Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html), [OSV.dev](https://osv.dev/).
