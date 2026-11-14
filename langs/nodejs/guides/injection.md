# Injection (A05:2025)

Injection happens when request data becomes part of a command that another interpreter runs: an SQL database, MongoDB, the shell, the JavaScript engine or the regular-expression engine. Keep data and code apart: pass values as parameters, never by building strings.

## SQL injection {#sql-injection}

```js
// Vulnerable: the id is part of the SQL text
db.query(`SELECT * FROM users WHERE id = '${req.params.id}'`);

// Fixed: placeholders with a values array (mysql / mysql2)
db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);

// node-postgres
await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
```

- Query builders and ORMs (Knex, Sequelize, Prisma, TypeORM) bind values for you. Their "raw" methods (`knex.raw`, `whereRaw`, `sequelize.query`, `$queryRawUnsafe`) need placeholders too.
- Table and column names cannot be bound as values: choose them from an allow-list in code.
- Give the database account only the permissions the application needs.

References: [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

## NoSQL injection {#nosql-injection}

Express parses JSON bodies and query strings such as `?user[$ne]=x` into objects, so a "value" can be a MongoDB operator:

```js
// Vulnerable: {"username": "admin", "password": {"$ne": ""}} logs in as admin
const user = await User.findOne({ username: req.body.username, password: req.body.password });

// Fixed: force strings (or validate the body against a schema)
const user = await User.findOne({ username: String(req.body.username) });
```

- Validate request bodies with a schema library (zod, joi, ajv) before using them.
- Strip operator keys with `express-mongo-sanitize`, and enable Mongoose `sanitizeFilter`.
- Never pass request data to `$where`, `$function` or `$accumulator`: they run JavaScript.
- Compare passwords with `bcrypt.compare()` after loading the user by name, never inside the query.

## OS command injection {#command-injection}

`child_process.exec()` runs its string through a shell, where `;`, `|`, `$( )` and backticks start new commands.

```js
// Vulnerable
exec(`convert ${req.query.file} out.png`);

// Fixed: no shell, arguments as an array, and validated input
const file = path.basename(req.query.file);
if (!/^[\w.-]+\.(png|jpg)$/.test(file)) return res.status(400).end();
execFile('convert', ['--', file, 'out.png']);
```

- Prefer a library over running a program at all.
- Use `execFile` / `spawn` with an argument array and without `shell: true`.
- Put `--` before user values so they cannot be read as options (argument injection).

## Code injection {#code-injection}

`eval()`, `new Function()`, `vm.runIn*Context()` and `setTimeout("string")` execute text as JavaScript. The `vm` module is not a security sandbox.

```js
// Vulnerable
const result = eval(req.query.expression);

// Fixed: parse the data you expect instead of running it
const value = JSON.parse(req.body.payload);
```

- Load modules only from fixed names: `require()` and `import()` with request data can run any file on the server.
- For formulas or filters, use a parser for that small language (for example `expr-eval`), with limits on size and complexity.

## Regular expressions from user input {#regex-injection}

A pattern built from request data can take seconds or minutes to evaluate (ReDoS) and blocks the single Node.js event loop for every user.

```js
// Vulnerable
const re = new RegExp(req.query.search);

// Fixed: escape the text and search for it literally
const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const re = new RegExp(escaped, 'i');
```

Limit the input length, and avoid nested quantifiers such as `(a+)+` in your own patterns.

References: [OWASP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html), [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html).
