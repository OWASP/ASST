'use strict';
const test = require('node:test');
const assert = require('assert');
const { parseV1Report } = require('../../bench/lib/v1-report');

const SAMPLE = [
  "<span style='color:green; font-weight:bold'><-- Checking for Injection Vulnerabilities --></span><br/>",
  "<span style='color:red; font-weight:bold;'>C:\\tmp\\runs\\ds-app\\login.php File has a MySQL Injection Vulnerability (Found in line number: 8) 'mysqli_query' function can be injected</span><br/>",
  "<span style='color:red; font-weight:bold;'>/tmp/runs/ds-app/tools/ping.php File has an OS Command Injection Vulnerability, 'shell_exec()' function can be injected without escapeshellcmd() and escapeshellarg() functions, check the lines number: 3,7 for the vulnerability.</span><br/>",
  "<span style='color:green; font-weight:bold'><-- Checking for Server-Side Request Forgery Vulnerabilities --></span><br/>",
  "<span style='color:red; font-weight:bold;'>/tmp/runs/ds-app/index.php File might have Server-Side Request Forgery Vulnerability (Found in line number: 4) 'include()' function used with a variable can be injected</span><br/>",
  "<span style='color:green; font-weight:bold'><-- Checking for Security Misconfiguration Vulnerabilities --></span><br/>",
  "<span style='color:red; font-weight:bold;'>Project is not configured to not report any error while production, make sure you add this function call 'error_reporting(0);' in the header of every page, or add it to your web site/app config file then it will be called in all pages.</span><br/>",
  "<span style='color:green; font-weight:bold'><-- Checking for Extra Web Security Hardenings --></span><br/>",
  "<span style='color:red; font-weight:bold'>/tmp/runs/ds-app/admin/index.php File has header redirection on line 4 but stopping execution function such as 'exit()' or 'die()' never called after it.</span><br/>",
  "<span style='color:red; font-weight:bold'>/tmp/runs/ds-app/backup.sql SQL file found in your project, it may leak important info related to your project, you must remove it.</span><br/>",
].join('');

test('parses v1 report findings into normalized records', () => {
  const findings = parseV1Report(SAMPLE, 'ds-app');
  const brief = findings.map((f) => [f.file, f.line, f.cwe]);
  assert.deepStrictEqual(brief, [
    ['login.php', 8, 'CWE-89'],
    ['tools/ping.php', 3, 'CWE-78'],
    ['tools/ping.php', 7, 'CWE-78'],
    ['index.php', 4, 'CWE-98'],
    [null, null, 'CWE-209'],
    ['admin/index.php', 4, 'CWE-698'],
    ['backup.sql', null, 'CWE-538'],
  ]);
});
