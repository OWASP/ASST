# Cryptographic failures (A04:2025)

## Password storage {#password-storage}

General-purpose hashes (MD5, SHA-1, SHA-256) are built to be fast, so stolen hashes can be guessed by the billion per second. Use a password hashing function:

```js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, user.passwordHash);

// or with Node.js only
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
```

argon2id (package `argon2`) is the current first choice; bcrypt and scrypt remain good options.

## Random values for security {#randomness}

`Math.random()` is predictable. Use the cryptographic generator for tokens, ids and keys:

```js
const crypto = require('crypto');
const token = crypto.randomBytes(32).toString('hex');
const id = crypto.randomUUID();
```

Compare secrets with `crypto.timingSafeEqual()` instead of `===`.

## HTTPS everywhere {#https}

Serve the whole site over HTTPS (usually at a reverse proxy or load balancer), redirect plain HTTP, and send `Strict-Transport-Security`. Behind a proxy, set `app.set('trust proxy', 1)` so `req.secure` and secure cookies work.

## TLS certificate validation {#tls-verification}

```js
// Vulnerable: accepts any certificate, including an attacker's
https.request({ host: 'api.example.com', rejectUnauthorized: false });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Fixed: trust the specific CA instead
https.request({ host: 'internal.example.com', ca: fs.readFileSync('internal-ca.pem') });
```

Use `NODE_EXTRA_CA_CERTS` for company or development certificate authorities instead of turning validation off.

References: [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [OWASP Transport Layer Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html).
