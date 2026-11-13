'use strict';
/*
 * Lowers a Babel (JavaScript / TypeScript) AST into the taint IR of core/taint/interpreter.js.
 *
 *  - Module bindings are resolved statically: `const { exec } = require('child_process')`,
 *    `import * as cp from 'node:child_process'` and `cp.exec(x)` all become the callee
 *    `fn:child_process.exec`; other calls are `fn:<name>` or `m:<method>` with a receiver.
 *  - Property access uses key segments (JavaScript objects are dictionaries).
 *  - Functions capture their defining scope (closures); `+` is concatenation, `||`/`&&`
 *    return one of their operands, and `+=` appends.
 *  - Pseudo-callees: @require @import @invoke @seq @jsx @tag:<name> @dyncall.
 */

const LOOP_TYPES = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']);

function lineOf(n) {
  return n && n.loc ? n.loc.start.line : 0;
}

function colOf(n) {
  return n && n.loc ? n.loc.start.column + 1 : 0;
}

function moduleName(spec) {
  let s = String(spec || '').replace(/^node:/, '');
  if (s === 'fs/promises') s = 'fs';
  if (s === 'mysql2/promise') s = 'mysql2';
  if (s === 'timers/promises') s = 'timers';
  if (s === 'child_process/promises') s = 'child_process';
  return s;
}

const isLocalModule = (spec) => /^[./]/.test(String(spec || ''));

function stringOf(n) {
  if (!n) return null;
  if (n.type === 'StringLiteral') return n.value;
  if (n.type === 'TemplateLiteral' && n.expressions.length === 0) return n.quasis.map((q) => q.value.cooked).join('');
  return null;
}

function unwrap(n) {
  let x = n;
  while (x && ['TSAsExpression', 'TSNonNullExpression', 'TSTypeAssertion', 'TSSatisfiesExpression', 'ParenthesizedExpression', 'TypeCastExpression', 'TSInstantiationExpression'].includes(x.type)) x = x.expression;
  return x;
}

function propName(member) {
  if (!member) return null;
  if (!member.computed && member.property && (member.property.type === 'Identifier' || member.property.type === 'PrivateName')) {
    return member.property.type === 'PrivateName' ? `#${member.property.id.name}` : member.property.name;
  }
  if (member.computed) {
    const s = stringOf(member.property);
    if (s !== null) return s;
    if (member.property && member.property.type === 'NumericLiteral') return String(member.property.value);
  }
  return null;
}

function isRequireCall(n) {
  const x = unwrap(n);
  return x && x.type === 'CallExpression' && x.callee.type === 'Identifier' && x.callee.name === 'require' && x.arguments.length >= 1 && stringOf(x.arguments[0]) !== null;
}

class JsLowerer {
  constructor(file) {
    this.file = file;
    this.functions = new Map();
    this.classes = new Map();
    this.methodsByName = new Map();
    this.allFunctions = [];
    this.nextId = 0;
    this.currentClass = null;
    this.bindings = new Map(); // local name -> qualified module path ("child_process" or "child_process.exec")
    this.declared = new Set(); // names of function declarations (hoisted)
  }

  program(ast) {
    this.collect(ast.program);
    const main = this.block(ast.program.body);
    return {
      file: this.file,
      main,
      functions: this.functions,
      classes: this.classes,
      methodsByName: this.methodsByName,
      allFunctions: this.allFunctions,
    };
  }

  /* ------------------------------------------------- module bindings (pre-pass) */

  /** Qualified module path for an expression such as require('x').y or a bound identifier. */
  qualify(n) {
    const x = unwrap(n);
    if (!x) return null;
    if (isRequireCall(x)) {
      const spec = stringOf(x.arguments[0]);
      return isLocalModule(spec) ? null : moduleName(spec);
    }
    if (x.type === 'Identifier') return this.bindings.get(x.name) || null;
    if ((x.type === 'MemberExpression' || x.type === 'OptionalMemberExpression') && propName(x) !== null) {
      const base = this.qualify(x.object);
      return base ? `${base}.${propName(x)}` : null;
    }
    // util.promisify(cp.exec) keeps the identity of the wrapped function
    if (x.type === 'CallExpression' && x.arguments.length === 1) {
      const callee = this.qualify(x.callee);
      if (callee === 'util.promisify' || callee === 'bluebird.promisify') return this.qualify(x.arguments[0]);
    }
    return null;
  }

