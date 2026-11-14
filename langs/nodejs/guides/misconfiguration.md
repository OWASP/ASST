# Security misconfiguration (A02:2025)

Default settings, verbose errors, exposed files and missing hardening give attackers information and footholds.

## Security headers {#security-headers}

[helmet](https://helmetjs.github.io/) sets a good default set of headers in one line, and removes `X-Powered-By`:

```js
const helmet = require('helmet');
app.use(helmet());

// adjust the Content-Security-Policy for your own scripts and assets
app.use(helmet.contentSecurityPolicy({
  directives: { defaultSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'self'"] },
}));
```

Without helmet, at least send `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, frame protection (`frame-ancestors` or `X-Frame-Options`) and, on HTTPS, `Strict-Transport-Security`, and call `app.disable('x-powered-by')`.

## Static files {#static-files}

`express.static()` publishes everything inside the folder it is given:

```js
// Vulnerable: source code, .env and node_modules can be downloaded
app.use(express.static(__dirname));

// Fixed: a folder that holds only public assets
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'ignore' }));
```

## Information disclosure {#information-disclosure}

Version banners (`X-Powered-By: Express`, `Server: nginx/1.18.0`) help attackers pick known exploits. Remove them (`app.disable('x-powered-by')` or helmet, `server_tokens off;` in nginx), and do not publish source maps or debug pages in production.

## Error handling {#error-handling}

Stack traces and error messages reveal file paths, library versions and queries.

```js
// last middleware
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path });
  res.status(500).json({ error: 'Something went wrong' });
});
```

Run production with `NODE_ENV=production` (Express then hides error details), never send `err.stack` to the client, and handle rejected promises.

## Files that should not be published {#exposed-files}

Keep `.env` files, database dumps, backups, keys, logs and the `.git` folder out of every directory the web server or `express.static()` serves. Deploy only what the site needs, ideally from a build step that copies the public assets into their own folder.

## Directory listing {#directory-listing}

Express does not list folders by default; `serve-index` does. Remove it, or restrict it to trusted users. With nginx keep `autoindex off;`, and with Apache use `Options -Indexes`.

References: [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html), [Express production best practices: security](https://expressjs.com/en/advanced/best-practice-security.html).
