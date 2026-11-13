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
- Upgrade frameworks and libraries whose release line has reached end of life (for example jQuery 1.x/2.x, Bootstrap 3, AngularJS, Vue 2, or an unsupported Laravel/Symfony major version). They no longer receive fixes even when new vulnerabilities are found.
- Deploy without development packages. Test and debugging tools such as PHPUnit have been used to run code on servers where they were left in the web root:

```bash
composer install --no-dev --optimize-autoloader
```

- Replace packages that their maintainers marked as abandoned (`composer outdated` and `composer audit` show them).
- Generate a software bill of materials (SBOM, for example CycloneDX) for releases.

ASST lists the packages from `composer.lock`, `package-lock.json` and `yarn.lock`, plus the JavaScript libraries copied into the project. Advisories for common front-end libraries ship with ASST. Run the scan with `--online` to check every package against [OSV.dev](https://osv.dev/). Only package names and versions are sent, and answers are cached for a day.

References: [OWASP Vulnerable Dependency Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html), [OSV.dev](https://osv.dev/).
