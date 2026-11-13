# Cross-site scripting (A05:2025)

Cross-site scripting (XSS) happens when data from users is written into a page without encoding, so the browser runs it as HTML or JavaScript in other visitors' sessions.

## Output encoding {#output-encoding}

Encode every value at the moment it is written into the page, for the place where it is written.

```php
// Vulnerable
echo 'Hello ' . $_GET['name'];
```

For HTML text and quoted attributes, use `htmlspecialchars()` with explicit flags and charset:

```php
function e(?string $value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

echo 'Hello ' . e($_GET['name'] ?? '');
?>
<input type="text" name="q" value="<?= e($_GET['q'] ?? '') ?>">
```

Encoding for HTML is not enough everywhere:

- **Always quote attributes.** In `<input value=<?= e($v) ?>>` a space starts a new attribute.
- **Event handlers and `<script>`.** Do not put user data in `onclick="..."` or inside JavaScript code. Pass it as JSON instead: `<script>const data = <?= json_encode($data, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP) ?>;</script>`.
- **URLs.** In `href`/`src`, also check that the URL starts with `https://` or `/`, so `javascript:` URLs are rejected.
- **CSS and HTML comments.** Do not place user data there.

Template engines with automatic escaping (Twig, Blade `{{ }}`) apply the encoding for you; avoid their raw-output forms (`|raw`, `{!! !!}`) for user data.

Add a Content-Security-Policy header as a second line of defence, for example `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'`.

References: [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [OWASP Content Security Policy Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html).

## DOM-based XSS {#dom-xss}

In the browser, values from `location`, `document.referrer`, `window.name` or `postMessage` are attacker-controlled. Writing them with `innerHTML`, `outerHTML`, `document.write()`, `insertAdjacentHTML()` or jQuery's `.html()` creates XSS without any server involvement.

```js
// Vulnerable
el.innerHTML = 'Hi ' + decodeURIComponent(location.hash.slice(1));

// Fixed: insert text, not HTML
el.textContent = 'Hi ' + decodeURIComponent(location.hash.slice(1));
```

Never pass such values to `eval()`, `new Function()` or string arguments of `setTimeout()`/`setInterval()`. If HTML must be inserted, sanitize it with a maintained library such as DOMPurify.

References: [OWASP DOM based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html).
