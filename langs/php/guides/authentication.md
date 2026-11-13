# Authentication failures (A07:2025)

Weak login, session and credential handling lets attackers take over accounts through stolen or guessed passwords, fixed sessions or exposed secrets.

Good practice for every login system:

- Store passwords with `password_hash()` and check them with `password_verify()`.
- Limit failed logins per account and per IP address, and add increasing delays. A CAPTCHA can help as an extra measure.
- Offer multi-factor authentication, at least for administrators.
- Reject very short and commonly breached passwords, following [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).
- Change all default credentials.
- Make password-reset tokens random, single-use and short-lived.

## Session fixation {#session-fixation}

If the session id is not changed at login, an attacker who planted a known session id in the victim's browser shares the logged-in session.

```php
if ($user && password_verify($_POST['password'], $user['password_hash'])) {
    session_regenerate_id(true);       // new id, old session deleted
    $_SESSION['user_id'] = $user['id'];
}
```

Set safe session options before `session_start()`, or in php.ini:

```php
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,
    'httponly' => true,
    'samesite' => 'Lax',
]);
ini_set('session.use_strict_mode', '1');
session_start();
```

Destroy the session on logout (`session_destroy()` after clearing `$_SESSION`), and expire idle sessions.

References: [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

## Credentials in source code {#credentials}

Passwords and API keys written in PHP files end up in version control, backups and anyone's copy of the code.

```php
// Vulnerable
$db = new mysqli('db.internal', 'shop_app', 'Pr0d-Passw0rd!', 'shop');

// Fixed: read from the environment (or a config file outside the web root)
$db = new mysqli(getenv('DB_HOST'), getenv('DB_USER'), getenv('DB_PASS'), getenv('DB_NAME'));
```

- Use separate credentials for development and production.
- Give the database user only the permissions the application needs.
- Rotate any secret that has been committed to a repository.
