"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createParserClass = void 0;

var _factory = require("../utils/factory");

var _object = require("../utils/object");

var _customs = require("../utils/customs");

var _log = require("../utils/log");

var name = 'Parser';
var dependencies = ['parse'];
var createParserClass = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var parse = _ref.parse;

  /**
   * @constructor Parser
   * Parser contains methods to evaluate or parse expressions, and has a number
   * of convenience methods to get, set, and remove variables from memory. Parser
   * keeps a scope containing variables in memory, which is used for all
   * evaluations.
   *
   * Methods:
   *    const result = parser.evaluate(expr)  // evaluate an expression
   *    const value = parser.get(name)        // retrieve a variable from the parser
   *    const values = parser.getAll()        // retrieve all defined variables
   *    parser.set(name, value)               // set a variable in the parser
   *    parser.remove(name)                   // clear a variable from the
   *                                          // parsers scope
   *    parser.clear()                        // clear the parsers scope
   *
   * Example usage:
   *    const parser = new Parser()
   *    // Note: there is a convenience method which can be used instead:
   *    // const parser = new math.parser()
   *
   *    // evaluate expressions
   *    parser.evaluate('sqrt(3^2 + 4^2)')        // 5
   *    parser.evaluate('sqrt(-4)')               // 2i
   *    parser.evaluate('2 inch in cm')           // 5.08 cm
   *    parser.evaluate('cos(45 deg)')            // 0.7071067811865476
   *
   *    // define variables and functions
   *    parser.evaluate('x = 7 / 2')              // 3.5
   *    parser.evaluate('x + 3')                  // 6.5
   *    parser.evaluate('function f(x, y) = x^y') // f(x, y)
   *    parser.evaluate('f(2, 3)')                // 8
   *
   *    // get and set variables and functions
   *    const x = parser.get('x')                 // 7
   *    const f = parser.get('f')                 // function
   *    const g = f(3, 2)                         // 9
   *    parser.set('h', 500)
   *    const i = parser.evaluate('h / 2')        // 250
   *    parser.set('hello', function (name) {
   *        return 'hello, ' + name + '!'
   *    })
   *    parser.evaluate('hello("user")')          // "hello, user!"
   *
   *    // clear defined functions and variables
   *    parser.clear()
   *
   */
  function Parser() {
    if (!(this instanceof Parser)) {
      throw new SyntaxError('Constructor must be called with the new operator');
    }

    this.scope = {};
  }
  /**
   * Attach type information
   */


  Parser.prototype.type = 'Parser';
  Parser.prototype.isParser = true;
  /**
   * Parse an expression and return the parsed function node.
   * The node tree can be compiled via `code = node.compile(math)`,
   * and the compiled code can be executed as `code.evaluate([scope])`
   * @param {string} expr
   * @return {Node} node
   * @throws {Error}
   */

  Parser.prototype.parse = function (expr) {
    throw new Error('Parser.parse is deprecated. Use math.parse instead.');
  };
  /**
   * Parse and compile an expression, return the compiled javascript code.
   * The node can be evaluated via code.evaluate([scope])
   * @param {string} expr
   * @return {{evaluate: function}} code
   * @throws {Error}
   */


  Parser.prototype.compile = function (expr) {
    throw new Error('Parser.compile is deprecated. Use math.compile instead.');
  };
  /**
   * Parse and evaluate the given expression
   * @param {string} expr   A string containing an expression, for example "2+3"
   * @return {*} result     The result, or undefined when the expression was empty
   * @throws {Error}
   */


  Parser.prototype.evaluate = function (expr) {
    // TODO: validate arguments
    return parse(expr).compile().evaluate(this.scope);
  };
  /**
   * Parse and evaluate the given expression
   * @param {string} expr   A string containing an expression, for example "2+3"
   * @return {*} result     The result, or undefined when the expression was empty
   * @throws {Error}
   */
  // TODO: Deprecated since v6.0.0. Clean up some day


  Parser.prototype.eval = function (expr) {
    (0, _log.warnOnce)('Method Parser.eval is renamed to Parser.evaluate. Please use the new method name.');
    return this.evaluate(expr);
  };
  /**
   * Get a variable (a function or variable) by name from the parsers scope.
   * Returns undefined when not found
   * @param {string} name
   * @return {* | undefined} value
   */


  Parser.prototype.get = function (name) {
    // TODO: validate arguments
    return name in this.scope ? (0, _customs.getSafeProperty)(this.scope, name) : undefined;
  };
  /**
   * Get a map with all defined variables
   * @return {Object} values
   */


  Parser.prototype.getAll = function () {
    return (0, _object.extend)({}, this.scope);
  };
  /**
   * Set a symbol (a function or variable) by name from the parsers scope.
   * @param {string} name
   * @param {* | undefined} value
   */


  Parser.prototype.set = function (name, value) {
    // TODO: validate arguments
    return (0, _customs.setSafeProperty)(this.scope, name, value);
  };
  /**
   * Remove a variable from the parsers scope
   * @param {string} name
   */


  Parser.prototype.remove = function (name) {
    // TODO: validate arguments
    delete this.scope[name];
  };
  /**
   * Clear the scope with variables and functions
   */


  Parser.prototype.clear = function () {
    for (var _name in this.scope) {
      if ((0, _object.hasOwnProperty)(this.scope, _name)) {
        delete this.scope[_name];
      }
    }
  };

  return Parser;
}, {
  isClass: true
});
exports.createParserClass = createParserClass;