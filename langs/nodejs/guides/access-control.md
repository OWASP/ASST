# Broken access control (A01:2025)

Access control decides who may do what. In the OWASP Top 10:2025 this category also contains path traversal, server-side request forgery, open redirects and permissive CORS, because they all let an attacker act beyond their permissions.

Check permissions on the server for every route (router-level middleware), deny by default, and never trust ids or roles sent by the client.

## Path traversal {#path-traversal}

```js
// Vulnerable: ?file=../../.env
res.sendFile(path.join(__dirname, 'uploads', req.query.file));

// Fixed: Express resolves the name inside root and rejects "../"
res.sendFile(req.query.file, { root: path.join(__dirname, 'uploads') });

// With fs: keep only the file name and check the final path
const name = path.basename(req.query.file);
const full = path.resolve(UPLOADS, name);
if (!full.startsWith(UPLOADS + path.sep)) return res.status(400).end();
```

Prefer ids that map to file names stored on the server over file names from the request.

## Server-side request forgery {#ssrf}

When the server fetches a URL from the request, attackers can reach internal services, the cloud metadata endpoint (`169.254.169.254`) or files.

```js
// Vulnerable
const r = await axios.get(req.query.url);

// Fixed: only known hosts, over HTTPS
const url = new URL(req.query.url);
if (url.protocol !== 'https:' || !['api.example.com', 'cdn.example.com'].includes(url.hostname)) {
  return res.status(400).end();
}
const r = await axios.get(url.href, { maxRedirects: 0, timeout: 5000 });
```

- If arbitrary URLs are a feature, resolve the host name and refuse private, loopback and link-local addresses, and do not follow redirects.
- Block outgoing traffic to internal networks at the firewall as well.

## Open redirect {#open-redirect}

```js
// Vulnerable: /login?next=https://evil.example
res.redirect(req.query.next);

// Fixed: only local paths
const next = req.query.next;
res.redirect(typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : '/');
```

## Cross-origin resource sharing (CORS) {#cors}

CORS headers tell browsers which other websites may read your responses. Reflecting every origin together with credentials lets any website act as the logged-in user and read the answers.

```js
// Vulnerable
app.use(cors({ origin: true, credentials: true }));

// Fixed: an explicit list
app.use(cors({ origin: ['https://app.example.com'], credentials: true }));
```

- Anchor origin patterns: `/^https:\/\/([a-z0-9-]+\.)?example\.com$/`. An unanchored `/example\.com/` also matches `example.com.attacker.net`.
- Never allow the `null` origin.
- Public, cookie-free APIs may use `origin: '*'` without credentials.

References: [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
