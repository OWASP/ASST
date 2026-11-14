# Third-party notices

OWASP ASST's own code is licensed under the [MIT License](LICENSE.md). ASST installs a few npm packages and ships with data from public sources, under their own licenses. The full dependency tree is pinned in `package-lock.json`.

## npm packages used at run time

| Package | License |
|---|---|
| [php-parser](https://github.com/glayzzle/php-parser) | BSD-3-Clause |
| [@babel/parser](https://github.com/babel/babel), @babel/types, @babel/helper-string-parser, @babel/helper-validator-identifier | MIT |
| [marked](https://github.com/markedjs/marked) | MIT |
| [mysql2](https://github.com/sidorares/node-mysql2) and its dependencies (aws-ssl-profiles, generate-function, iconv-lite, is-property, lru.min, named-placeholders, safer-buffer, sql-escaper, @types/node, undici-types) | MIT |
| [long](https://github.com/dcodeIO/long.js) (a mysql2 dependency) | Apache-2.0 |

Development only (tests): [ajv](https://github.com/ajv-validator/ajv) and its dependencies, MIT.

## Data shipped with ASST

| File | Source | License |
|---|---|---|
| `data/eol.json` | [endoflife.date](https://endoflife.date) | MIT |
| `data/js-libs.json` | Advisories from the [GitHub Advisory Database](https://github.com/github/advisory-database), retrieved through [OSV.dev](https://osv.dev) | CC-BY-4.0 |
| `test/schemas/sarif-schema-2.1.0.json` | [SARIF 2.1.0 schema](https://docs.oasis-open.org/sarif/sarif/v2.1.0/) (OASIS), via SchemaStore | OASIS IPR policy / Apache-2.0 |

With `--online`, ASST queries OSV.dev and endoflife.date during the scan; the answers are cached locally and are subject to the same licenses.

## Downloaded only by the benchmark

`npm run bench` downloads these into `bench/.work/` to measure ASST. They are not part of ASST and are never redistributed.

| Dataset | License |
|---|---|
| [DVWA](https://github.com/digininja/DVWA) | GPL-3.0 |
| [NIST SARD PHP Vulnerability Test Suite](https://samate.nist.gov/SARD/) | NIST SARD terms of use |
| [WordPress](https://wordpress.org) | GPL-2.0-or-later |

## Docker image

The image built from the `Dockerfile` is based on the official [Node.js Alpine image](https://hub.docker.com/_/node). Node.js is MIT-licensed; Alpine Linux packages carry their own licenses.
