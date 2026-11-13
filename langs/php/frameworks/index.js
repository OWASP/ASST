'use strict';
/*
 * Framework packs for the PHP plugin. Each pack may provide:
 *   detect(project, readText, composer) -> info | null
 *   call(...)                            -> taint catalog extension (sources, sinks, sanitizers)
 *   templateRules(file, text)            -> findings in template files
 *   projectRules(phpFiles, envFiles)     -> project-wide findings
 *   CSRF_HELPERS                         -> regex of template helpers that output a CSRF token
 */
const packs = {
  wordpress: require('./wordpress'),
  laravel: require('./laravel'),
  symfony: require('./symfony'),
};

function readComposer(project, readText) {
  const f = project.files.find((x) => x.rel === 'composer.json');
  if (!f) return null;
  try {
    return JSON.parse(readText(f) || '{}');
  } catch (_) {
    return null;
  }
}

/** @returns {Array<{id, pack, info}>} detected frameworks */
function detect(project, readText) {
  const composer = readComposer(project, readText);
  const found = [];
  for (const [id, pack] of Object.entries(packs)) {
    let info = null;
    try { info = pack.detect(project, readText, composer); } catch (_) { info = null; }
    if (info) found.push({ id, pack, info });
  }
  return found;
}

/** Combined catalog extension for the detected frameworks. */
function catalogPack(detected) {
  const calls = detected.map((d) => d.pack.call).filter(Boolean);
  if (!calls.length) return null;
  return {
    call(callee, args, e, ctx, helpers) {
      for (const c of calls) {
        const r = c(callee, args, e, ctx, helpers);
        if (r) return r;
      }
      return null;
    },
  };
}

function csrfHelpers(detected) {
  return detected.map((d) => d.pack.CSRF_HELPERS).filter(Boolean);
}

module.exports = { detect, catalogPack, csrfHelpers, packs };
