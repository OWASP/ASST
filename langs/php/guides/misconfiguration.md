# Security misconfiguration (A02:2025)

Default settings, verbose errors, forgotten files and missing hardening give attackers information and footholds. XML external entities belong to this category too.

## Error handling {#error-handling}

Error messages shown to visitors reveal paths, queries and versions. In production:

```ini
; php.ini
display_errors = Off
display_startup_errors = Off
log_errors = On
error_log = /var/log/php/error.log
error_reporting = E_ALL
expose_php = Off
```

Do not switch `display_errors` on from code (`ini_set('display_errors', '1')`). Log errors, and show users a generic error page.

## Information disclosure {#information-disclosure}

`phpinfo()` prints the full PHP configuration, environment variables and paths. Remove `phpinfo.php`, `info.php` and test scripts from deployed sites, and hide version banners (`expose_php = Off`, `ServerTokens Prod` in Apache).

## XML external entities (XXE) {#xxe}

Since libxml 2.9 (all supported PHP versions), external entities are not loaded unless the code asks for it. The risky part is the parser options:

```php
// Vulnerable: entity substitution and DTD loading switched on
$doc->loadXML($xml, LIBXML_NOENT | LIBXML_DTDLOAD);

// Fixed: default options
$doc = new DOMDocument();
$doc->loadXML($xml, LIBXML_NONET);
```

- Do not use `LIBXML_NOENT`, `LIBXML_DTDLOAD` or `LIBXML_DTDATTR` with untrusted XML.
- Do not set `$doc->substituteEntities = true`.
- `libxml_disable_entity_loader()` is deprecated since PHP 8.0 and is only needed on very old libxml versions.
- Keep PHP and libxml up to date. Prefer JSON when you control the data format.

References: [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html).

## Files that should not be published {#exposed-files}

Everything inside the web root can be downloaded:

- database dumps (`.sql`)
- backups (`.zip`, `.bak`, `~`)
- environment files (`.env`)
- keys
- logs
- `.git` folders

- Deploy only the files the site needs. Keep backups, dumps and keys outside the web root.
- Point the web server at a `public/` folder, so `composer.json`, `vendor/` and configuration stay one level above it.
- Deny access to dot-files with Apache:

```apache
<FilesMatch "^\.">
    Require all denied
</FilesMatch>
RedirectMatch 404 /\.git
```

## Directory listing {#directory-listing}

Folders without an index file are listed by Apache unless listing is switched off. Add this to the web root `.htaccess`, using an ASCII hyphen:

```apache
Options -Indexes
```

With nginx, listing is off unless `autoindex on;` is set.

Recommended response headers:

```apache
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Content-Security-Policy "default-src 'self'; frame-ancestors 'self'"
```

References: [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html).

## Framework debug mode {#debug-mode}

Debug pages (Laravel/Ignition, Symfony profiler, WordPress `WP_DEBUG_DISPLAY`) show stack traces, configuration, environment variables and sometimes allow code execution. Keep them off in production:

```ini
# Laravel .env (production)
APP_ENV=production
APP_DEBUG=false
```

```php
// WordPress wp-config.php (production)
define('WP_DEBUG', false);
define('WP_DEBUG_DISPLAY', false);
define('WP_DEBUG_LOG', true); // if logging is needed
```

Never deploy `.env` files inside the web root, and never commit production `.env` files.
