'use strict';
/*
 * Lowers a php-parser AST into the taint IR understood by core/taint/interpreter.js.
 * Language constructs become pseudo-callees: @echo @print @inline @include @eval @shell @exit @dyncall.
 */

function lineOf(n) {
  return n && n.loc ? n.loc.start.line : 0;
}

function colOf(n) {
  return n && n.loc ? n.loc.start.column + 1 : 0;
}

function nameOf(n) {
  if (!n) return '';
  if (typeof n === 'string') return n;
  if (n.kind === 'identifier' || n.kind === 'name') return n.name;
  return '';
}

function lastSegment(name) {
  return String(name || '').replace(/^\\/, '').split('\\').pop();
}

class Lowerer {
  constructor(file) {
    this.file = file;
    this.functions = new Map();
    this.classes = new Map();
    this.methodsByName = new Map();
    this.allFunctions = [];
    this.nextId = 0;
    this.currentClass = null;
  }

  program(ast) {
    const main = this.block(ast.children);
    return {
      file: this.file,
      main,
      functions: this.functions,
      classes: this.classes,
      methodsByName: this.methodsByName,
      allFunctions: this.allFunctions,
    };
  }

  block(nodes) {
    const out = [];
    for (const n of nodes || []) {
      const s = this.stmt(n);
      if (Array.isArray(s)) out.push(...s);
      else if (s) out.push(s);
    }
    return out;
  }

  body(n) {
    if (!n) return [];
    if (n.kind === 'block') return this.block(n.children);
    return this.block([n]);
  }

  /* ------------------------------------------------------------ statements */

  stmt(n) {
    if (!n) return null;
    const line = lineOf(n);
    switch (n.kind) {
      case 'expressionstatement':
        return this.exprStmt(n.expression);
      case 'echo':
        return n.expressions.map((x) => ({ k: 'expr', line: lineOf(x) || line, expr: this.call('@echo', [this.expr(x)], x, n) }));
      case 'inline':
        return { k: 'expr', line, expr: { k: 'call', callee: '@inline', args: [{ k: 'lit', value: n.value, line }], line } };
      case 'block':
        return this.block(n.children);
      case 'if':
        return { k: 'if', line, test: this.expr(n.test), then: this.body(n.body), else: n.alternate ? this.body(n.alternate) : [] };
      case 'while':
        return { k: 'loop', line, test: this.expr(n.test), body: this.body(n.body), init: [], update: [] };
      case 'do':
        return [...this.body(n.body), { k: 'loop', line, test: this.expr(n.test), body: this.body(n.body), init: [], update: [] }];
      case 'for':
        return {
          k: 'loop',
          line,
          init: (n.init || []).map((x) => this.exprStmt(x)).flat(),
          test: n.test && n.test.length ? this.expr(n.test[n.test.length - 1]) : null,
          update: (n.increment || []).map((x) => this.exprStmt(x)).flat(),
          body: this.body(n.body),
        };
      case 'foreach':
        return {
          k: 'loop',
          line,
          init: [],
          update: [],
          each: { source: this.expr(n.source), key: n.key ? this.lvalue(n.key) : null, value: n.value ? this.lvalue(n.value.kind === 'byref' ? n.value.what : n.value) : null, taintedKeys: true },
          body: this.body(n.body),
        };
      case 'switch': {
        const cases = (n.body && n.body.children ? n.body.children : []).filter((c) => c.kind === 'case');
        return { k: 'switch', line, test: this.expr(n.test), cases: cases.map((c) => ({ line: lineOf(c), test: c.test ? this.expr(c.test) : null, body: this.body(c.body) })) };
      }
      case 'try':
        return {
          k: 'try',
          line,
          body: this.body(n.body),
          catches: (n.catches || []).map((c) => ({ line: lineOf(c), target: c.variable ? this.lvalue(c.variable) : null, body: this.body(c.body) })),
          fin: n.always ? this.body(n.always) : null,
        };
      case 'return':
        return { k: 'return', line, expr: n.expr ? this.expr(n.expr) : null };
      case 'throw':
        return [{ k: 'expr', line, expr: this.expr(n.what) }, { k: 'halt', line }];
      case 'global':
        return { k: 'global', line, names: (n.items || []).map((v) => (typeof v.name === 'string' ? v.name : '')).filter(Boolean) };
      case 'static':
        return (n.variables || []).map((sv) => ({ k: 'assign', line, target: this.lvalue(sv.variable), expr: sv.defaultValue ? this.expr(sv.defaultValue) : { k: 'lit', value: null }, op: '=' }));
      case 'unset':
        return { k: 'unset', line, targets: (n.variables || []).map((v) => this.lvalue(v)) };
      case 'function':
        this.declareFunction(n);
        return null;
      case 'class':
      case 'trait':
        this.declareClass(n);
        return null;
      case 'interface':
      case 'enum':
        return null;
      case 'namespace':
        return this.block(n.children);
      case 'declare':
        return this.block(n.children || []);
      case 'label': case 'goto': case 'break': case 'continue': case 'usegroup': case 'useitem': case 'constantstatement': case 'noop':
        return null;
      case 'exit':
        return this.exprStmt(n);
      default:
        // expressions used as statements (php-parser normally wraps them)
        if (n.kind) return this.exprStmt(n);
        return null;
    }
  }