  bindPattern(pattern, qualified) {
    if (!pattern || !qualified) return;
    if (pattern.type === 'Identifier') {
      this.bindings.set(pattern.name, qualified);
    } else if (pattern.type === 'ObjectPattern') {
      for (const p of pattern.properties) {
        if (p.type !== 'ObjectProperty') continue;
        const key = p.computed ? stringOf(p.key) : (p.key.type === 'Identifier' ? p.key.name : stringOf(p.key));
        if (key === null) continue;
        const target = p.value.type === 'AssignmentPattern' ? p.value.left : p.value;
        this.bindPattern(target, `${qualified}.${key}`);
      }
    }
  }

  collect(root) {
    const visit = (n) => {
      if (!n || typeof n.type !== 'string') return;
      if (n.type === 'ImportDeclaration' && !isLocalModule(n.source.value)) {
        const mod = moduleName(n.source.value);
        for (const s of n.specifiers) {
          if (s.type === 'ImportDefaultSpecifier' || s.type === 'ImportNamespaceSpecifier') this.bindings.set(s.local.name, mod);
          else if (s.type === 'ImportSpecifier') {
            const imported = s.imported.type === 'Identifier' ? s.imported.name : s.imported.value;
            this.bindings.set(s.local.name, imported === 'default' ? mod : `${mod}.${imported}`);
          }
        }
      } else if (n.type === 'VariableDeclarator' && n.init) {
        const q = this.qualify(n.init);
        if (q) this.bindPattern(n.id, q);
      } else if (n.type === 'TSImportEqualsDeclaration' && n.moduleReference && n.moduleReference.type === 'TSExternalModuleReference') {
        const spec = n.moduleReference.expression.value;
        if (!isLocalModule(spec)) this.bindings.set(n.id.name, moduleName(spec));
      } else if (n.type === 'FunctionDeclaration' && n.id) {
        this.declared.add(n.id.name);
      }
      for (const key of Object.keys(n)) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'extra' || key === 'leadingComments' || key === 'trailingComments' || key === 'innerComments') continue;
        const v = n[key];
        if (Array.isArray(v)) v.forEach(visit);
        else if (v && typeof v.type === 'string') visit(v);
      }
    };
    visit(root);
  }

  /* -------------------------------------------------------------- statements */

  block(nodes) {
    const out = [];
    for (const n of nodes || []) {
      const s = this.stmt(n);
      if (Array.isArray(s)) out.push(...s.filter(Boolean));
      else if (s) out.push(s);
    }
    return out;
  }

  body(n) {
    if (!n) return [];
    if (n.type === 'BlockStatement') return this.block(n.body);
    const s = this.stmt(n);
    if (Array.isArray(s)) return s.filter(Boolean);
    return s ? [s] : [];
  }

  stmt(n) {
    if (!n) return null;
    const line = lineOf(n);
    switch (n.type) {
      case 'ExpressionStatement':
        return this.exprStmt(n.expression);
      case 'VariableDeclaration':
        return n.declarations.map((d) => this.declarator(d)).flat();
      case 'FunctionDeclaration':
        this.declareFunction(n);
        return null;
      case 'ClassDeclaration':
        this.declareClass(n);
        return null;
      case 'IfStatement':
        return { k: 'if', line, test: this.expr(n.test), then: this.body(n.consequent), else: n.alternate ? this.body(n.alternate) : [] };
      case 'BlockStatement':
      case 'StaticBlock':
        return this.block(n.body);
      case 'ReturnStatement':
        return { k: 'return', line, expr: n.argument ? this.expr(n.argument) : null };
      case 'ThrowStatement':
        return [{ k: 'expr', line, expr: this.expr(n.argument) }, { k: 'halt', line }];
      case 'TryStatement':
        return {
          k: 'try',
          line,
          body: this.body(n.block),
          catches: n.handler ? [{ line: lineOf(n.handler), target: n.handler.param ? this.lvalue(n.handler.param) : null, body: this.body(n.handler.body) }] : [],
          fin: n.finalizer ? this.body(n.finalizer) : null,
        };
      case 'SwitchStatement':
        return { k: 'switch', line, test: this.expr(n.discriminant), cases: n.cases.map((c) => ({ line: lineOf(c), test: c.test ? this.expr(c.test) : null, body: this.block(c.consequent) })) };
      case 'LabeledStatement':
        return this.stmt(n.body);
      case 'ExportNamedDeclaration':
        return n.declaration ? this.stmt(n.declaration) : null;
      case 'ExportDefaultDeclaration': {
        const d = n.declaration;
        if (d.type === 'FunctionDeclaration') {
          this.declareFunction(d, d.id ? d.id.name : 'default');
          return null;
        }
        if (d.type === 'ClassDeclaration') {
          this.declareClass(d);
          return null;
        }
        if (d.type === 'ArrowFunctionExpression' || d.type === 'FunctionExpression') {
          this.registerExport('default', this.makeFn(d, 'default'));
          return null;
        }
        return { k: 'expr', line, expr: this.expr(d) };
      }
      case 'TSExportAssignment':
        return { k: 'expr', line, expr: this.expr(n.expression) };
      default:
        if (LOOP_TYPES.has(n.type)) return this.loop(n);
        return null;
    }
  }

  loop(n) {
    const line = lineOf(n);
    if (n.type === 'ForStatement') {
      const init = n.init ? (n.init.type === 'VariableDeclaration' ? this.body(n.init) : [this.exprStmt(n.init)].flat()) : [];
      return { k: 'loop', line, init, test: n.test ? this.expr(n.test) : null, update: n.update ? [this.exprStmt(n.update)].flat() : [], body: this.body(n.body) };
    }
    if (n.type === 'ForOfStatement' || n.type === 'ForInStatement') {
      const left = n.left.type === 'VariableDeclaration' ? n.left.declarations[0].id : n.left;
      const target = this.lvalue(left);
      const each = n.type === 'ForOfStatement'
        ? { source: this.expr(n.right), key: null, value: target }
        : { source: this.expr(n.right), key: target, value: null, taintedKeys: true };
      return { k: 'loop', line, init: [], update: [], each, body: this.body(n.body) };
    }
    if (n.type === 'DoWhileStatement') {
      return [...this.body(n.body), { k: 'loop', line, test: this.expr(n.test), body: this.body(n.body), init: [], update: [] }];
    }
    return { k: 'loop', line, test: this.expr(n.test), body: this.body(n.body), init: [], update: [] };
  }

  declarator(d) {
    const line = lineOf(d);
    if (!d.init) {
      return d.id.type === 'Identifier' ? { k: 'assign', line, target: this.lvalue(d.id), expr: { k: 'lit', value: null, line }, op: '=' } : null;
    }
    const init = unwrap(d.init);
    // const handler = (req, res) => { ... } is callable by name like a declaration
    if (d.id.type === 'Identifier' && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
      const fn = this.makeFn(init, d.id.name);
      this.functions.set(d.id.name, fn);
      return { k: 'assign', line, target: this.lvalue(d.id), expr: { k: 'closure', fn, line }, op: '=' };
    }
    if (d.id.type === 'Identifier' && init.type === 'ClassExpression') {
      this.declareClass(init, d.id.name);
      return null;
    }
    return { k: 'assign', line, target: this.lvalue(d.id), expr: this.expr(d.init), op: '=' };
  }

  exprStmt(x) {
    const n = unwrap(x);
    if (!n) return null;
    const line = lineOf(n);
    if (n.type === 'AssignmentExpression') {
      const exported = this.noteExport(n);
      const rhs = exported ? { k: 'closure', fn: exported, line } : this.expr(n.right);
      this.noteObjectExports(n, rhs);
      return { k: 'assign', line, target: this.lvalue(n.left), expr: rhs, op: this.assignOp(n.operator) };
    }
    if (n.type === 'UpdateExpression') return { k: 'assign', line, target: this.lvalue(n.argument), expr: { k: 'lit', value: 0, line }, op: '+=' };
    if (n.type === 'SequenceExpression') return n.expressions.map((e) => this.exprStmt(e)).flat();
    // process.exit() stops the program
    if (n.type === 'CallExpression' && this.chainOf(n.callee).join('.') === 'process.exit') {
      return [{ k: 'expr', line, expr: this.expr(n) }, { k: 'halt', line }];
    }
    return { k: 'expr', line, expr: this.expr(n) };
  }

  assignOp(op) {
    if (op === '=') return '=';
    if (op === '+=') return '.=';
    if (op === '||=' || op === '??=' || op === '&&=') return '??=';
    return '-=';
  }

  /* -------------------------------------------------------- exports (module.exports / exports.x) */

  noteExport(assign) {
    const chain = this.chainOf(assign.left);
    const right = unwrap(assign.right);
    let name = null;
    if (chain.length === 3 && chain[0] === 'module' && chain[1] === 'exports') name = chain[2];
    else if (chain.length === 2 && chain[0] === 'exports') name = chain[1];
    if (name && right && (right.type === 'FunctionExpression' || right.type === 'ArrowFunctionExpression')) {
      const fn = this.makeFn(right, name);
      this.registerExport(name, fn);
      return fn;
    }
    return null;
  }

  /** module.exports = { name: function () {}, other } registers the functions it lists. */
  noteObjectExports(assign, rhs) {
    const chain = this.chainOf(assign.left);
    if (!(chain.length === 2 && chain[0] === 'module' && chain[1] === 'exports') || !rhs || rhs.k !== 'array') return;
    for (const item of rhs.items) {
      if (!item || !item.key || item.key.k !== 'lit' || typeof item.key.value !== 'string') continue;
      const v = item.value;
      if (v && v.k === 'closure' && v.fn) {
        v.fn.name = item.key.value;
        this.registerExport(item.key.value, v.fn);
      } else if (v && v.k === 'closure' && v.fnName && this.functions.has(v.fnName)) {
        this.registerExport(item.key.value, this.functions.get(v.fnName));
      }
    }
  }

  /** Exported functions are callable as plain functions and as methods of the module object. */
  registerExport(name, fn) {
    if (!this.functions.has(name)) this.functions.set(name, fn);
    const list = this.methodsByName.get(name) || [];
    list.push(fn);
    this.methodsByName.set(name, list);
  }

  /** Identifier chain of a member expression: a.b.c -> ['a', 'b', 'c'] (empty when dynamic). */
  chainOf(n) {
    const x = unwrap(n);
    if (!x) return [];
    if (x.type === 'Identifier') return [x.name];
    if (x.type === 'ThisExpression') return ['this'];
    if ((x.type === 'MemberExpression' || x.type === 'OptionalMemberExpression') && propName(x) !== null) {
      const base = this.chainOf(x.object);
      return base.length ? base.concat([propName(x)]) : [];
    }
    return [];
  }

  /* ---------------------------------------------------------------- functions */

  makeFn(n, name, cls = null) {
    const prevClass = this.currentClass;
    if (cls) this.currentClass = cls;
    const prologue = [];
    const params = (n.params || []).map((p, i) => {
      let node = p.type === 'TSParameterProperty' ? p.parameter : p;
      let def = null;
      let variadic = false;
      if (node.type === 'AssignmentPattern') {
        def = this.expr(node.right);
        node = node.left;
      }
      if (node.type === 'RestElement') {
        variadic = true;
        node = node.argument;
      }
      if (node.type === 'Identifier') return { name: node.name, byRef: false, variadic, def, type: null };
      const synthetic = `__arg${i}`;
      prologue.push({ k: 'assign', line: lineOf(node), target: this.lvalue(node), expr: { k: 'path', base: synthetic, segs: [], line: lineOf(node) }, op: '=' });
      return { name: synthetic, byRef: false, variadic, def, type: null };
    });
    const fn = {
      id: `${this.file}#${this.nextId++}`,
      file: this.file,
      name: name || '(anonymous)',
      cls: cls || null,
      line: lineOf(n),
      params,
      body: [],
      captures: true,
    };
    const body = n.body && n.body.type === 'BlockStatement' ? this.block(n.body.body) : [{ k: 'return', line: lineOf(n.body), expr: this.expr(n.body) }];
    fn.body = prologue.concat(body);
    this.currentClass = prevClass;
    this.allFunctions.push(fn);
    return fn;
  }

  declareFunction(n, forcedName) {
    const name = forcedName || (n.id ? n.id.name : '(anonymous)');
    const fn = this.makeFn(n, name);
    this.functions.set(name, fn);
    return fn;
  }

  declareClass(n, forcedName) {
    const name = forcedName || (n.id ? n.id.name : `(class@${lineOf(n)})`);
    const parent = n.superClass && n.superClass.type === 'Identifier' ? n.superClass.name : null;
    const cls = { name, parent, methods: new Map(), props: [] };
    this.classes.set(name.toLowerCase(), cls);
    for (const member of (n.body && n.body.body) || []) {
      if (member.type === 'ClassMethod' || member.type === 'ClassPrivateMethod' || member.type === 'TSDeclareMethod') {
        if (!member.body) continue;
        const mname = member.kind === 'constructor' ? '__construct' : (member.key.type === 'PrivateName' ? `#${member.key.id.name}` : (member.key.name || stringOf(member.key) || ''));
        if (!mname) continue;
        const fn = this.makeFn(member, `${name}.${mname === '__construct' ? 'constructor' : mname}`, name);
        cls.methods.set(mname, fn);
        const list = this.methodsByName.get(mname) || [];
        list.push(fn);
        this.methodsByName.set(mname, list);
      } else if ((member.type === 'ClassProperty' || member.type === 'ClassPrivateProperty') && member.key) {
        const pname = member.key.type === 'PrivateName' ? `#${member.key.id.name}` : (member.key.name || stringOf(member.key));
        if (!pname) continue;
        const value = member.value ? unwrap(member.value) : null;
        if (value && (value.type === 'ArrowFunctionExpression' || value.type === 'FunctionExpression')) {
          const fn = this.makeFn(value, `${name}.${pname}`, name);
          cls.methods.set(pname, fn);
          const list = this.methodsByName.get(pname) || [];
          list.push(fn);
          this.methodsByName.set(pname, list);
        } else {
          cls.props.push({ name: pname, def: value ? this.expr(value) : null });
        }
      }
    }
    return cls;
  }

  /* ------------------------------------------------------------------ lvalues */

  lvalue(p) {
    const n = unwrap(p);
    if (!n) return { k: 'none' };
    switch (n.type) {
      case 'Identifier':
        return { k: 'path', base: n.name, segs: [], line: lineOf(n) };
      case 'MemberExpression':
      case 'OptionalMemberExpression': {
        const base = this.lvalue(n.object);
        if (base.k !== 'path') return { k: 'none' };
        const key = propName(n);
        return { ...base, segs: base.segs.concat([{ key: key === null ? '*' : key }]) };
      }
      case 'ThisExpression':
        return { k: 'path', base: 'this', segs: [], line: lineOf(n) };
      case 'ObjectPattern':
        return {
          k: 'list',
          items: n.properties.map((prop) => {
            if (prop.type === 'RestElement') return { key: '*', target: this.lvalue(prop.argument) };
            const key = prop.computed ? stringOf(prop.key) : (prop.key.type === 'Identifier' ? prop.key.name : stringOf(prop.key) ?? (prop.key.type === 'NumericLiteral' ? String(prop.key.value) : null));
            return { key: key === null ? '*' : key, target: this.lvalue(prop.value) };
          }),
        };
      case 'ArrayPattern':
        return {
          k: 'list',
          items: n.elements.map((el, i) => {
            if (!el) return null;
            if (el.type === 'RestElement') return { key: '*', target: this.lvalue(el.argument) };
            return { key: String(i), target: this.lvalue(el) };
          }),
        };
      case 'AssignmentPattern':
        return this.lvalue(n.left);
      case 'RestElement':
        return this.lvalue(n.argument);
      default:
        return { k: 'none' };
    }
  }

  /* -------------------------------------------------------------- expressions */

  args(list) {
    return (list || []).map((a) => {
      if (!a) return { k: 'lit', value: null };
      if (a.type === 'SpreadElement') return { k: 'unknown', parts: [this.expr(a.argument)], line: lineOf(a) };
      return this.expr(a);
    });
  }

  callExpr(n) {
    const line = lineOf(n);
    const col = colOf(n);
    const callee = unwrap(n.callee);
    const args = this.args(n.arguments);
    if (callee.type === 'Import') return { k: 'call', callee: '@import', args, line, col };
    if (callee.type === 'Identifier') {
      if (callee.name === 'require' && !this.bindings.has('require')) return { k: 'call', callee: '@require', args, line, col };
      const bound = this.bindings.get(callee.name);
      return { k: 'call', callee: `fn:${bound || callee.name}`, args, line, col };
    }
    if (callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') {
      const prop = propName(callee);
      const q = prop !== null ? this.qualify(callee) : null;
      if (q) return { k: 'call', callee: `fn:${q}`, args, line, col };
      if (prop !== null) return { k: 'call', callee: `m:${prop}`, recv: this.expr(callee.object), args, line, col };
      return { k: 'call', callee: '@dyncall', args: [this.expr(callee), ...args], line, col };
    }
    if (callee.type === 'FunctionExpression' || callee.type === 'ArrowFunctionExpression') {
      return { k: 'call', callee: '@invoke', args: [{ k: 'closure', fn: this.makeFn(callee, '(iife)'), line }, ...args], line, col };
    }
    if (callee.type === 'Super') return { k: 'unknown', parts: args, line };
    return { k: 'call', callee: '@dyncall', args: [this.expr(callee), ...args], line, col };
  }

  newExpr(n) {
    const line = lineOf(n);
    const callee = unwrap(n.callee);
    const args = this.args(n.arguments);
    if (callee.type === 'ClassExpression') {
      const cls = this.declareClass(callee);
      return { k: 'new', cls: cls.name, args, line };
    }
    const q = this.qualify(callee);
    if (q) return { k: 'new', cls: q, args, line };
    if (callee.type === 'Identifier') return { k: 'new', cls: callee.name, args, line };
    const chain = this.chainOf(callee);
    return { k: 'new', cls: chain.length ? chain.join('.') : null, args, line };
  }

  /** JSX: only dangerouslySetInnerHTML matters (React escapes everything else). */
  jsx(n) {
    const html = [];
    const visit = (x) => {
      if (!x || typeof x.type !== 'string') return;
      if (x.type === 'JSXAttribute' && x.name && x.name.name === 'dangerouslySetInnerHTML' && x.value && x.value.type === 'JSXExpressionContainer') {
        const obj = unwrap(x.value.expression);
        if (obj && obj.type === 'ObjectExpression') {
          for (const p of obj.properties) {
            const key = p.key && (p.key.type === 'Identifier' ? p.key.name : stringOf(p.key));
            if (key === '__html' && p.type === 'ObjectProperty') html.push(this.expr(p.value));
          }
        } else if (obj) {
          html.push({ k: 'path', base: '__jsx', segs: [], line: lineOf(x) }); // unknown object: not followed
        }
      }
      for (const key of ['openingElement', 'attributes', 'children', 'expression']) {
        const v = x[key];
        if (Array.isArray(v)) v.forEach(visit);
        else if (v && typeof v.type === 'string') visit(v);
      }
    };
    visit(n);
    if (!html.length) return { k: 'lit', value: null, line: lineOf(n) };
    return { k: 'call', callee: '@jsx', args: html, line: lineOf(n), col: colOf(n) };
  }

  expr(node) {
    const n = unwrap(node);
    if (!n) return { k: 'lit', value: null };
    const line = lineOf(n);
    switch (n.type) {
      case 'StringLiteral':
        return { k: 'lit', value: n.value, line };
      case 'NumericLiteral':
        return { k: 'lit', value: n.value, line };
      case 'BigIntLiteral':
        return { k: 'lit', value: 0, line };
      case 'BooleanLiteral':
        return { k: 'lit', value: n.value, line };
      case 'NullLiteral':
        return { k: 'lit', value: null, line };
      case 'RegExpLiteral':
        return { k: 'lit', value: `/${n.pattern}/${n.flags || ''}`, line, regex: true };
      case 'TemplateLiteral': {
        const parts = [];
        n.quasis.forEach((q, i) => {
          if (q.value.cooked) parts.push({ k: 'lit', value: q.value.cooked, line: lineOf(q) });
          if (i < n.expressions.length) parts.push(this.expr(n.expressions[i]));
        });
        return { k: 'concat', parts, line };
      }
      case 'TaggedTemplateExpression': {
        const tag = this.chainOf(n.tag).join('.') || 'tag';
        return { k: 'call', callee: `@tag:${tag}`, args: n.quasi.expressions.map((x) => this.expr(x)), line, col: colOf(n) };
      }
      case 'Identifier':
        if (n.name === 'undefined') return { k: 'lit', value: null, line };
        if (n.name === 'NaN' || n.name === 'Infinity') return { k: 'lit', value: 0, line };
        if (n.name === '__dirname') return { k: 'lit', value: `/${this.file.includes('/') ? this.file.slice(0, this.file.lastIndexOf('/')) : ''}`, line };
        if (n.name === '__filename') return { k: 'lit', value: `/${this.file}`, line };
        if (this.declared.has(n.name)) return { k: 'closure', fnName: n.name, line };
        return { k: 'path', base: n.name, segs: [], line };
      case 'ThisExpression':
        return { k: 'path', base: 'this', segs: [], line };
      case 'MemberExpression':
      case 'OptionalMemberExpression': {
        if (propName(n) === 'length') return { k: 'lit', value: 0, line };
        const lv = this.lvalue(n);
        if (lv.k === 'path') return lv;
        return { k: 'unknown', parts: [this.expr(n.object)], line };
      }
      case 'CallExpression':
      case 'OptionalCallExpression':
        return this.callExpr(n);
      case 'NewExpression':
        return this.newExpr(n);
      case 'BinaryExpression': {
        if (n.operator === '+') {
          const parts = [];
          const flatten = (x) => {
            const u = unwrap(x);
            if (u && u.type === 'BinaryExpression' && u.operator === '+') { flatten(u.left); flatten(u.right); } else parts.push(this.expr(u));
          };
          flatten(n);
          return { k: 'concat', parts, line };
        }
        return { k: 'bin', op: n.operator, left: this.expr(n.left), right: this.expr(n.right), line };
      }
      case 'LogicalExpression':
        return { k: 'bin', op: n.operator === '??' ? '??' : n.operator, left: this.expr(n.left), right: this.expr(n.right), line, valueOps: true };
      case 'UnaryExpression':
        if (n.operator === 'typeof') return { k: 'lit', value: 'string', line };
        if (n.operator === 'void') return { k: 'lit', value: null, line };
        if (n.operator === 'delete') return { k: 'lit', value: true, line };
        return { k: 'unary', op: n.operator, expr: this.expr(n.argument), line };
      case 'UpdateExpression':
        return { k: 'assign', target: this.lvalue(n.argument), expr: { k: 'lit', value: 0, line }, op: '+=', line };
      case 'AssignmentExpression': {
        const exported = this.noteExport(n);
        const rhs = exported ? { k: 'closure', fn: exported, line } : this.expr(n.right);
        this.noteObjectExports(n, rhs);
        return { k: 'assign', target: this.lvalue(n.left), expr: rhs, op: this.assignOp(n.operator), line };
      }
      case 'ConditionalExpression':
        return { k: 'ternary', test: this.expr(n.test), then: this.expr(n.consequent), else: this.expr(n.alternate), line };
      case 'ArrowFunctionExpression':
      case 'FunctionExpression':
        return { k: 'closure', fn: this.makeFn(n, n.id ? n.id.name : null, this.currentClass), line };
      case 'ClassExpression':
        this.declareClass(n);
        return { k: 'unknown', parts: [], line };
      case 'ObjectExpression':
        return {
          k: 'array',
          line,
          items: n.properties.map((p) => {
            if (p.type === 'SpreadElement') return { key: null, value: this.expr(p.argument), unpack: true };
            const key = p.computed ? this.expr(p.key) : { k: 'lit', value: p.key.type === 'Identifier' ? p.key.name : (stringOf(p.key) ?? String(p.key.value)), line };
            if (p.type === 'ObjectMethod') return { key, value: { k: 'closure', fn: this.makeFn(p, key.value || null), line }, unpack: false };
            return { key, value: this.expr(p.value), unpack: false };
          }),
        };
      case 'ArrayExpression':
        return {
          k: 'array',
          line,
          items: n.elements.map((el) => {
            if (!el) return null;
            if (el.type === 'SpreadElement') return { key: null, value: this.expr(el.argument), unpack: true };
            return { key: null, value: this.expr(el), unpack: false };
          }),
        };
      case 'AwaitExpression':
        return this.expr(n.argument);
      case 'YieldExpression':
        return { k: 'unknown', parts: n.argument ? [this.expr(n.argument)] : [], line };
      case 'SequenceExpression':
        return { k: 'call', callee: '@seq', args: n.expressions.map((x) => this.expr(x)), line };
      case 'JSXElement':
      case 'JSXFragment':
        return this.jsx(n);
      default:
        return { k: 'unknown', parts: [], line };
    }
  }
}

/** @returns IR program for core/taint/interpreter.js */
function lower(ast, file) {
  return new JsLowerer(file).program(ast);
}

module.exports = { lower, moduleName, JsLowerer, unwrap, stringOf, propName };
