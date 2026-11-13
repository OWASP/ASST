# Cross-site scripting (A05:2025)

Cross-site scripting (XSS) lets an attacker run JavaScript in other users' browsers, with their session. It happens when request data is written into HTML without encoding for the place it appears in.

## Output encoding {#output-encoding}

`res.send()` with a string answers with `Content-Type: text/html`.

```js
// Vulnerable
res.send(`<h1>Hello ${req.query.name}</h1>`);

// Fixed: a template engine with auto-escaping
res.render('hello', { name: req.query.name });   // EJS <%= name %>, Pug #{name}, Handlebars {{name}}

// or escape explicitly
const escapeHtml = require('escape-html');
res.send(`<h1>Hello ${escapeHtml(req.query.name)}</h1>`);
```

- Send data to scripts as JSON (`res.json()`) and let the front end insert it with `textContent`.
- Escaping for HTML text is not enough inside `<script>`, event handlers (`onclick`) or `href="javascript:..."`. Keep data out of those places.
- Add a Content-Security-Policy (see the security headers section) as a second line of defense.

## Template escaping {#template-escaping}

Every template engine has a raw form that skips escaping:

| Engine | Escaped | Raw (dangerous) |
| --- | --- | --- |
| EJS | `<%= value %>` | `<%- value %>` |
| Handlebars | `{{value}}` | `{{{value}}}` |
| Pug | `#{value}`, `p= value` | `!{value}`, `p!= value` |
| Nunjucks | `{{ value }}` | `{{ value \| safe }}` |
| Vue | `{{ value }}` | `v-html="value"` |
| React | `{value}` | `dangerouslySetInnerHTML` |

Use the raw form only for HTML you produced yourself, or for user HTML that passed a sanitizer such as DOMPurify:

```js
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const DOMPurify = createDOMPurify(new JSDOM('').window);
const clean = DOMPurify.sanitize(req.body.html);
```

## DOM-based XSS {#dom-xss}

In browser code, values from `location`, `document.referrer`, `window.name` or `postMessage` are controlled by whoever made the link.

```js
// Vulnerable
document.getElementById('greeting').innerHTML = location.hash.slice(1);

// Fixed
document.getElementById('greeting').textContent = decodeURIComponent(location.hash.slice(1));
```

Avoid `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` and `eval` with such values, and check `event.origin` in message handlers.

References: [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html), [OWASP DOM based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html).
