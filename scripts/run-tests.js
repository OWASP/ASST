#!/usr/bin/env node
'use strict';
/*
 * Cross-platform test launcher: collects test/**\/*.test.js (never fixtures) and runs
 * them with the built-in node:test runner. Optional arguments filter by path substring:
 *   npm test            -> all tests
 *   npm test -- unit    -> only tests whose path contains "unit"
 */
const path = require('path');
const { spawnSync } = require('child_process');
const { walk } = require('../test/helpers/expectations');

const root = path.resolve(__dirname, '..');
const filters = process.argv.slice(2);
const files = walk(path.join(root, 'test'))
  .filter((f) => f.endsWith('.test.js') && !f.startsWith('fixtures/'))
  .filter((f) => filters.length === 0 || filters.some((s) => f.includes(s)))
  .sort()
  .map((f) => path.join('test', f));

if (files.length === 0) {
  console.error('No test files matched.');
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], { cwd: root, stdio: 'inherit' });
process.exit(result.status === null ? 1 : result.status);
