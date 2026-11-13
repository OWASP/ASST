'use strict';
/*
 * Language plugin registry. A plugin is a module exporting:
 *   { id, name, extensions: string[], detect(project) -> number, scan(ctx) -> Promise<result> }
 */
const fs = require('fs');
const path = require('path');

const REGISTRY = {
  php: () => require('../langs/php'),
};

function available() {
  return Object.keys(REGISTRY).filter((id) => {
    try { REGISTRY[id](); return true; } catch (_) { return false; }
  });
}

function load(id) {
  const factory = REGISTRY[id];
  if (!factory) return null;
  return factory();
}

/** Picks the plugin for "auto": highest detect() score wins, PHP on ties. */
function detect(project) {
  let best = { id: 'php', score: -1 };
  for (const id of available()) {
    const plugin = load(id);
    const score = typeof plugin.detect === 'function' ? plugin.detect(project) : 0;
    if (score > best.score) best = { id, score };
  }
  return best.id;
}

function select(config, project) {
  const id = config.language === 'auto' ? detect(project) : config.language;
  const plugin = load(id);
  if (!plugin) {
    const hint = fs.existsSync(path.join(__dirname, '..', 'langs', id)) ? '' : ` (no langs/${id} folder)`;
    throw new Error(`No scanner is available for "${id}"${hint}. Available: ${available().join(', ')}.`);
  }
  return plugin;
}

module.exports = { select, detect, available, REGISTRY };
