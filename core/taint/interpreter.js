'use strict';
/*
 * Abstract interpreter for taint analysis over a small language-independent IR.
 *
 * Program:  { main: Stmt[], functions: Map<lcName, Fn>, classes: Map<lcName, Cls>,
 *             methodsByName: Map<lcName, Fn[]>, allFunctions: Fn[] }
 * Fn:       { id, name, params: [{name, byRef, def: Expr|null, variadic}], body: Stmt[], cls, line }
 * Cls:      { name, parent, methods: Map<lcName, Fn>, props: [{name, def: Expr|null}] }
 *
 * Stmt kinds: assign{target, expr, op}, expr{expr}, if{test, then, else}, loop{init, test, body,
 *   update, each:{source, key, value}}, switch{test, cases:[{test, body}]}, try{body, catches:[{target, body}], fin},
 *   return{expr}, halt{}, global{names}, unset{targets}, block{body}
 * LValue:   {k:'path', base, segs:[{key: string|'*'|null} | {prop: string}]} | {k:'list', items:[{key, target}]} | {k:'none'}
 * Expr kinds: lit{value}, path (read), concat{parts}, call{callee, args, recv}, new{cls, args},
 *   cast{type, expr}, ternary{test, then, else}, bin{op, left, right}, unary{op, expr},
 *   array{items:[{key, value, unpack}]}, assign{target, expr, op}, closure{fn}, unknown{parts}
 *
 * The language catalog supplies sources, sinks, sanitizers, propagators and guards.
 * Every node carries `line` (and `col` where useful).
 */
const V = require('./value');
const contexts = require('./contexts');

const MAX_DEPTH = 5;
const LOOP_ROUNDS = 3;

class Env {
  constructor(vars, out) {
    this.vars = vars || new Map();
    this.out = out || contexts.initialHtmlState();
    this.bottom = false;
    this.globals = null; // Set of names bound to the main environment
    this.included = null; // files already included (for *_once)
    this.haltKind = null; // 'exit' | 'return'
  }

  clone() {
    const e = new Env(new Map(this.vars), { ...this.out });
    e.bottom = this.bottom;
    e.globals = this.globals ? new Set(this.globals) : null;
    e.included = this.included ? new Set(this.included) : null;
    e.haltKind = this.haltKind;
    return e;
  }

  /** Joins another environment into this one (control-flow merge). */
  joinFrom(other) {
    if (other.bottom) return this;
    if (this.bottom) {
      this.vars = new Map(other.vars);
      this.out = { ...other.out };
      this.bottom = false;
      this.globals = other.globals ? new Set(other.globals) : null;
      this.included = other.included ? new Set(other.included) : null;
      this.haltKind = null;
      return this;
    }
    for (const [k, v] of other.vars) this.vars.set(k, this.vars.has(k) ? V.join(this.vars.get(k), v) : v);
    for (const [k, v] of this.vars) if (!other.vars.has(k)) this.vars.set(k, v);
    if (JSON.stringify(this.out) !== JSON.stringify(other.out)) this.out = contexts.initialHtmlState();
    if (other.globals) this.globals = new Set([...(this.globals || []), ...other.globals]);
    if (other.included) this.included = new Set([...(this.included || []), ...other.included]);
    return this;
  }

  sameAs(other) {
    if (this.bottom !== other.bottom || this.vars.size !== other.vars.size) return false;
    for (const [k, v] of this.vars) {
      const o = other.vars.get(k);
      if (!o || o.t !== v.t || o.c !== v.c || o.str !== v.str || Boolean(o.arr) !== Boolean(v.arr)) return false;
    }
    return true;
  }
}

function pathText(t) {
  if (!t || t.k !== 'path') return 'a variable';
  return `$${t.base}${t.segs.map((s) => (s.prop !== undefined ? `->${s.prop}` : `[${s.key === null || s.key === '*' ? '' : JSON.stringify(s.key)}]`)).join('')}`;
}

function signature(values) {
  return values.map((v) => {
    if (!v) return '-';
    if (!v.t) return v.obj ? `o:${v.obj.cls}:${[...v.obj.fields.entries()].map(([k, f]) => `${k}=${f.t ? 1 : 0}`).join(',')}` : (v.str !== undefined ? `s${v.str.length}` : (v.arr ? `a${v.arr.size}` : 'c'));
    return `t${v.c}${v.g ? 'g' : ''}${v.allowed === null || v.allowed === undefined ? '*' : v.allowed.length}${Object.keys(v.enc || {}).sort().join('')}${v.obj ? 'o' : ''}`;
  }).join('|');
}

