# Security logging and alerting failures (A09:2025)

Attacks often go unnoticed for months because nothing is logged, or because nobody is alerted. Log security-relevant events and act on them:

- logins, failed logins and logouts
- password and permission changes
- access-control failures
- input-validation failures
- server errors

Each event should record a timestamp, user id, IP address and request id. Never log passwords, tokens, session ids or full card numbers.

- Send logs to a central place that the web application cannot modify.
- Alert on spikes, such as many failed logins or errors.
- Keep logs long enough to investigate incidents.

## Log injection {#log-injection}

Line breaks in logged user input let attackers forge log entries or break log parsers.

```php
// Vulnerable
error_log('Login failed for ' . $_POST['username']);

// Fixed: remove line breaks, or log structured data
$user = str_replace(["\r", "\n"], ' ', (string) ($_POST['username'] ?? ''));
error_log('Login failed for ' . $user);

error_log(json_encode(['event' => 'login_failed', 'user' => $_POST['username'] ?? null]));
```

References: [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).
