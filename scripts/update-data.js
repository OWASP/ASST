#!/usr/bin/env node
'use strict';
/*
 * Maintainer script: refreshes the data files that ship with ASST.
 *   data/eol.json       lifecycles from endoflife.date
 *   data/js-libs.json   OSV.dev advisories for the front-end libraries ASST recognizes
 *                       when they are copied into a project (core/supply/jslibs.js)
 *
 * Usage: npm run update-data
 */
const fs = require('fs');
const path = require('path');
const { LIBRARIES } = require('../core/supply/jslibs');
const { allAdvisories } = require('../core/supply/osv');
const eol = require('../core/supply/eol');

const DATA = path.join(__dirname, '..', 'data');

async function main() {
  const today = new Date().toISOString().slice(0, 10);

  const lifecycles = await eol.fetchAll();
  fs.writeFileSync(path.join(DATA, 'eol.json'), `${JSON.stringify(lifecycles, null, 2)}\n`);
  console.log(`eol.json: ${Object.keys(lifecycles.products).length} products`);

  const packages = {};
  for (const lib of LIBRARIES) {
    const list = await allAdvisories('npm', lib.npm);
    packages[lib.npm] = list
      .filter((a) => a.ranges.length || a.versions.length)
      .map((a) => ({ id: a.id, aliases: a.aliases, summary: a.summary, severity: a.severity, ranges: a.ranges, ...(a.ranges.length ? {} : { versions: a.versions }) }));
    console.log(`js-libs.json: ${lib.npm} ${packages[lib.npm].length} advisories`);
  }
  const out = {
    source: 'https://osv.dev (npm ecosystem)',
    asOf: today,
    note: 'Advisories for front-end libraries that are often copied into web projects. Refreshed with npm run update-data; --online scans query OSV.dev directly.',
    packages,
  };
  fs.writeFileSync(path.join(DATA, 'js-libs.json'), `${JSON.stringify(out, null, 1)}\n`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
