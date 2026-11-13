'use strict';
/*
 * Runs an ASST entry point in-process and records wall time and peak RSS.
 * Usage: node measure.js <stats.json> <entry.js> [entry args...]
 */
const fs = require('fs');
const path = require('path');

const statsFile = process.argv[2];
const entry = path.resolve(process.argv[3]);
process.argv = [process.argv[0], entry, ...process.argv.slice(4)];

const started = process.hrtime.bigint();
process.on('exit', (code) => {
  const usage = process.resourceUsage();
  fs.writeFileSync(statsFile, JSON.stringify({
    ms: Number(process.hrtime.bigint() - started) / 1e6,
    maxRssKB: usage.maxRSS,
    exitCode: code,
  }));
});
require(entry);
