'use strict';
/*
 * WordPress pack: core/plugin/theme detection, $wpdb and escaping APIs for the taint
 * engine, nonce-aware CSRF checks and AJAX/admin-post handler checks.
 */

const URL_SAFE = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~:/?#[]@!$&()*+,;=%';
const KEY = 'abcdefghijklmnopqrstuvwxyz0123456789_-';
const DB_SQL_METHODS = new Set(['m:query', 'm:get_results', 'm:get_var', 'm:get_row', 'm:get_col']);

function detect(project, readText) {
  const has = (rel) => project.files.some((f) => f.rel === rel || f.rel.endsWith(`/${rel}`));
  if (has('wp-includes/version.php') || has('wp-config.php') || has('wp-config-sample.php')) {
    const ver = project.files.find((f) => f.rel.endsWith('wp-includes/version.php'));
    const m = ver ? /\$wp_version\s*=\s*'([^']+)'/.exec(readText(ver) || '') : null;
    return { kind: 'core', version: m ? m[1] : null };
  }
  // plugin or theme folders
  for (const f of project.files) {
    if (f.ext === 'php' && !f.rel.includes('/')) {
      const head = (readText(f) || '').slice(0, 2000);
      if (/^\s*\*?\s*Plugin Name:/m.test(head)) return { kind: 'plugin', version: null };
    }
    if (f.name === 'style.css' && !f.rel.includes('/') && /Theme Name:/.test((readText(f) || '').slice(0, 2000))) return { kind: 'theme', version: null };
  }
  return null;
}

function isWpdb(e) {
  return e.recv && e.recv.k === 'path' && e.recv.base === 'wpdb' && e.recv.segs.length === 0;
}

/** Catalog extension for the taint engine. */
function call(callee, args, e, ctx, { V, S, propagate }) {
  const a0 = args[0];
  const line = e.line;
  switch (callee) {
    case 'fn:esc_html': case 'fn:esc_attr': case 'fn:esc_textarea': case 'fn:esc_html__': case 'fn:esc_attr__':
    case 'fn:esc_html_e': case 'fn:esc_attr_e': case 'fn:wp_kses': case 'fn:wp_kses_post': case 'fn:wp_kses_data':
      return { value: V.sanitize(a0, { enc: { html: true, htmlQuotes: true } }, line, `${callee.slice(3)}()`) };
    case 'fn:esc_url': case 'fn:esc_url_raw': case 'fn:sanitize_url':
      return { value: V.sanitize(a0, { allowed: URL_SAFE, enc: { url: true, html: true, htmlQuotes: true } }, line, `${callee.slice(3)}()`) };
    case 'fn:esc_js':
      return { value: V.sanitize(a0, { enc: { html: true, htmlQuotes: true }, removeChars: '\\\n\r' }, line, 'esc_js()') };
    case 'fn:esc_sql':
      return { value: V.sanitize(a0, { enc: { sql: true } }, line, 'esc_sql()') };
    case 'fn:absint': case 'fn:wp_validate_boolean':
      return { value: { t: false, num: true } };
    case 'fn:sanitize_key': case 'fn:sanitize_title': case 'fn:sanitize_html_class':
      return { value: V.sanitize(a0, { allowed: KEY }, line, `${callee.slice(3)}()`) };
    case 'fn:sanitize_text_field': case 'fn:sanitize_textarea_field':
      return { value: V.sanitize(a0, { removeChars: '<>\r\n' }, line, `${callee.slice(3)}()`) };
    case 'fn:sanitize_email': case 'fn:is_email':
      return { value: V.sanitize(a0, { allowed: `${KEY}ABCDEFGHIJKLMNOPQRSTUVWXYZ.@+` }, line, `${callee.slice(3)}()`) };
    case 'fn:sanitize_file_name':
      return { value: V.sanitize(a0, { removeChars: '/\\:' }, line, 'sanitize_file_name()') };
    case 'fn:wp_unslash': case 'fn:stripslashes_deep': case 'fn:map_deep':
      return { value: propagate(a0, line, `${callee.slice(3)}()`) };
    case 'fn:get_query_var':
      return { value: V.source('src', `get_query_var('${a0 && a0.str !== undefined ? a0.str : ''}')`, line, 1) };
    case 'fn:wp_redirect':
      return { value: V.CLEAN, sinks: [S('PHP-REDIR-001', 0, 'urlControl')] };
    case 'fn:wp_remote_get': case 'fn:wp_remote_post': case 'fn:wp_remote_request': case 'fn:wp_remote_head':
      return { value: V.CLEAN, sinks: [S('PHP-SSRF-001', 0, 'urlControl')] };
    case 'fn:wp_safe_redirect': case 'fn:wp_safe_remote_get': case 'fn:wp_safe_remote_post':
      return { value: V.CLEAN };
    default:
      break;
  }
  if (isWpdb(e)) {
    if (callee === 'm:prepare') {
      // the query template must be constant; values are escaped by prepare()
      const out = { t: false };
      return { value: out, sinks: [S('PHP-SQLI-001', 0, 'sql')] };
    }
    if (DB_SQL_METHODS.has(callee)) return { value: ctx.opts.secondOrder ? V.source('src2', `$wpdb->${callee.slice(2)}() result`, line, 1) : V.CLEAN, sinks: [S('PHP-SQLI-001', 0, 'sql')] };
    if (callee === 'm:esc_like') return { value: V.sanitize(a0, { enc: { sql: true } }, line, 'esc_like()') };
  }
  return null;
}

