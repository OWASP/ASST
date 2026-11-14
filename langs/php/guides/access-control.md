# Broken access control (A01:2025)

Access control decides who may do what. In the OWASP Top 10:2025 this category also contains server-side request forgery, path traversal, CSRF and open redirects, because they all let an attacker act beyond their permissions.

Check permissions on the server for every request, deny by default, and never trust ids or roles sent by the client.

## Path traversal {#path-traversal}

File functions (`fopen`, `readfile`, `file_get_contents`, `unlink`, `move_uploaded_file`, ...) that receive a path built from request data can be pointed at other files with `../`.

```php
// Vulnerable
readfile('/var/www/invoices/' . $_GET['file']);
```

Keep only the file name and check that the result stays inside the intended folder:

```php
$base = realpath('/var/www/invoices');
$path = realpath($base . '/' . basename($_GET['file'] ?? ''));
if ($path === false || !str_starts_with($path, $base . DIRECTORY_SEPARATOR)) {
    http_response_code(404);
    exit;
}
readfile($path);
```

For uploads, never use the client's file name. Generate one with `bin2hex(random_bytes(16))` and keep uploaded files outside the web root.

## Server-side request forgery {#ssrf}

When the server fetches a URL chosen by the user (`file_get_contents($url)`, cURL, `fsockopen()`, `SoapClient`), attackers can reach internal services, cloud metadata endpoints (`169.254.169.254`) or local files (`file://`).

```php
// Vulnerable
$ch = curl_init($_GET['url']);
```

- Prefer fixed URLs. If users may choose a target, choose it from an allow-list of hosts.
- Allow only `https`, and resolve the host and reject private, loopback and link-local addresses.
- Disable redirects (`CURLOPT_FOLLOWLOCATION => false`) or re-check each redirect target.

```php
$allowed = ['api.example.com'];
$parts = parse_url($_GET['url'] ?? '');
if (($parts['scheme'] ?? '') !== 'https' || !in_array($parts['host'] ?? '', $allowed, true)) {
    http_response_code(400);
    exit;
}
```

References: [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

## Open redirect {#open-redirect}

`header('Location: ' . $_GET['next'])` lets attackers send users from your trusted domain to a phishing site.

Redirect only to relative paths or to an allow-list:

```php
$next = $_GET['next'] ?? '/';
if (!preg_match('#^/(?!/)#', $next)) {   // must start with a single "/"
    $next = '/';
}
header('Location: ' . $next);
exit;
```

## Execution after redirect {#execution-after-redirect}

`header('Location: ...')` only asks the browser to go elsewhere; the script keeps running and its output is still sent. Clients that ignore redirects receive the protected page.

```php
// Vulnerable
if (empty($_SESSION['is_admin'])) {
    header('Location: /login.php');
}
echo $adminDashboard;

// Fixed
if (empty($_SESSION['is_admin'])) {
    header('Location: /login.php');
    exit;
}
```

## Cross-site request forgery (CSRF) {#csrf}

A malicious site can make a logged-in user's browser submit forms to your site. Protect every state-changing request (POST, PUT, DELETE) with a per-session token:

```php
// once per session
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
```

```php
<form method="post" action="transfer.php">
  <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
</form>
```

```php
// when handling the request
if (!hash_equals($_SESSION['csrf_token'] ?? '', (string) ($_POST['csrf_token'] ?? ''))) {
    http_response_code(403);
    exit;
}
```

Also set session cookies with `SameSite=Lax` (or `Strict`). Frameworks provide this out of the box (Laravel `@csrf`, Symfony forms, WordPress nonces).

References: [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

## WordPress nonces and capabilities {#wordpress-nonces}

Every `wp_ajax_*` and `admin_post_*` handler must check that the request was intended (nonce) and that the user is allowed to perform it (capability):

```php
add_action('wp_ajax_myplugin_save', 'myplugin_save');

function myplugin_save() {
    check_ajax_referer('myplugin_save');           // dies on an invalid nonce
    if (!current_user_can('manage_options')) {
        wp_send_json_error('forbidden', 403);
    }
    update_option('myplugin_title', sanitize_text_field(wp_unslash($_POST['title'] ?? '')));
    wp_send_json_success();
}
```

In the form or script, send the nonce with `wp_nonce_field('myplugin_save')` or `wp_create_nonce('myplugin_save')`. Handlers registered with `wp_ajax_nopriv_*` are reachable by anyone, so validate their input carefully.

## Cross-origin resource sharing (CORS) {#cors}

Browsers stop other websites from reading your responses unless your server allows it with `Access-Control-Allow-Origin`. Copying the request's `Origin` header into that response header, especially together with `Access-Control-Allow-Credentials: true`, lets any website read pages and API answers with the visitor's cookies.

```php
// Vulnerable: every origin is trusted
header('Access-Control-Allow-Origin: ' . $_SERVER['HTTP_ORIGIN']);
header('Access-Control-Allow-Credentials: true');

// Fixed: an explicit allow-list
$allowed = ['https://app.example.com', 'https://admin.example.com'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Credentials: true');
    header('Vary: Origin');
}
```

- Do not allow the `null` origin, and do not match origins with loose patterns (`endsWith('example.com')` also matches `evil-example.com`).
- Public, cookie-free data may use `Access-Control-Allow-Origin: *`, never together with credentials.

References: [OWASP HTML5 Security Cheat Sheet: CORS](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#cross-origin-resource-sharing).