  exprStmt(x) {
    if (!x) return null;
    const line = lineOf(x);
    if (x.kind === 'assign' || x.kind === 'assignref') {
      return { k: 'assign', line, target: this.lvalue(x.left), expr: this.expr(x.right), op: x.operator || '=' };
    }
    if (x.kind === 'exit') {
      const out = [];
      if (x.expression) out.push({ k: 'expr', line, expr: this.call('@exit', [this.expr(x.expression)], x, x) });
      out.push({ k: 'halt', line });
      return out;
    }
    if (x.kind === 'post' || x.kind === 'pre') {
      return { k: 'assign', line, target: this.lvalue(x.what), expr: { k: 'lit', value: 0 }, op: '+=' };
    }
    return { k: 'expr', line, expr: this.expr(x) };
  }

  /* ----------------------------------------------------------- functions */

  makeFn(n, name, cls) {
    const prevClass = this.currentClass;
    if (cls) this.currentClass = cls;
    const fn = {
      id: `${this.file}#${this.nextId++}`,
      name: name || '{closure}',
      cls: cls || null,
      line: lineOf(n),
      params: (n.arguments || []).map((p) => ({
        name: nameOf(p.name),
        byRef: Boolean(p.byref),
        variadic: Boolean(p.variadic),
        def: p.value ? this.expr(p.value) : null,
        type: p.type ? nameOf(p.type) : null,
      })),
      body: [],
    };
    if (n.kind === 'arrowfunc') fn.body = [{ k: 'return', line: lineOf(n.body), expr: this.expr(n.body) }];
    else fn.body = n.body ? this.body(n.body) : [];
    this.currentClass = prevClass;
    this.allFunctions.push(fn);
    return fn;
  }

  declareFunction(n) {
    const name = nameOf(n.name);
    const fn = this.makeFn(n, name, null);
    this.functions.set(lastSegment(name).toLowerCase(), fn);
  }

  declareClass(n) {
    const name = nameOf(n.name) || `{anonymous@${lineOf(n)}}`;
    const cls = { name, parent: n.extends ? lastSegment(nameOf(n.extends)) : null, methods: new Map(), props: [] };
    this.classes.set(lastSegment(name).toLowerCase(), cls);
    for (const member of n.body || []) {
      if (member.kind === 'method') {
        const mname = nameOf(member.name);
        const fn = this.makeFn(member, `${name}::${mname}`, name);
        cls.methods.set(mname.toLowerCase(), fn);
        const list = this.methodsByName.get(mname.toLowerCase()) || [];
        list.push(fn);
        this.methodsByName.set(mname.toLowerCase(), list);
      } else if (member.kind === 'propertystatement') {
        for (const p of member.properties || []) cls.props.push({ name: nameOf(p.name), def: p.value ? this.expr(p.value) : null });
      } else if (member.kind === 'traituse') {
        // trait methods are resolved by unique method name
      }
    }
    return cls;
  }

  /* ---------------------------------------------------------- lvalues */

