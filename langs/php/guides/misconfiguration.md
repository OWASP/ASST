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

`phpinfo()` prints the full PHP configuration, environment variables and paths. Remove `phpinfo.php`, `info.php` and test scripts from deployed sites, and hide version banners:

```apache
# Apache (httpd.conf or httpd-default.conf)
ServerTokens Prod
ServerSignature Off
```

```ini
; php.ini
expose_php = Off
```

Hiding versions does not fix vulnerabilities, but it stops automated scanners from matching your exact versions to public exploits.

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

## Security headers {#security-headers}

Browsers enforce extra protections when the site asks for them with response headers. With Apache (`mod_headers`), in the virtual host or the web root `.htaccess`:

```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
    Header always set X-Frame-Options "SAMEORIGIN"
    # only on HTTPS sites:
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always unset X-Powered-By
</IfModule>
```

- Start the Content-Security-Policy in report-only mode (`Content-Security-Policy-Report-Only`) to find inline scripts that need to move into files, then enforce it.
- `frame-ancestors` (or `X-Frame-Options`) stops other sites from framing your pages (clickjacking).
- The same headers can be sent from PHP with `header()` before any output.

References: [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).

## PHP configuration (php.ini) {#php-ini}

XAMPP and many development stacks ship a php.ini made for development. PHP itself includes `php.ini-production`, the recommended starting point for servers. Settings worth checking:

```ini
; errors: log them, never show them
display_errors = Off
display_startup_errors = Off
log_errors = On
expose_php = Off

; never load code from URLs
allow_url_include = Off
; only if the application does not open URLs with file functions:
allow_url_fopen = Off

; sessions
session.use_strict_mode = 1
session.use_only_cookies = 1
session.cookie_httponly = 1
session.cookie_samesite = "Lax"
session.cookie_secure = 1        ; when the site uses HTTPS

; optional hardening
open_basedir = "/var/www/site/:/tmp/"
disable_functions = exec,passthru,shell_exec,system,proc_open,popen
zend.assertions = -1
```

- ASST reads php.ini with the PHP command-line binary. The web server can load a different file (`php --ini` and `phpinfo()` show which one is used), so check the server's copy too, then remove any `phpinfo()` page.
- Restart Apache or PHP-FPM after changing php.ini.

References: [PHP manual: php.ini directives](https://www.php.net/manual/en/ini.list.php), [OWASP PHP Configuration Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/PHP_Configuration_Cheat_Sheet.html).

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