class Interpreter {
  /**
   * @param {object} program IR program
   * @param {object} catalog language catalog (see langs/php/taint/catalog.js)
   * @param {{secondOrder?:boolean, budget?:number, assumeParamsTainted?:boolean}} options
   */
  constructor(program, catalog, options = {}) {
    this.p = program;
    this.cat = catalog;
    this.opts = options;
    const shared = options.shared || {};
    this.hits = shared.hits || new Map();
    this.memo = shared.memo || new Map();
    this.analyzed = shared.analyzed || new Set();
    this.hitLog = [];
    this.project = options.project || null;
    this.entry = program.file;
    this.constants = new Map();
    this.includeCount = 0;
    this.depth = 0;
    this.budget = options.budget || 400000;
    this.mainEnv = null;
    this.exhausted = false;
  }

  run({ standalone = true } = {}) {
    const env = new Env();
    this.mainEnv = env;
    this.execBlock(this.p.main, env, { fn: null, file: this.p.file });
    if (standalone) this.analyzeRemaining(this.p.allFunctions);
    return { hits: [...this.hits.values()], exhausted: this.exhausted };
  }

  /** Analyzes functions that were never called, with untainted (or assumed-tainted) parameters. */
  analyzeRemaining(functions) {
    for (const fn of functions) {
      if (this.analyzed.has(fn)) continue;
      const args = this.opts.assumeParamsTainted
        ? fn.params.map((p) => V.source('src', `parameter $${p.name}`, fn.line, 2))
        : [];
      const thisVal = fn.cls ? this.newObjectValue(fn.cls, false) : null;
      this.invoke(fn, args, [], thisVal, fn.line);
    }
  }

  tick() {
    if (--this.budget <= 0) { this.exhausted = true; return false; }
    return true;
  }

  /* ----------------------------------------------------------- statements */

  execBlock(stmts, env, f) {
    for (const s of stmts || []) {
      if (env.bottom || !this.tick()) return;
      this.exec(s, env, f);
    }
  }

  exec(s, env, f) {
    switch (s.k) {
      case 'assign': {
        let v = this.eval(s.expr, env, f);
        if (s.op === '.=') v = V.concat([this.read(s.target, env, f), v]);
        else if (s.op === '??=') v = V.join(this.read(s.target, env, f), v);
        else if (s.op && s.op !== '=') v = { t: false, num: true };
        this.write(s.target, v.t ? V.step(v, s.line, `assigned to ${pathText(s.target)}`) : v, env, f, s.line);
        break;
      }
      case 'expr':
        this.eval(s.expr, env, f);
        break;
      case 'if': {
        if (s.test) this.eval(s.test, env, f);
        const truth = this.constTruth(s.test);
        const thenEnv = env.clone();
        const elseEnv = env.clone();
        if (truth === false) thenEnv.bottom = true;
        else this.refine(s.test, thenEnv, f, true);
        if (truth === true) elseEnv.bottom = true;
        else this.refine(s.test, elseEnv, f, false);
        this.execBlock(s.then, thenEnv, f);
        this.execBlock(s.else, elseEnv, f);
        this.replace(env, thenEnv.joinFrom(elseEnv));
        break;
      }
      case 'loop': {
        this.execBlock(s.init, env, f);
        const entry = env.clone();
        let state = env.clone();
        for (let round = 0; round < LOOP_ROUNDS; round++) {
          const body = state.clone();
          if (s.each) this.bindEach(s.each, body, f, s.line);
          if (s.test) this.eval(s.test, body, f);
          if (s.test) this.refine(s.test, body, f, true);
          this.execBlock(s.body, body, f);
          this.execBlock(s.update, body, f);
          body.bottom = false; // break/continue/return inside loops are approximated
          const next = state.clone().joinFrom(body);
          if (next.sameAs(state)) { state = next; break; }
          state = next;
        }
        this.replace(env, entry.joinFrom(state));
        break;
      }
      case 'switch': {
        const test = s.test ? this.eval(s.test, env, f) : null;
        const result = new Env();
        result.bottom = true;
        let hasDefault = false;
        for (const c of s.cases) {
          const arm = env.clone();
          if (c.test === null) hasDefault = true;
          else if (s.test && s.test.k === 'path' && c.test.k === 'lit') this.write(s.test, V.constant(c.test.value), arm, f, c.line);
          this.execBlock(c.body, arm, f);
          arm.bottom = false; // break
          result.joinFrom(arm);
        }
        if (!hasDefault) result.joinFrom(env);
        void test;
        this.replace(env, result);
        break;
      }
      case 'try': {
        const entry = env.clone();
        this.execBlock(s.body, env, f);
        const afterTry = env.clone();
        const catchStart = entry.clone().joinFrom(afterTry);
        catchStart.bottom = false;
        const merged = afterTry.clone();
        for (const c of s.catches) {
          const ce = catchStart.clone();
          if (c.target) this.write(c.target, V.CLEAN, ce, f, c.line);
          this.execBlock(c.body, ce, f);
          merged.joinFrom(ce);
        }
        this.replace(env, merged);
        if (s.fin) {
          const wasBottom = env.bottom;
          env.bottom = false;
          this.execBlock(s.fin, env, f);
          env.bottom = env.bottom || wasBottom;
        }
        break;
      }
      case 'return': {
        const v = s.expr ? this.eval(s.expr, env, f) : V.CLEAN;
        if (f.fn) {
          f.ret = f.ret ? V.join(f.ret, v) : v;
          this.recordExit(env, f);
        }
        env.bottom = true;
        env.haltKind = f.fn ? 'return' : 'top-return';
        break;
      }
      case 'halt':
        if (f.fn) this.recordExit(env, f);
        env.bottom = true;
        env.haltKind = 'exit';
        break;
      case 'global':
        env.globals = env.globals || new Set();
        for (const n of s.names) env.globals.add(n);
        break;
      case 'unset':
        for (const t of s.targets) this.write(t, V.CLEAN, env, f, s.line);
        break;
      case 'block':
        this.execBlock(s.body, env, f);
        break;
      default:
        break;
    }
  }

