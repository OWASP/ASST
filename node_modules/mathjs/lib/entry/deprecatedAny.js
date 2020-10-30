"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.error = exports.json = exports.expression = exports.type = exports.deprecatedTypeof = exports.deprecatedVar = exports.deprecatedImport = exports.deprecatedEval = void 0;

var _eval = require("../expression/function/eval");

var _deprecatedImport = require("../core/function/deprecatedImport");

var _variance = require("../function/statistics/variance");

var _typeOf = require("../function/utils/typeOf");

var _is = require("../utils/is");

var _ArgumentsError = require("../error/ArgumentsError");

var _DimensionError = require("../error/DimensionError");

var _IndexError = require("../error/IndexError");

var _object = require("../utils/object");

var _log = require("../utils/log");

var _pureFunctionsAny = require("./pureFunctionsAny.generated");

var _impureFunctionsAny = require("./impureFunctionsAny.generated");

// TODO: deprecated since version 6.0.0. Date: 2019-04-14
// "deprecatedEval" is also exposed as "eval" in the code compiled to ES5+CommonJs
var deprecatedEval = /* #__PURE__ */(0, _eval.createDeprecatedEval)({
  evaluate: _impureFunctionsAny.evaluate
}); // "deprecatedImport" is also exposed as "import" in the code compiled to ES5+CommonJs

exports.deprecatedEval = deprecatedEval;
var deprecatedImport = /* #__PURE__ */(0, _deprecatedImport.createDeprecatedImport)({}); // "deprecatedVar" is also exposed as "var" in the code compiled to ES5+CommonJs

exports.deprecatedImport = deprecatedImport;
var deprecatedVar = /* #__PURE__ */(0, _variance.createDeprecatedVar)({
  variance: _pureFunctionsAny.variance
}); // "deprecatedTypeof" is also exposed as "typeof" in the code compiled to ES5+CommonJs

exports.deprecatedVar = deprecatedVar;
var deprecatedTypeof = /* #__PURE__ */(0, _typeOf.createDeprecatedTypeof)({
  typeOf: _pureFunctionsAny.typeOf
});
exports.deprecatedTypeof = deprecatedTypeof;
var type = /* #__PURE__ */createDeprecatedProperties('type', {
  isNumber: _is.isNumber,
  isComplex: _is.isComplex,
  isBigNumber: _is.isBigNumber,
  isFraction: _is.isFraction,
  isUnit: _is.isUnit,
  isString: _is.isString,
  isArray: _is.isArray,
  isMatrix: _is.isMatrix,
  isCollection: _is.isCollection,
  isDenseMatrix: _is.isDenseMatrix,
  isSparseMatrix: _is.isSparseMatrix,
  isRange: _is.isRange,
  isIndex: _is.isIndex,
  isBoolean: _is.isBoolean,
  isResultSet: _is.isResultSet,
  isHelp: _is.isHelp,
  isFunction: _is.isFunction,
  isDate: _is.isDate,
  isRegExp: _is.isRegExp,
  isObject: _is.isObject,
  isNull: _is.isNull,
  isUndefined: _is.isUndefined,
  isAccessorNode: _is.isAccessorNode,
  isArrayNode: _is.isArrayNode,
  isAssignmentNode: _is.isAssignmentNode,
  isBlockNode: _is.isBlockNode,
  isConditionalNode: _is.isConditionalNode,
  isConstantNode: _is.isConstantNode,
  isFunctionAssignmentNode: _is.isFunctionAssignmentNode,
  isFunctionNode: _is.isFunctionNode,
  isIndexNode: _is.isIndexNode,
  isNode: _is.isNode,
  isObjectNode: _is.isObjectNode,
  isOperatorNode: _is.isOperatorNode,
  isParenthesisNode: _is.isParenthesisNode,
  isRangeNode: _is.isRangeNode,
  isSymbolNode: _is.isSymbolNode,
  isChain: _is.isChain,
  BigNumber: _pureFunctionsAny.BigNumber,
  Chain: _impureFunctionsAny.Chain,
  Complex: _pureFunctionsAny.Complex,
  Fraction: _pureFunctionsAny.Fraction,
  Matrix: _pureFunctionsAny.Matrix,
  DenseMatrix: _pureFunctionsAny.DenseMatrix,
  SparseMatrix: _pureFunctionsAny.SparseMatrix,
  Spa: _pureFunctionsAny.Spa,
  FibonacciHeap: _pureFunctionsAny.FibonacciHeap,
  ImmutableDenseMatrix: _pureFunctionsAny.ImmutableDenseMatrix,
  Index: _pureFunctionsAny.Index,
  Range: _pureFunctionsAny.Range,
  ResultSet: _pureFunctionsAny.ResultSet,
  Unit: _pureFunctionsAny.Unit,
  Help: _impureFunctionsAny.Help,
  Parser: _impureFunctionsAny.Parser
});
exports.type = type;
var expression = /* #__PURE__ */createDeprecatedProperties('expression', {
  parse: _impureFunctionsAny.parse,
  Parser: _impureFunctionsAny.Parser,
  node: createDeprecatedProperties('expression.node', {
    AccessorNode: _impureFunctionsAny.AccessorNode,
    ArrayNode: _impureFunctionsAny.ArrayNode,
    AssignmentNode: _impureFunctionsAny.AssignmentNode,
    BlockNode: _impureFunctionsAny.BlockNode,
    ConditionalNode: _impureFunctionsAny.ConditionalNode,
    ConstantNode: _impureFunctionsAny.ConstantNode,
    IndexNode: _impureFunctionsAny.IndexNode,
    FunctionAssignmentNode: _impureFunctionsAny.FunctionAssignmentNode,
    FunctionNode: _impureFunctionsAny.FunctionNode,
    Node: _impureFunctionsAny.Node,
    ObjectNode: _impureFunctionsAny.ObjectNode,
    OperatorNode: _impureFunctionsAny.OperatorNode,
    ParenthesisNode: _impureFunctionsAny.ParenthesisNode,
    RangeNode: _impureFunctionsAny.RangeNode,
    RelationalNode: _impureFunctionsAny.RelationalNode,
    SymbolNode: _impureFunctionsAny.SymbolNode
  })
});
exports.expression = expression;
var json = /* #__PURE__ */createDeprecatedProperties('json', {
  reviver: _impureFunctionsAny.reviver
});
exports.json = json;
var error = /* #__PURE__ */createDeprecatedProperties('error', {
  ArgumentsError: _ArgumentsError.ArgumentsError,
  DimensionError: _DimensionError.DimensionError,
  IndexError: _IndexError.IndexError
});
exports.error = error;

function createDeprecatedProperties(path, props) {
  var obj = {};
  Object.keys(props).forEach(function (name) {
    (0, _object.lazy)(obj, name, function () {
      (0, _log.warnOnce)("math.".concat(path, ".").concat(name, " is moved to math.").concat(name, " in v6.0.0. ") + 'Please use the new location instead.');
      return props[name];
    });
  });
  return obj;
}