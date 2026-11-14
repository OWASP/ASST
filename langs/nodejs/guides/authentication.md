# Authentication failures (A07:2025)

Weak session, token and credential handling lets attackers take over accounts.

Good practice for every login system:

- Hash passwords with bcrypt, scrypt or argon2 (see the cryptography guide).
- Limit failed logins per account and per IP address (for example `express-rate-limit`).
- Offer multi-factor authentication, at least for administrators.
- Call `req.session.regenerate()` after login, and `req.session.destroy()` on logout.

## Session cookies {#session-cookies}

```js
app.set('trust proxy', 1); // behind a TLS-terminating proxy
app.use(session({
  secret: process.env.SESSION_SECRET,
  name: '__Host-sid',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 },
}));
```

- `httpOnly`: scripts cannot read the cookie (true by default in express-session; never set it to false).
- `secure`: the cookie only travels over HTTPS.
- `sameSite`: other websites cannot send the cookie with their requests, which also blocks many CSRF attacks.
- Use a store such as Redis in production; the default memory store is not meant for it.

## JSON Web Tokens {#jwt}

```js
// Vulnerable: the algorithm comes from the token header
const payload = jwt.verify(token, key);

// Fixed: pin the algorithm (and audience/issuer)
const payload = jwt.verify(token, process.env.JWT_SECRET, {
  algorithms: ['HS256'],
  audience: 'my-app',
  issuer: 'auth.example.com',
});
```

- Never accept `alg: none`. Never use `jwt.decode()` to make access decisions: it does not check the signature.
- Use long random secrets (at least 32 bytes) or asymmetric keys, keep them out of the code, and give tokens short lifetimes.

## Secrets and API keys {#secrets}

API keys, tokens, private keys and passwords in the code end up in version control, CI logs and every copy of the repository.

```js
// Vulnerable
const stripe = require('stripe')('sk_live_...');

// Fixed
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

- Load secrets from the environment or a secrets manager; commit only a `.env.example` with placeholders.
- When a secret was committed, rotate it at the provider first. Removing it from the latest commit is not enough.
- Enable secret scanning and push protection in your repository host.

ASST masks the secrets it finds in every report: only the type and length of the value are shown.

References: [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [RFC 8725: JSON Web Token Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