  replace(env, other) {
    env.vars = other.vars;
    env.out = other.out;
    env.bottom = other.bottom;
    env.globals = other.globals;
    env.included = other.included;
    env.haltKind = other.haltKind;
  }

  recordExit(env, f) {
    const thisNow = env.vars.get('this');
    if (thisNow) f.thisOut = f.thisOut ? V.join(f.thisOut, thisNow) : thisNow;
    if (f.byRefParams) {
      for (const name of f.byRefParams) {
        const v = env.vars.get(name) || V.CLEAN;
        f.byRefOut.set(name, f.byRefOut.has(name) ? V.join(f.byRefOut.get(name), v) : v);
      }
    }
  }

  bindEach(each, env, f, line) {
    const src = this.eval(each.source, env, f);
    let element;
    if (src.arr && src.arr.size) element = V.joinAll([...src.arr.values()]);
    else element = src.t ? src : V.CLEAN;
    if (src.t && !src.arr) element = src;
    if (each.value) this.write(each.value, element, env, f, line);
    if (each.key) this.write(each.key, each.taintedKeys && src.t ? V.step(src, line, 'array key') : V.CLEAN, env, f, line);
  }

  constTruth(test) {
    if (!test) return null;
    if (test.k === 'lit') {
      if (test.value === false || test.value === 0 || test.value === '' || test.value === null || test.value === '0') return false;
      return true;
    }
    return null;
  }

  /* ----------------------------------------------------------- refinement */

  refine(test, env, f, positive) {
    if (!test) return;
    if (test.k === 'unary' && test.op === '!') { this.refine(test.expr, env, f, !positive); return; }
    if (test.k === 'bin') {
      const { op, left, right } = test;
      if ((op === '&&' || op === 'and') && positive) { this.refine(left, env, f, true); this.refine(right, env, f, true); return; }
      if ((op === '||' || op === 'or') && !positive) { this.refine(left, env, f, false); this.refine(right, env, f, false); return; }
      if (['==', '===', '!=', '!==', '<>'].includes(op)) {
        const eq = op === '==' || op === '===';
        const litSide = left.k === 'lit' ? left : (right.k === 'lit' ? right : null);
        const other = litSide === left ? right : left;
        if (litSide && other) {
          if (other.k === 'path' && eq === positive && typeof litSide.value === 'string') {
            this.write(other, V.constant(litSide.value), env, f, test.line);
            return;
          }
          if (other.k === 'call') {
            const truthy = !(litSide.value === false || litSide.value === 0 || litSide.value === null || litSide.value === '0');
            this.refine(other, env, f, (eq === positive) ? truthy : !truthy);
            return;
          }
        }
      }
      if (['>', '>='].includes(op) && left.k === 'call' && right.k === 'lit' && positive) { this.refine(left, env, f, true); return; }
      return;
    }
    if (test.k === 'call' && positive) {
      const g = this.cat.guard ? this.cat.guard(test, (e) => this.eval(e, env.clone(), f)) : null;
      if (g && g.target && g.target.k === 'path') {
        const cur = this.read(g.target, env, f);
        if (!cur.t) return;
        let next;
        if (g.effect.clean) next = g.effect.num ? { t: false, num: true } : V.CLEAN;
        else if (g.effect.allowed !== undefined) next = V.sanitize(cur, { allowed: g.effect.allowed }, test.line, g.note);
        else if (g.effect.guarded) next = { ...V.step(cur, test.line, g.note), g: true, c: 2 };
        if (next) this.write(g.target, next, env, f, test.line);
      }
    }
  }

