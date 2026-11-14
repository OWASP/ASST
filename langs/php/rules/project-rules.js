'use strict';
/*
 * Project-level rules: files that should not be published, version-control folders,
 * and Apache .htaccess hardening.
 */
const fs = require('fs');
const path = require('path');

const ALLOWED_PUBLIC = /^(robots\.txt|humans\.txt|security\.txt|ads\.txt|app-ads\.txt|manifest\.json|site\.webmanifest|browserconfig\.xml|sitemap.*\.xml|favicon\.ico|crossdomain\.xml|license(\.\w+)?|licence(\.\w+)?|readme(\.\w+)?|changelog(\.\w+)?)$/i;

const SENSITIVE = [
  { re: /\.(sql|sqlite|sqlite3|db|mdb|dump)$/i, sev: 'high', what: 'database file or dump' },
  { re: /^\.env(\.[\w-]+)?$|\.env$/i, sev: 'high', what: 'environment file (often contains credentials)' },
  { re: /\.(pem|key|p12|pfx|jks|keystore|ppk)$|^id_(rsa|dsa|ecdsa|ed25519)$/i, sev: 'high', what: 'private key or certificate store' },
  { re: /\.(bak|backup|old|orig|save|swp|swo|tmp|~)$|~$/i, sev: 'medium', what: 'backup or editor temporary file (may reveal source code)' },
  { re: /\.(zip|tar|tgz|gz|bz2|7z|rar|xz)$/i, sev: 'medium', what: 'archive (often a site or database backup)' },
  { re: /\.(log)$|^error_log$/i, sev: 'low', what: 'log file' },
  { re: /^(phpinfo|info|test|php_info)\.php$/i, sev: 'medium', what: 'diagnostic script' },
  { re: /^(\.htpasswd|\.git-credentials|\.npmrc|\.pgpass|wp-config\.php\.\w+|config\.php\.\w+|settings\.php\.\w+)$/i, sev: 'high', what: 'credentials file' },
];

const MANIFESTS = /^(composer\.(json|lock)|package(-lock)?\.json|yarn\.lock|bower\.json|gulpfile\.js|gruntfile\.js|webpack\.config\.js|phpunit\.xml(\.dist)?|docker-compose\.ya?ml|dockerfile|makefile)$/i;

function exposedFiles(project) {
  const hits = [];
  for (const f of project.files) {
    const base = f.name;
    if (ALLOWED_PUBLIC.test(base)) continue;
    const s = SENSITIVE.find((x) => x.re.test(base));
    if (s) {
      hits.push({ ruleId: 'PHP-FILE-001', file: f.rel, severity: s.sev, message: `${f.rel}: ${s.what} inside the published folder. Move it outside the web root or delete it.` });
      continue;
    }
    if (MANIFESTS.test(base) && !f.rel.includes('/')) {
      hits.push({ ruleId: 'PHP-FILE-003', file: f.rel, message: `${f.rel} is publicly reachable if this folder is the web root. Keep it outside the web root or deny access to it.` });
    }
  }
  for (const s of project.skipped) {
    if (s.reason === 'vcs' && /(^|\/)\.(git|svn|hg|bzr)$/.test(s.rel)) {
      hits.push({ ruleId: 'PHP-FILE-002', file: s.rel, message: `${s.rel}/ is inside the published folder. Deploy without it or deny access to it.` });
    }
  }
  return hits;
}

function readHtaccess(root, project) {
  const candidates = ['.htaccess', 'public/.htaccess', 'public_html/.htaccess', 'htdocs/.htaccess', 'www/.htaccess', 'web/.htaccess'];
  for (const rel of candidates) {
    const abs = path.join(root, rel);
    try {
      if (fs.existsSync(abs)) return { rel, text: fs.readFileSync(abs, 'utf8') };
    } catch (_) { /* ignore */ }
  }
  void project;
  return null;
}

function htaccessRules(project, { usesPhp }) {
  if (!usesPhp) return [];
  const hits = [];
  const ht = readHtaccess(project.root, project);
  const text = ht ? ht.text.split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).join('\n') : '';
  if (!/^\s*Options\s+[^\n]*(-Indexes|\bNone\b)/im.test(text)) {
    hits.push({
      ruleId: 'PHP-HTA-001',
      file: ht ? ht.rel : null,
      message: ht ? `${ht.rel} does not contain "Options -Indexes".` : 'No .htaccess file with "Options -Indexes" was found. If the site runs on Apache, add one to the web root.',
    });
  }
  const httpsRedirect = /RewriteCond\s+%\{HTTPS\}\s+(off|!on|!=on)/i.test(text) || /RewriteCond\s+%\{SERVER_PORT\}\s+(80|!443|!\^443\$)/i.test(text) ||
    /RewriteCond\s+%\{REQUEST_SCHEME\}\s+(http|!https)/i.test(text) || /RewriteCond\s+%\{HTTP:X-Forwarded-Proto\}/i.test(text) ||
    /^\s*Redirect(Match)?\s+(301\s+|permanent\s+)?\S+\s+https:\/\//im.test(text);
  const hsts = /Strict-Transport-Security/i.test(text);
  if (!httpsRedirect && !hsts) {
    hits.push({
      ruleId: 'PHP-HTA-002',
      file: ht ? ht.rel : null,
      message: ht ? `${ht.rel} has no HTTP-to-HTTPS redirect and no Strict-Transport-Security header.` : 'No .htaccess redirect to HTTPS (or HSTS header) was found. If the site runs on Apache, enforce HTTPS in the web root.',
    });
  }
  return hits;
}

module.exports = { exposedFiles, htaccessRules };