  lvalue(n) {
    if (!n) return { k: 'none' };
    switch (n.kind) {
      case 'variable':
        if (typeof n.name !== 'string') return { k: 'none' };
        return { k: 'path', base: n.name, segs: [], line: lineOf(n) };
      case 'offsetlookup': {
        const base = this.lvalue(n.what);
        if (base.k !== 'path') return { k: 'none' };
        return { ...base, segs: base.segs.concat([{ key: this.keyOf(n.offset, true) }]) };
      }
      case 'propertylookup':
      case 'nullsafepropertylookup': {
        const base = this.lvalue(n.what);
        const prop = n.offset && n.offset.kind === 'identifier' ? n.offset.name : null;
        if (base.k !== 'path' || prop === null) return { k: 'none' };
        return { ...base, segs: base.segs.concat([{ prop }]) };
      }
      case 'staticlookup': {
        const prop = n.offset && n.offset.kind === 'variable' ? n.offset.name : nameOf(n.offset);
        return { k: 'path', base: `static:${nameOf(n.what)}::${prop}`, segs: [], line: lineOf(n) };
      }
      case 'list':
      case 'array':
        return {
          k: 'list',
          items: (n.items || []).map((it) => {
            if (!it) return null;
            const entry = it.kind === 'entry' ? it : { key: null, value: it };
            if (!entry.value) return null;
            const key = entry.key && (entry.key.kind === 'string' || entry.key.kind === 'number') ? String(entry.key.value) : null;
            return { key, target: this.lvalue(entry.value) };
          }),
        };
      case 'byref':
        return this.lvalue(n.what);
      default:
        return { k: 'none' };
    }
  }

  keyOf(offset, forWrite) {
    if (offset === null || offset === undefined || offset === false) return forWrite ? null : '*';
    if (offset.kind === 'string' || offset.kind === 'number') return String(offset.value);
    if (offset.kind === 'boolean') return offset.value ? '1' : '0';
    return '*';
  }

  /* ------------------------------------------------------- expressions */

  call(callee, args, node, stmtNode) {
    return { k: 'call', callee, args, line: lineOf(node) || lineOf(stmtNode), col: colOf(node) };
  }

  args(list) {
    return (list || []).map((a) => {
      if (!a) return { k: 'lit', value: null };
      if (a.kind === 'namedargument') return this.expr(a.value);
      if (a.kind === 'variadic') return { k: 'unknown', parts: [this.expr(a.what)] };
      return this.expr(a);
    });
  }