  /* ------------------------------------------------------------ variables */

  envFor(base, env) {
    if (env.globals && env.globals.has(base) && this.mainEnv && env !== this.mainEnv) return this.mainEnv;
    return env;
  }

  read(target, env, f) {
    if (!target || target.k !== 'path') return V.CLEAN;
    let base;
    const scope = this.envFor(target.base, env);
    if (scope.vars.has(target.base)) base = scope.vars.get(target.base);
    else if (target.base === 'GLOBALS' && target.segs.length && target.segs[0].key && target.segs[0].key !== '*') {
      return this.read({ k: 'path', base: target.segs[0].key, segs: target.segs.slice(1), line: target.line }, this.mainEnv || env, f);
    } else {
      const sg = this.cat.superglobal ? this.cat.superglobal(target.base, target.segs, target.line, this.opts) : undefined;
      if (sg !== undefined) return sg;
      base = undefined;
    }
    if (base === undefined) return V.CLEAN;
    let v = base;
    for (const seg of target.segs) {
      v = this.descend(v, seg);
      if (!v) return V.CLEAN;
    }
    return v;
  }

  descend(v, seg) {
    if (seg.prop !== undefined) {
      if (v.obj) return v.obj.fields.get(seg.prop) || (v.t ? v : V.CLEAN);
      return v.t ? v : V.CLEAN;
    }
    if (v.arr) {
      if (seg.key === '*' || seg.key === null) return v.arr.size ? V.joinAll([...v.arr.values()]) : (v.t ? v : V.CLEAN);
      const exact = v.arr.get(seg.key);
      if (exact) return exact;
      const wild = v.arr.get('*');
      if (wild) return wild;
      return v.t && !v.arr.size ? v : V.CLEAN;
    }
    if (v.t) {
      const out = { ...v };
      delete out.segs;
      return out;
    }
    return V.CLEAN;
  }

  write(target, value, env, f, line) {
    if (!target) return;
    if (target.k === 'list') {
      const src = value || V.CLEAN;
      target.items.forEach((item, idx) => {
        if (!item || !item.target) return;
        const key = item.key !== null && item.key !== undefined ? String(item.key) : String(idx);
        this.write(item.target, this.descend(src, { key }), env, f, line);
      });
      return;
    }
    if (target.k !== 'path') return;
    const scope = this.envFor(target.base, env);
    if (target.segs.length === 0) {
      scope.vars.set(target.base, value || V.CLEAN);
      return;
    }
    const cur = scope.vars.has(target.base) ? scope.vars.get(target.base) : undefined;
    scope.vars.set(target.base, this.update(cur, target.segs, value || V.CLEAN, 0));
  }

  update(cur, segs, value, depth) {
    const seg = segs[0];
    const rest = segs.slice(1);
    const base = cur ? { ...cur } : { t: false };
    if (seg.prop !== undefined) {
      const fields = new Map(base.obj ? base.obj.fields : []);
      const prev = fields.get(seg.prop);
      fields.set(seg.prop, rest.length && depth < 4 ? this.update(prev, rest, value, depth + 1) : value);
      base.obj = { cls: base.obj ? base.obj.cls : null, fields };
      return base;
    }
    const arr = new Map(base.arr || []);
    let key = seg.key;
    if (key === null) { // $a[] = push
      let i = 0;
      while (arr.has(String(i))) i++;
      key = String(i);
    }
    const prev = arr.get(key);
    const nextVal = rest.length && depth < 4 ? this.update(prev, rest, value, depth + 1) : value;
    if (key === '*') {
      // dynamic key: any existing entry may have been overwritten
      for (const [k, v] of arr) if (k !== '*') arr.set(k, V.join(v, nextVal));
      arr.set('*', prev ? V.join(prev, nextVal) : nextVal);
    } else {
      arr.set(key, nextVal);
    }
    const out = V.joinAll([...arr.values()]);
    const res = { ...out, arr };
    if (base.obj) res.obj = base.obj;
    if (!res.t) { delete res.segs; }
    return res;
  }

