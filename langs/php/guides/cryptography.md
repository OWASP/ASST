# Cryptographic failures (A04:2025)

Sensitive data must be protected in transit (HTTPS) and at rest (proper password hashing, encryption with keys stored separately).

## Password storage {#password-storage}

Fast hashes (MD5, SHA-1, SHA-256, SHA-512), even with a salt, can be tried billions of times per second on a GPU. Store passwords only with PHP's password API, which uses bcrypt or Argon2id with a random salt and a work factor:

```php
// Registration
$hash = password_hash($password, PASSWORD_DEFAULT);   // or PASSWORD_ARGON2ID

// Login
if (password_verify($password, $row['password_hash'])) {
    if (password_needs_rehash($row['password_hash'], PASSWORD_DEFAULT)) {
        // store password_hash($password, PASSWORD_DEFAULT) again
    }
    // logged in
}
```

- Use a `VARCHAR(255)` column; the hash already contains its salt, so no separate salt column is needed.
- To migrate old MD5/SHA hashes, verify the old hash at the next login and store a `password_hash()` value instead.
- An optional server-side secret ("pepper") can be applied with `hash_hmac()` before `password_hash()`, with the key kept outside the database.

References: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

## Random values for security {#randomness}

`rand()`, `mt_rand()`, `uniqid()`, `lcg_value()` and `microtime()` are predictable. Tokens for password resets, sessions, CSRF protection or API keys must come from a cryptographically secure generator:

```php
$token = bin2hex(random_bytes(32));   // 64 hex characters
$code  = random_int(100000, 999999);  // numeric one-time code
```

Store only a hash of long-lived tokens (for example `hash('sha256', $token)`), and give them an expiry time.

## Comparing secrets {#comparisons}

`==` converts types: `"0e123" == "0e456"` is true, and comparing a string with an array can behave unexpectedly. It also returns faster on the first different character, which can leak information.

```php
// Vulnerable
if ($_POST['token'] == $_SESSION['token']) { ... }

// Fixed
if (hash_equals($_SESSION['token'], (string) ($_POST['token'] ?? ''))) { ... }
```

Use `password_verify()` for passwords, `hash_equals()` for tokens and signatures, and `===` for other comparisons.

## HTTPS everywhere {#https}

Serve the whole site over HTTPS and redirect plain HTTP. With Apache, in the web root `.htaccess`:

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
</IfModule>
```

- Enable only TLS 1.2 and TLS 1.3 on the server. Free certificates are available from Let's Encrypt.
- Load scripts, styles, images and API endpoints with `https://` URLs only.
- Mark cookies as `Secure` (`session.cookie_secure=1`).
- Encrypt sensitive data at rest (for example with `sodium_crypto_secretbox()`), and keep the keys outside the code and the database.

References: [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html), [OWASP HSTS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html).
