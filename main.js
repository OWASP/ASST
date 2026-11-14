#!/usr/bin/env node
/*
 * OWASP ASST - Automated Software Security Toolkit
 *
 *   node main.js            scan the project configured in config.js
 *   node main.js --help     command-line options
 *
 * This file intentionally uses syntax that every Node.js version can parse, so that an
 * outdated Node.js prints a clear message instead of a syntax error.
 */
'use strict';

var MIN_NODE_MAJOR = 18;
var major = Number(process.versions.node.split('.')[0]);

if (major < MIN_NODE_MAJOR) {
	console.error('');
	console.error('ASST 2 requires Node.js ' + MIN_NODE_MAJOR + ' or newer, but this is Node.js ' + process.versions.node + '.');
	console.error('Install the current LTS version from https://nodejs.org/en/download (or run: sudo n lts).');
	console.error('The release shown in the installation videos (ASST v1.0.0, Node.js 12) is still available');
	console.error('as tag v1.0.0: https://github.com/OWASP/ASST/releases/tag/v1.0.0');
	console.error('');
	process.exit(1);
}

require('./core/runner').run(process.argv.slice(2)).then(function (code) {
	process.exitCode = code;
}, function (err) {
	console.error('ASST stopped because of an unexpected error:');
	console.error(err && err.stack ? err.stack : err);
	process.exitCode = 2;
});