  expr(n) {
    if (!n) return { k: 'lit', value: null };
    const line = lineOf(n);
    switch (n.kind) {
      case 'string':
      case 'nowdoc':
        return { k: 'lit', value: String(n.value), line };
      case 'number': {
        const num = Number(String(n.value).replace(/_/g, ''));
        return { k: 'lit', value: Number.isFinite(num) ? num : 0, line };
      }
      case 'boolean':
        return { k: 'lit', value: Boolean(n.value), line };
      case 'nullkeyword':
        return { k: 'lit', value: null, line };
      case 'magic':
        return { k: 'lit', value: `<${String(n.value || n.raw || 'magic')}>`, line };
      case 'encapsed': {
        const parts = (n.value || []).map((p) => {
          const x = p.kind === 'encapsedpart' ? p.expression : p;
          if (x && x.kind === 'string') return { k: 'lit', value: String(x.value), line: lineOf(x) };
          return this.expr(x);
        });
        const value = { k: 'concat', parts, line };
        if (n.type === 'shell') return this.call('@shell', [value], n);
        return value;
      }
      case 'variable':
        if (typeof n.name !== 'string') return { k: 'unknown', parts: [this.expr(n.name)], line };
        return { k: 'path', base: n.name, segs: [], line };
      case 'offsetlookup':
      case 'propertylookup':
      case 'nullsafepropertylookup': {
        const lv = this.lvalue(n);
        if (lv.k === 'path') {
          // reading uses '*' for dynamic and missing keys
          lv.segs = lv.segs.map((s) => (s.key === null ? { key: '*' } : s));
          return lv;
        }
        return { k: 'unknown', parts: [this.expr(n.what)], line };
      }
      case 'staticlookup': {
        if (n.offset && n.offset.kind === 'variable') return { k: 'path', base: `static:${nameOf(n.what)}::${n.offset.name}`, segs: [], line };
        return { k: 'const', name: `${nameOf(n.what)}::${nameOf(n.offset)}`, line };
      }
      case 'name':
        return { k: 'const', name: lastSegment(n.name), line };
      case 'bin': {
        if (n.type === '.') {
          const parts = [];
          const flatten = (x) => { if (x.kind === 'bin' && x.type === '.') { flatten(x.left); flatten(x.right); } else parts.push(this.expr(x)); };
          flatten(n);
          return { k: 'concat', parts, line };
        }
        return { k: 'bin', op: n.type, left: this.expr(n.left), right: this.expr(n.right), line };
      }
      case 'unary':
        return { k: 'unary', op: n.type, expr: this.expr(n.what), line };
      case 'cast':
        return { k: 'cast', type: n.type, expr: this.expr(n.expr), line };
      case 'retif':
        return { k: 'ternary', test: this.expr(n.test), then: n.trueExpr ? this.expr(n.trueExpr) : null, else: this.expr(n.falseExpr), line };
      case 'assign':
      case 'assignref':
        return { k: 'assign', target: this.lvalue(n.left), expr: this.expr(n.right), op: n.operator || '=', line };
      case 'pre':
      case 'post':
        return { k: 'assign', target: this.lvalue(n.what), expr: { k: 'lit', value: 0 }, op: '+=', line };
      case 'call': {
        const w = n.what;
        const args = this.args(n.arguments);
        if (w.kind === 'name') return { k: 'call', callee: `fn:${lastSegment(w.name).toLowerCase()}`, args, line, col: colOf(n) };
        if ((w.kind === 'propertylookup' || w.kind === 'nullsafepropertylookup') && w.offset && w.offset.kind === 'identifier') {
          return { k: 'call', callee: `m:${w.offset.name.toLowerCase()}`, recv: this.expr(w.what), args, line, col: colOf(n) };
        }
        if (w.kind === 'staticlookup' && w.offset && w.offset.kind === 'identifier') {
          return { k: 'call', callee: `sm:${lastSegment(nameOf(w.what)).toLowerCase()}::${w.offset.name.toLowerCase()}`, args, line, col: colOf(n) };
        }
        return { k: 'call', callee: '@dyncall', args: [this.expr(w), ...args], line, col: colOf(n) };
      }
      case 'new': {
        if (n.what && n.what.kind === 'class') {
          const cls = this.declareClass(n.what);
          return { k: 'new', cls: cls.name, args: this.args(n.arguments), line };
        }
        const cls = n.what && n.what.kind === 'name' ? lastSegment(n.what.name) : null;
        return { k: 'new', cls, args: this.args(n.arguments), line };
      }
      case 'array':
        return {
          k: 'array',
          line,
          items: (n.items || []).map((it) => {
            if (!it) return null;
            if (it.kind === 'entry') return { key: it.key ? this.expr(it.key) : null, value: this.expr(it.value), unpack: Boolean(it.unpack) };
            return { key: null, value: this.expr(it), unpack: false };
          }),
        };
      case 'list':
        return { k: 'unknown', parts: [], line };
      case 'isset':
      case 'empty':
        return { k: 'unknown', parts: [], line };
      case 'silent':
        return this.expr(n.expr);
      case 'include':
        return this.call('@include', [this.expr(n.target)], n);
      case 'eval':
        return this.call('@eval', [this.expr(n.source)], n);
      case 'exit':
        return n.expression ? this.call('@exit', [this.expr(n.expression)], n) : { k: 'lit', value: null, line };
      case 'print':
        return this.call('@print', [this.expr(n.expression)], n);
      case 'echo':
        return this.call('@echo', n.expressions.map((x) => this.expr(x)), n);
      case 'closure':
      case 'arrowfunc':
        return { k: 'closure', fn: this.makeFn(n, null, this.currentClass), line };
      case 'clone':
        return this.expr(n.what);
      case 'match':
        return { k: 'unknown', parts: (n.arms || []).map((a) => this.expr(a.body)), line };
      case 'cast_unset':
        return { k: 'lit', value: null, line };
      case 'byref':
        return this.expr(n.what);
      case 'yield':
      case 'yieldfrom':
        return { k: 'unknown', parts: n.value ? [this.expr(n.value)] : [], line };
      case 'throw':
        return this.expr(n.what);
      default:
        return { k: 'unknown', parts: [], line };
    }
  }
}

/** @returns IR program for core/taint/interpreter.js */
function lower(ast, file) {
  return new Lowerer(file).program(ast);
}

module.exports = { lower, lastSegment };
