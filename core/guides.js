'use strict';
/*
 * Remediation guides written in Markdown, one file per topic:
 *
 *   # Topic title
 *   intro ...
 *   ## Section title {#anchor}
 *   ...
 *
 * Keys are "<file>" for the whole topic and "<file>#<anchor>" for a section. The
 * report embeds only the sections its findings refer to.
 */
const fs = require('fs');
const path = require('path');

let markedLib = null;
function renderMarkdown(md) {
  if (!markedLib) markedLib = require('marked').marked;
  const html = markedLib.parse(md, { async: false, gfm: true });
  return html.replace(/<a href="(https?:)/g, '<a target="_blank" rel="noopener noreferrer" href="$1');
}

function plainText(md) {
  return md
    .replace(/```[a-z]*\n([\s\S]*?)```/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/[*_`#>]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const cache = new Map();

/** @returns {Map<string, {title, markdown}>} */
function loadGuides(dir) {
  if (cache.has(dir)) return cache.get(dir);
  const guides = new Map();
  let files = [];
  try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')); } catch (_) { /* no guides */ }
  for (const file of files) {
    const topic = path.basename(file, '.md');
    const text = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n');
    const parts = text.split(/^## /m);
    const intro = parts.shift();
    const title = (/^# (.+)$/m.exec(intro) || [null, topic])[1].trim();
    guides.set(topic, { title, markdown: intro.replace(/^# .+\n/, '').trim() });
    for (const part of parts) {
      const nl = part.indexOf('\n');
      const heading = part.slice(0, nl === -1 ? part.length : nl);
      const m = /^(.*?)\s*\{#([\w-]+)\}\s*$/.exec(heading);
      const anchor = m ? m[2] : heading.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const sectionTitle = m ? m[1] : heading.trim();
      guides.set(`${topic}#${anchor}`, { title: sectionTitle, markdown: part.slice(nl + 1).trim() });
    }
  }
  cache.set(dir, guides);
  return guides;
}

/** Renders the guides referenced by the given keys: {key: {title, html, text, markdown}}. */
function pickGuides(guides, keys) {
  const out = {};
  for (const key of new Set(keys.filter(Boolean))) {
    const g = guides.get(key);
    if (!g) continue;
    out[key] = { title: g.title, markdown: g.markdown, text: plainText(g.markdown), html: renderMarkdown(g.markdown) };
  }
  return out;
}

module.exports = { loadGuides, pickGuides, renderMarkdown };