const CSRF_HELPERS = /wp_nonce_field\s*\(|settings_fields\s*\(|wp_referer_field\s*\(|check_admin_referer\s*\(|wp_create_nonce\s*\(|_wpnonce/;

/** AJAX / admin-post handlers registered without a nonce check. */
function projectRules(phpFiles) {
  const hits = [];
  const bodies = new Map();
  const fnRe = /function\s+&?\s*([A-Za-z_]\w*)\s*\([^)]*\)\s*(?::\s*\??[\w\\]+\s*)?\{/g;
  for (const { rel, text } of phpFiles) {
    let m;
    fnRe.lastIndex = 0;
    while ((m = fnRe.exec(text)) !== null) {
      let depth = 1;
      let i = fnRe.lastIndex;
      for (; i < text.length && depth > 0; i++) {
        if (text[i] === '{') depth++;
        else if (text[i] === '}') depth--;
      }
      const entry = { rel, body: text.slice(fnRe.lastIndex, i) };
      bodies.set(`${rel}::${m[1].toLowerCase()}`, entry);
      if (!bodies.has(m[1].toLowerCase())) bodies.set(m[1].toLowerCase(), entry);
      else bodies.set(m[1].toLowerCase(), null); // ambiguous name across files
    }
  }
  const actionRe = /add_action\s*\(\s*['"]((?:wp_ajax_(?:nopriv_)?|admin_post_(?:nopriv_)?)[\w-]+)['"]\s*,\s*(?:['"]([\w\\]+)['"]|\[\s*\$this\s*,\s*['"](\w+)['"]\s*\]|array\s*\(\s*\$this\s*,\s*['"](\w+)['"]\s*\))/g;
  for (const { rel, text } of phpFiles) {
    let m;
    actionRe.lastIndex = 0;
    while ((m = actionRe.exec(text)) !== null) {
      const hook = m[1];
      // public (nopriv) endpoints have no logged-in session to forge requests for
      if (/_nopriv_/.test(hook)) continue;
      const handler = (m[2] || m[3] || m[4] || '').split('\\').pop().toLowerCase();
      const isMethod = Boolean(m[3] || m[4]);
      const def = bodies.get(`${rel}::${handler}`) || (isMethod ? null : bodies.get(handler));
      if (!def) continue;
      const hasNonce = /check_ajax_referer\s*\(|wp_verify_nonce\s*\(|check_admin_referer\s*\(/.test(def.body);
      const hasCap = /current_user_can\s*\(/.test(def.body);
      if (hasNonce && hasCap) continue;
      const missing = [!hasNonce && 'a nonce check (check_ajax_referer / wp_verify_nonce)', !hasCap && 'a capability check (current_user_can)'].filter(Boolean).join(' and ');
      const line = text.slice(0, m.index).split('\n').length;
      hits.push({ ruleId: 'PHP-WP-001', file: rel, line, message: `The "${hook}" handler ${handler}() (${def.rel}) runs without ${missing}.` });
    }
  }
  return hits;
}

/** WP_DEBUG / WP_DEBUG_DISPLAY switched on in configuration files. */
function configRules(phpFiles) {
  const hits = [];
  for (const { rel, text } of phpFiles) {
    if (!/(^|\/)wp-config\.php$/.test(rel)) continue;
    text.split('\n').forEach((l, i) => {
      if (/define\s*\(\s*['"]WP_DEBUG(_DISPLAY)?['"]\s*,\s*true\s*\)/i.test(l)) hits.push({ ruleId: 'PHP-CONF-003', file: rel, line: i + 1, message: 'WordPress debug output is enabled in wp-config.php. Set WP_DEBUG_DISPLAY to false in production (log with WP_DEBUG_LOG instead).' });
    });
  }
  return hits;
}

module.exports = { name: 'WordPress', detect, call, projectRules, configRules, CSRF_HELPERS };