  /* ---------------------------------------------------------- expressions */

  eval(e, env, f) {
    if (!e || !this.tick()) return V.CLEAN;
    switch (e.k) {
      case 'lit':
        if (typeof e.value === 'number') return { t: false, num: true, str: String(e.value) };
        if (typeof e.value === 'string') return V.constant(e.value);
        return V.CLEAN;
      case 'const':
        if (this.constants.has(e.name)) return this.constants.get(e.name);
        return this.cat.constant ? this.cat.constant(e.name) : V.CLEAN;
      case 'magic': {
        const file = f.file || this.p.file || '';
        const dir = file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '';
        if (e.name === '__DIR__') return V.constant(dir ? `/${dir}` : '');
        if (e.name === '__FILE__') return V.constant(`/${file}`);
        if (e.name === '__LINE__') return { t: false, num: true };
        return V.constant(e.name);
      }
      case 'path':
        if (e.base === 'this' && f.fn && !env.vars.has('this')) return V.CLEAN;
        return this.read(e, env, f);
      case 'concat':
        return V.concat(e.parts.map((p) => this.eval(p, env, f)));
      case 'cast': {
        const v = this.eval(e.expr, env, f);
        if (['int', 'integer', 'float', 'double', 'bool', 'boolean', 'real'].includes(e.type)) return { t: false, num: true };
        if (e.type === 'unset') return V.CLEAN;
        return v;
      }
      case 'ternary': {
        const thenEnv = env.clone();
        const elseEnv = env.clone();
        const test = this.eval(e.test, env, f);
        this.refine(e.test, thenEnv, f, true);
        this.refine(e.test, elseEnv, f, false);
        const a = e.then ? this.eval(e.then, thenEnv, f) : test;
        const b = this.eval(e.else, elseEnv, f);
        return V.join(a, b);
      }
      case 'bin': {
        const l = this.eval(e.left, env, f);
        const r = this.eval(e.right, env, f);
        if (e.op === '??' || e.op === '?:') return V.join(l, r);
        if (e.op === '.') return V.concat([l, r]);
        if (['+', '-', '*', '/', '%', '**', '<<', '>>', '&', '|', '^', '<=>'].includes(e.op)) {
          if (e.op === '+' && (l.arr || r.arr)) return V.join(l, r);
          return { t: false, num: true };
        }
        return V.CLEAN;
      }
      case 'unary':
        this.eval(e.expr, env, f);
        return e.op === '!' ? V.CLEAN : { t: false, num: true };
      case 'array': {
        const arr = new Map();
        let idx = 0;
        for (const item of e.items) {
          if (!item) continue;
          const v = this.eval(item.value, env, f);
          if (item.unpack) {
            if (v.arr) for (const [, ev] of v.arr) arr.set(String(idx++), ev);
            else if (v.t) arr.set('*', arr.has('*') ? V.join(arr.get('*'), v) : v);
            continue;
          }
          let key;
          if (item.key) {
            const kv = this.eval(item.key, env, f);
            key = kv.str !== undefined ? kv.str : '*';
          } else {
            key = String(idx++);
          }
          arr.set(key, key === '*' && arr.has('*') ? V.join(arr.get('*'), v) : v);
        }
        const all = V.joinAll([...arr.values()]);
        return { ...all, arr, str: undefined };
      }
      case 'assign': {
        let v = this.eval(e.expr, env, f);
        if (e.op === '.=') v = V.concat([this.read(e.target, env, f), v]);
        else if (e.op === '??=') v = V.join(this.read(e.target, env, f), v);
        this.write(e.target, v, env, f, e.line);
        return v;
      }
      case 'closure':
        return { t: false, fn: e.fn };
      case 'new':
        return this.evalNew(e, env, f);
      case 'call':
        return this.evalCall(e, env, f);
      case 'unknown':
        return V.weaken(V.joinAll((e.parts || []).map((p) => this.eval(p, env, f))));
      default:
        return V.CLEAN;
    }
  }

