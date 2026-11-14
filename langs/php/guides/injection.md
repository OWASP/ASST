# Injection (A05:2025)

Injection happens when untrusted data is sent to an interpreter (SQL, the shell, PHP itself, LDAP, XPath) as part of a command or query. The fix is always the same idea: keep code and data apart, and validate data against what is allowed.

## SQL injection {#sql-injection}

Building a query by inserting request data into the SQL text lets an attacker change the query:

```php
// Vulnerable
$id = $_GET['id'];
$result = mysqli_query($con, "SELECT * FROM products WHERE id = $id");
```

Use prepared statements. The query is sent first and the values separately, so they can never change its structure:

```php
// PDO
$stmt = $pdo->prepare('SELECT * FROM products WHERE id = ?');
$stmt->execute([$_GET['id']]);

// MySQLi
$stmt = $mysqli->prepare('SELECT * FROM products WHERE id = ?');
$stmt->bind_param('i', $_GET['id']);
$stmt->execute();
$result = $stmt->get_result();
```

- With PDO, also set `PDO::ATTR_EMULATE_PREPARES => false` and `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`.
- Table and column names cannot be parameters: map user choices to a fixed list (`$columns = ['name', 'price']; $col = in_array($sort, $columns, true) ? $sort : 'name';`).
- Escaping functions such as `mysqli_real_escape_string()` only protect values inside quotes and are easy to misuse; prefer parameters.

References: [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [PHP manual: prepared statements](https://www.php.net/manual/en/pdo.prepared-statements.php).

## OS command injection {#command-injection}

Passing request data to `system()`, `exec()`, `shell_exec()`, `passthru()`, `popen()`, `proc_open()` or the backtick operator lets an attacker append their own commands (`; rm -rf /`).

```php
// Vulnerable
$out = shell_exec('ping -c 4 ' . $_POST['host']);
```

Prefer a PHP function or library over a shell command. If a command is unavoidable, validate the input strictly and escape every argument on its own:

```php
$host = $_POST['host'] ?? '';
if (!filter_var($host, FILTER_VALIDATE_IP)) {
    http_response_code(400);
    exit;
}
$out = shell_exec('ping -c 4 ' . escapeshellarg($host));

// PHP 7.4+: no shell at all
$process = proc_open(['ping', '-c', '4', $host], [1 => ['pipe', 'w']], $pipes);
```

`escapeshellcmd()` on a whole command line still allows extra arguments to be injected; use `escapeshellarg()` per argument.

References: [OWASP OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html).

## Code injection {#code-injection}

`eval()`, `assert()` with a string, `create_function()` and `preg_replace()` with the `/e` modifier execute PHP code. Request data in that code is remote code execution. Calling a function whose name comes from the request (`$_GET['action']()`, `call_user_func($_GET['f'])`) is similar.

```php
// Vulnerable
eval('$total = ' . $_GET['expression'] . ';');
call_user_func($_GET['action']);
```

Remove `eval()`; parse the input instead. For dynamic actions, map names to functions explicitly:

```php
$actions = ['list' => 'listItems', 'show' => 'showItem'];
$name = $_GET['action'] ?? 'list';
if (!isset($actions[$name])) {
    http_response_code(404);
    exit;
}
$actions[$name]();
```

## File inclusion {#file-inclusion}

`include`, `require`, `include_once` and `require_once` execute the file they load. When the file name comes from the request, an attacker can run other scripts on the server, read files (`../../etc/passwd`) or, with `allow_url_include`, remote code.

```php
// Vulnerable
include 'pages/' . $_GET['page'] . '.php';
```

Map the request to a fixed list of files:

```php
$pages = ['home' => 'home.php', 'about' => 'about.php'];
$page = $pages[$_GET['page'] ?? 'home'] ?? 'home.php';
include __DIR__ . '/pages/' . $page;
```

Keep `allow_url_include=Off` (the default) in php.ini.

## LDAP injection {#ldap-injection}

Inserting request data into an LDAP filter lets attackers add wildcards (`*`) or extra conditions (`)(uid=*`).

```php
// Vulnerable
$filter = '(uid=' . $_GET['user'] . ')';

// Fixed
$filter = '(uid=' . ldap_escape($_GET['user'], '', LDAP_ESCAPE_FILTER) . ')';
$sr = ldap_search($ds, 'dc=example,dc=com', $filter);
```

Use `LDAP_ESCAPE_DN` when the value is part of a distinguished name.

References: [OWASP LDAP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/LDAP_Injection_Prevention_Cheat_Sheet.html).

## XPath injection {#xpath-injection}

XPath has no escape character, so quotes in user input end the string literal: `//user[name='' or '1'='1']`.

```php
// Vulnerable
$result = $xml->xpath("//user[name='" . $_GET['name'] . "']");
```

Validate the value against an allow-list pattern before using it, and reject anything containing quotes or brackets:

```php
$name = $_GET['name'] ?? '';
if (!preg_match('/^[A-Za-z0-9_.-]{1,64}$/', $name)) {
    http_response_code(400);
    exit;
}
$result = $xml->xpath("//user[name='$name']");
```

`addslashes()` does not help here, because XPath does not treat backslashes as escapes.

## Header and mail injection {#header-injection}

Line breaks (`\r\n`) in values used for HTTP or mail headers can add new headers (for example extra recipients). PHP's `header()` rejects multi-line values, but `mail()` headers and custom protocols do not.

```php
// Vulnerable
mail($to, $subject, $body, 'From: ' . $_POST['email']);

// Fixed: validate first
$from = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
if ($from === false) {
    http_response_code(400);
    exit;
}
mail($to, $subject, $body, ['From' => 'noreply@example.com', 'Reply-To' => $from]);
```

Do not pass request data in the fifth `mail()` parameter (sendmail options).

## NoSQL injection {#nosql-injection}

With MongoDB, request arrays such as `?user[$ne]=x` turn into query operators. Accept only strings for values compared in queries:

```php
$user = $_GET['user'] ?? '';
if (!is_string($user)) {
    http_response_code(400);
    exit;
}
$doc = (new MongoDB\Client())->shop->users->findOne(['username' => $user]);
```

Never build `$where` JavaScript expressions from request data.
