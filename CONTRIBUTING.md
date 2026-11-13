# Contributing to OWASP ASST

Thank you for helping developers write safer code! This guide explains how ASST is organized, how to add or improve rules, and how to add support for another language.

## Getting started

Requirements: Node.js 18 or newer, and Git. PHP and MySQL/MariaDB are only needed if you work on the runtime checks.

```bash
git clone https://github.com/OWASP/ASST.git
cd ASST
npm ci
npm test            # unit, fixture and install-layout tests
npm run bench       # precision/recall on DVWA, NIST SARD and the fixtures (downloads the datasets once)
```

`npm run bench:ci` runs the regression gate used in CI: it fails when the F1 score of a dataset drops by more than two points against `bench/baseline-metrics.json`. If a change improves the results on purpose, update the baseline in the same pull request.

## How ASST is organized

```
main.js                 Node.js version check, then core/runner.js
core/                   language-independent engine
  cli.js, config.js     options: command line > ASST_* environment > config files > defaults
  walker.js, file-cache.js
  taint/                data-flow engine: value.js (abstract values), contexts.js (SQL, HTML,
                        shell, path, URL checks), interpreter.js (runs the IR), project.js
  plugin-kit.js         findings, data-flow messages, thresholds, baselines, report writing
  supply/, secrets.js   dependencies, lifecycles, OSV.dev, secrets
  live/                 opt-in read-only checks of a running site
  report/               HTML, JSON, SARIF, Markdown, console
  rules/common.js       rules shared by every language (DEP-*, SECRET-*, LIVE-*)
langs/<language>/       one folder per language plugin
  index.js              the plugin: detect() and scan()
  taint/                parser, lowering to the IR, catalog of sources/sinks/sanitizers
  rules/                registry (metadata) and structural/configuration rules
  guides/*.md           remediation guides, one section per rule
data/                   lifecycle and advisory data (npm run update-data)
test/                   unit tests, fixtures with @expect annotations, smoke tests
bench/                  benchmark harness and results
```

## Adding or improving a rule

1. **Metadata.** Add the rule to `langs/<language>/rules/registry.js` with:
   - an id (`PHP-XYZ-001`, `NODE-XYZ-001`), a title and a CWE;
   - the OWASP Top 10:2025 and 2021 categories;
   - a default severity and a one-sentence summary;
   - the guide anchor (`file#section`).
2. **Detection.** Choose the right place:
   - *Data flow*: add sinks, sanitizers or guards to `langs/<language>/taint/catalog.js` (see below).
   - *Structure or configuration*: add an AST rule (`ast-rules.js`, `config-rules.js`), or a text rule for templates.
   - *Project level*: files, lock files, server configuration.
3. **Guide.** Add or extend a section `## Title {#anchor}` in `langs/<language>/guides/<file>.md`:
   - show the vulnerable pattern, the fix and references;
   - keep the tone practical and positive.

   `npm test` checks that every rule points to an existing section.
4. **Fixtures.** Add vulnerable and safe samples under `test/fixtures/<language>/`:
   - mark every expected finding on its line with a comment such as `// @expect CWE-89`;
   - name safe variants `*.safe.*`; they must stay free of findings.
5. **Run** `npm test` and `npm run bench:ci`.

Messages should say what happens and what to do, for example "User input reaches mysqli_query() inside a single-quoted string. Use prepared statements with bound parameters." Avoid jargon where a plain word works.

## The data-flow engine in short

Each language lowers its syntax tree into a small intermediate representation (IR), described at the top of `core/taint/interpreter.js`:
- statements: assignments, if, loops, switch, try, return;
- expressions: literals, variable paths, concatenation, calls, `new`, closures.

The interpreter runs the IR with abstract values that remember:
- whether data is attacker-influenced, and with which confidence;
- which characters it can contain, and which encodings were applied;
- the trace from the source.

The language **catalog** gives meaning to calls:

```js
call(callee, args, expr, ctx) -> null | {
  value,        // the abstract result
  sinks: [{ rule, arg, check }],   // check: sql, html, shell, path, urlControl, code, ldap, xpath, crlf, any
  byRef,        // values written back to arguments
  recvUpdate,   // new value of the receiver (array.push)
}
guard(testExpr, evalExpr)  // what a passing check (in_array, preg_match, validator.isInt) proves
entryArgs(fn)              // parameter values for entry points nobody calls (request handlers)
```

Callee keys look like:
- `fn:mysqli_query` and `fn:child_process.exec` (functions);
- `m:query` (methods; the receiver value is in `ctx.recv`);
- `new:pg.pool` (constructors).

Context checks in `core/taint/contexts.js` decide whether a value is safe where it is used. For example, a value escaped with `htmlspecialchars()` is safe in HTML text and quoted attributes, but not in a `<script>` block.

## Adding a language

1. Create `langs/<id>/index.js` exporting `{ id, name, extensions, detect(project), scan(ctx) }`, and register it in `core/plugins.js`.
   - `detect()` returns a score; `--lang auto` picks the highest.
   - `scan()` collects raw findings and returns `kit.finishScan(...)` from `core/plugin-kit.js`, which handles rule selection, suppressions, thresholds, baselines and every report format.
2. Write a parser wrapper and a lowering to the IR. `langs/nodejs/taint/lower.js` is a compact example: it resolves module imports to qualified callee names and maps closures, destructuring and template strings.
3. Write the catalog with sources, sinks, sanitizers and guards.
4. Reuse the shared checks: `core/supply` (dependencies), `core/secrets.js`, `core/live` and the common rules in `core/rules/common.js`.
5. Add guides, manual-review notes, a fixture corpus with `@expect` annotations and tests. Mention the language in the README.

Please open an issue to discuss a new language before starting; it helps to agree on the scope (frameworks, template engines) first.

## Pull requests

- Keep pull requests focused, and include tests and fixtures for new detections.
- Use conventional commit messages (`feat(php): ...`, `fix(report): ...`, `docs: ...`).
- Runtime dependencies must be pure JavaScript (no build step for users), pinned to exact versions, and work on Node.js 18.
- Do not commit real secrets, even expired ones: tests generate token-shaped values at run time.

## Reporting security issues

Please do not open public issues for vulnerabilities in ASST itself. See [SECURITY.md](SECURITY.md).