  newObjectValue(cls, runConstructor, args = [], env = null, f = null, line = 0) {
    const def = this.findClass(cls);
    const fields = new Map();
    let obj = { t: false, obj: { cls: def ? def.name : cls, fields } };
    if (def) {
      for (const p of this.classChain(def).reverse().flatMap((c) => c.props)) {
        fields.set(p.name, p.def && env ? this.eval(p.def, env, f) : V.CLEAN);
      }
      if (runConstructor) {
        const ctor = this.findMethod(def, '__construct') || this.findMethod(def, def.name.toLowerCase());
        if (ctor) {
          const res = this.invoke(ctor, args, [], obj, line);
          if (res.thisOut && res.thisOut.obj) obj = { ...obj, obj: { cls: obj.obj.cls, fields: res.thisOut.obj.fields } };
        }
      }
    }
    return obj;
  }

  classChain(def) {
    const chain = [];
    let cur = def;
    const seen = new Set();
    while (cur && !seen.has(cur.name)) {
      chain.push(cur);
      seen.add(cur.name);
      cur = cur.parent ? this.findClass(cur.parent) : null;
    }
    return chain;
  }

  findClass(name) {
    const lc = String(name || '').toLowerCase();
    if (this.p.classes.has(lc)) return this.p.classes.get(lc);
    if (this.project) {
      const list = this.project.classes.get(lc);
      if (list && list.length === 1) return list[0];
    }
    return null;
  }

  findFunction(lcName) {
    if (this.p.functions.has(lcName)) return this.p.functions.get(lcName);
    if (this.project) {
      const list = this.project.functions.get(lcName);
      if (list && list.length === 1) return list[0];
    }
    return null;
  }

  methodsNamed(lcName) {
    const own = this.p.methodsByName.get(lcName) || [];
    if (!this.project) return own;
    return this.project.methodsByName.get(lcName) || own;
  }

  findMethod(def, lcName) {
    for (const c of this.classChain(def)) if (c.methods.has(lcName)) return c.methods.get(lcName);
    return null;
  }

  evalNew(e, env, f) {
    const args = (e.args || []).map((a) => this.eval(a, env, f));
    const cls = e.cls;
    if (cls && this.findClass(cls)) return this.newObjectValue(cls, true, args, env, f, e.line);
    const hit = this.cat.call ? this.cat.call(`new:${String(cls || '').toLowerCase()}`, args, e, this.ctxApi(env, f)) : null;
    if (hit) return this.applyCatalogResult(hit, e, args, env, f);
    return { t: false, obj: { cls: cls || null, fields: new Map() } };
  }

