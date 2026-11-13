# Insecure design (A06:2025)

Some weaknesses are not coding mistakes but missing security decisions. Review these at design time:

- **Abuse cases.** Ask how each feature can be misused: mass sign-ups, coupon reuse, scraping, password-reset abuse.
- **Rate limits.** Limit logins, password resets, OTP checks, searches and other expensive operations per user and per IP address.
- **Trust boundaries.** Re-check on the server everything the browser sends, including prices, quantities, ids and roles.
- **Secure defaults.** New accounts get the lowest privileges, new features start disabled, and errors deny access.
- **Separation.** Keep administrative functions on separate paths with stronger authentication.
- **Threat modelling.** For important features, list assets, entry points and threats, for example with [OWASP Threat Dragon](https://owasp.org/www-project-threat-dragon/).

References: [OWASP Secure Design Principles](https://owasp.org/www-project-developer-guide/release/design/), [OWASP Top 10:2025](https://owasp.org/Top10/2025/).
