# Software or data integrity failures (A08:2025)

## Prototype pollution {#prototype-pollution}

Deep-merging request data into objects lets keys such as `__proto__` or `constructor.prototype` change the behaviour of every object, which can bypass checks or lead to code execution.

```js
// Vulnerable
_.merge(settings, req.body);

// Fixed: copy only the fields you expect, after schema validation
const { theme, language } = schema.parse(req.body);
Object.assign(settings, { theme, language });
```

- Keep lodash at 4.17.21 or later and avoid hand-written deep-merge helpers.
- Use `Object.create(null)` or `Map` for dictionaries keyed by user input.
- Node.js can freeze the prototypes at start-up (`--frozen-intrinsics` is experimental; `Object.freeze(Object.prototype)` works for many apps).

## Insecure deserialization {#deserialization}

Some serialization libraries (for example `node-serialize`) restore functions and run them. Never deserialize request data with them; use `JSON.parse()` and validate the result against a schema.

References: [OWASP Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html), [OWASP Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html).