  /** Resolves an include path (as PHP would) to a file of the project, or null. */
  resolveInclude(candidate, currentFile) {
    if (!this.project || typeof candidate !== 'string' || candidate.includes('<') || /^[a-z]+:\/\//i.test(candidate)) return null;
    const posix = require('path').posix;
    const dirOf = (file) => (file && file.includes('/') ? file.slice(0, file.lastIndexOf('/')) : '');
    const tries = [];
    if (candidate.startsWith('/')) tries.push(candidate.replace(/^\/+/, ''));
    else {
      tries.push(posix.join(dirOf(this.entry), candidate));
      tries.push(posix.join(dirOf(currentFile), candidate));
      tries.push(candidate);
    }
    for (const t of tries) {
      const norm = posix.normalize(t).replace(/^\.\//, '');
      if (!norm.startsWith('..') && this.project.programs.has(norm)) return norm;
    }
    return null;
  }

  /** Runs an included file in the including scope (PHP semantics). */
  executeInclude(target, e, env, f) {
    if (!this.project || !target) return;
    const depth = f.includeDepth || 0;
    if (depth >= 4 || this.includeCount >= 60) return;
    const candidates = V.alternatives(target);
    if (!candidates) return;
    const files = [];
    for (const c of candidates) {
      const rel = this.resolveInclude(c, f.file || this.entry);
      if (!rel || files.includes(rel)) continue;
      if (e.once && env.included && env.included.has(rel)) continue;
      if ((f.including || []).includes(rel) || rel === (f.file || this.entry)) continue;
      files.push(rel);
    }
    if (files.length === 0) return;
    const branches = files.map((rel) => {
      const branch = files.length > 1 ? env.clone() : env;
      branch.included = new Set([...(branch.included || []), rel]);
      const sub = { ...f, file: rel, includeDepth: depth + 1, including: [...(f.including || []), rel] };
      this.includeCount++;
      this.execBlock(this.project.programs.get(rel).main, branch, sub);
      if (branch.bottom && branch.haltKind === 'top-return') { branch.bottom = false; branch.haltKind = null; }
      return branch;
    });
    if (files.length > 1) {
      const merged = branches[0];
      for (const b of branches.slice(1)) merged.joinFrom(b);
      this.replace(env, merged);
      env.included = merged.included;
    }
  }

  ctxApi(env, f) {
    const api = {
      env,
      opts: this.opts,
      evalExpr: (x) => this.eval(x, env, f),
      readPath: (p) => this.read(p, env, f),
      // lets catalogs apply another catalog function (e.g. an array_map callback)
      callCatalog: (callee, argVals, line) => (this.cat.call ? this.cat.call(callee, argVals, { callee, args: [], line: line || 0 }, api) : null),
    };
    return api;
  }

  evalCall(e, env, f) {
    const argExprs = e.args || [];
    const args = argExprs.map((a) => this.eval(a, env, f));
    const callee = e.callee || '';

    // user-defined code first
    const user = this.resolveUser(e, env, f);
    if (user) {
      const res = this.invoke(user.fn, args, argExprs, user.thisVal, e.line);
      if (user.receiver && res.thisOut && res.thisOut.obj) this.write(user.receiver, res.thisOut, env, f, e.line);
      user.fn.params.forEach((p, i) => {
        const a = argExprs[i];
        if (p.byRef && a && a.k === 'path' && res.byRefOut && res.byRefOut.has(p.name)) this.write(a, res.byRefOut.get(p.name), env, f, e.line);
      });
      return res.ret ? V.step(res.ret, e.line, `returned by ${user.fn.name}()`) : V.CLEAN;
    }

    if (callee === 'fn:define' && args[0] && args[0].str !== undefined) {
      this.constants.set(args[0].str, args[1] || V.CLEAN);
      return V.CLEAN;
    }
    if (callee === 'fn:dirname' && args[0]) {
      const alts = V.alternatives(args[0]);
      if (alts && alts.length === 1) return V.constant(alts[0].includes('/') ? alts[0].slice(0, alts[0].lastIndexOf('/')) || '/' : '.');
    }
    if (callee === '@include') {
      const hit = this.cat.call ? this.cat.call(callee, args, e, this.ctxApi(env, f)) : null;
      if (hit) this.applyCatalogResult(hit, e, args, env, f);
      this.executeInclude(args[0], e, env, f);
      return V.CLEAN;
    }
    if (callee === '@inline') {
      const text = argExprs[0] && argExprs[0].value !== undefined ? String(argExprs[0].value) : '';
      env.out = contexts.htmlScan({ ...env.out }, text);
      return V.CLEAN;
    }

    const hit = this.cat.call ? this.cat.call(callee, args, e, this.ctxApi(env, f)) : null;
    if (hit) return this.applyCatalogResult(hit, e, args, env, f);

    // unknown function: result depends on arguments, with lower confidence;
    // helpers named like escaping functions (defined elsewhere) are probably sanitizers
    const joined = V.joinAll(args.map((a) => (a.arr ? V.joinAll([...a.arr.values()]) : a)));
    const bare = callee.replace(/^\w+:/, '').split('::').pop();
    const escaperLike = /^(e|h|esc\w*|escape\w*|\w*_?(sanitize|sanitise|clean|purify|encode|filter|safe|xss)\w*|html\w*)$/i.test(bare);
    return joined.t ? V.step(V.weaken(joined, escaperLike ? 2 : 1), e.line, `through ${bare}()`) : V.CLEAN;
  }

  applyCatalogResult(hit, e, args, env, f) {
    for (const sink of hit.sinks || []) this.checkSink(sink, e, args, env, f);
    for (const [idx, v] of hit.byRef || []) {
      const a = e.args[idx];
      if (a && (a.k === 'path' || a.k === 'list')) this.write(a, v, env, f, e.line);
    }
    return hit.value || V.CLEAN;
  }

  resolveUser(e, env, f) {
    const callee = e.callee || '';
    if (callee.startsWith('fn:')) {
      const fn = this.findFunction(callee.slice(3).replace(/^\\/, '').split('\\').pop());
      return fn ? { fn, thisVal: null } : null;
    }
    if (callee.startsWith('m:') && e.recv) {
      const name = callee.slice(2);
      const recv = this.eval(e.recv, env, f);
      let fn = null;
      if (recv.obj && recv.obj.cls) {
        const def = this.findClass(recv.obj.cls);
        if (def) fn = this.findMethod(def, name);
      }
      if (!fn) {
        const candidates = this.methodsNamed(name);
        if (candidates.length === 1 && !(this.cat.isKnownMethod && this.cat.isKnownMethod(name))) fn = candidates[0];
      }
      if (!fn) return null;
      const thisVal = recv.obj ? recv : this.newObjectValue(fn.cls || '', false);
      return { fn, thisVal, receiver: e.recv.k === 'path' ? e.recv : null };
    }
    if (callee.startsWith('sm:')) {
      const [cls, name] = callee.slice(3).split('::');
      let def = null;
      if (['self', 'static'].includes(cls) && f.fn && f.fn.cls) def = this.findClass(f.fn.cls);
      else if (cls === 'parent' && f.fn && f.fn.cls) {
        const own = this.findClass(f.fn.cls);
        def = own && own.parent ? this.findClass(own.parent) : null;
      } else def = this.findClass(cls);
      const fn = def ? this.findMethod(def, name) : null;
      if (!fn) return null;
      const thisVal = env.vars.get('this') || null;
      return { fn, thisVal };
    }
    return null;
  }

  invoke(fn, args, argExprs, thisVal, line) {
    this.analyzed.add(fn);
    const fallback = () => {
      const joined = V.joinAll(args);
      return { ret: joined.t ? V.weaken(joined) : V.CLEAN, thisOut: thisVal, byRefOut: new Map() };
    };
    if (this.depth >= MAX_DEPTH || this.exhausted) return fallback();
    const key = `${fn.id}#${signature(args)}#${signature([thisVal])}`;
    if (this.memo.has(key)) {
      const cached = this.memo.get(key);
      // findings produced inside this function are reachable from the current entry point too
      for (const k of cached.hitKeys || []) { const h = this.hits.get(k); if (h) h.entries.add(this.entry); }
      return cached;
    }
    this.memo.set(key, fallback()); // recursion guard
    const logStart = this.hitLog.length;
    const env = new Env();
    fn.params.forEach((p, i) => {
      let v = args[i];
      if (p.variadic) v = V.joinAll(args.slice(i));
      if (v === undefined) v = p.def ? this.eval(p.def, env, { fn, file: fn.file }) : V.CLEAN;
      env.vars.set(p.name, v && v.t ? V.step(v, line, `passed to ${fn.name}() as $${p.name}`) : v);
    });
    if (thisVal) env.vars.set('this', thisVal);
    const f = { fn, file: fn.file || this.p.file, ret: null, thisOut: null, byRefParams: fn.params.filter((p) => p.byRef).map((p) => p.name), byRefOut: new Map() };
    this.depth++;
    try {
      this.execBlock(fn.body, env, f);
    } finally {
      this.depth--;
    }
    if (!env.bottom) this.recordExit(env, f);
    const result = { ret: f.ret || V.CLEAN, thisOut: f.thisOut || thisVal, byRefOut: f.byRefOut, hitKeys: this.hitLog.slice(logStart) };
    this.memo.set(key, result);
    return result;
  }

  /* ---------------------------------------------------------------- sinks */

  checkSink(sink, e, args, env, f = {}) {
    let value;
    if (sink.value) value = sink.value;
    else if (sink.arg === 'all') value = V.concat(args);
    else value = args[sink.arg];
    if (!value) return;
    let unsafe;
    if (sink.check === 'html') {
      const res = contexts.html(value, env.out);
      env.out = res.state;
      unsafe = res.unsafe;
    } else if (!value.t) {
      return;
    } else {
      const fn = contexts[sink.check] || contexts.any;
      unsafe = sink.check === 'urlControl' ? contexts.urlControl(value, sink.prefixRe) : fn(value);
    }
    if (!unsafe || !unsafe.length) return;
    for (const u of unsafe) {
      const v = u.v;
      if (!v.origins || !v.origins.some((o) => o === 'src' || o === 'src2')) continue;
      const conf = Math.min(2, (v.c || 0) + (v.g ? 2 : 0) + (sink.confPenalty || 0));
      const file = f.file || this.p.file;
      const key = `${file}|${sink.rule}|${e.line}|${e.col || 0}`;
      const prev = this.hits.get(key);
      this.hitLog.push(key);
      if (prev) prev.entries.add(this.entry);
      if (prev && prev.conf <= conf && prev.trace.length <= (v.trace || []).length) continue;
      this.hits.set(key, {
        file,
        entries: prev ? prev.entries : new Set([this.entry]),
        rule: sink.rule,
        line: e.line,
        col: e.col || null,
        sink: sink.name || e.callee,
        context: u.context,
        conf,
        trace: (v.trace || []).slice(),
        secondOrder: Boolean(v.origins && v.origins.includes('src2') && !v.origins.includes('src')),
      });
    }
  }
}

module.exports = { Interpreter, Env };
