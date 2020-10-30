function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
import { config } from './configReadonly';
import { createChainClass, createChain, createNode, createArrayNode, createConditionalNode, createFunctionAssignmentNode, createObjectNode, createParenthesisNode, createRelationalNode, createReviver, createAccessorNode, createBlockNode, createOperatorNode, createSymbolNode, createConstantNode, createRangeNode, createFunctionNode, createAssignmentNode, createIndexNode, createParse, createEvaluate, createHelpClass, createSimplify, createRationalize, createCompile, createHelp, createParserClass, createDerivative, createParser, createFilterTransform, createMapTransform, createMinTransform, createApplyTransform, createMaxTransform, createStdTransform, createVarianceTransform, createMeanTransform, createSumTransform, createForEachTransform, createSubsetTransform, createRangeTransform } from '../factoriesNumber';
import { typed, Range, nthRoot, e, _false, LN10, LOG10E, _NaN, phi, SQRT1_2 // eslint-disable-line camelcase
, tau, version, string, filter, map, combinationsWithRep, pickRandom, randomInt, compare, compareText, smaller, larger, erf, max, format, clone, typeOf, unaryPlus, addScalar, ceil, exp, fix, gcd, log10, mod, multiply, sqrt, subtract, divideScalar, log, add, divide, bitNot, bitXor, rightArithShift, and, or, index, subset, gamma, acosh, acoth, acsch, asech, asinh, atan2, cos, cot, csc, sec, sin, tan, isInteger, isPositive, isNaN, ResultSet, round, LN2, _null, SQRT2, number, apply, factorial, permutations, equalScalar, equal, smallerEq, deepEqual, prod, sum, variance, std, isPrime, unaryMinus, cbrt, expm1, lcm, multiplyScalar, square, pow, norm, bitOr, rightLogShift, xor, combinations, acot, asec, atan, cosh, csch, sinh, isNegative, stirlingS2, catalan, _Infinity, pi, _true, forEach, multinomial, compareNatural, largerEq, min, print, numeric, cube, log2, xgcd, bitAnd, not, acos, asin, coth, tanh, bellNumbers, LOG2E, boolean as _boolean, random, unequal, mean, isNumeric, abs, sign, leftShift, acsc, sech, hypot, partitionSelect, mode, quantileSeq, hasNumericValue, log1p, atanh, composition, median, floor, isZero, equalText, matrix, range, mad, size } from './pureFunctionsNumber.generated';
var math = {}; // NOT pure!

var mathWithTransform = {}; // NOT pure!

var classes = {}; // NOT pure!

export var Chain = createChainClass({
  math: math
});
export var chain = createChain({
  Chain: Chain,
  typed: typed
});
export var Node = createNode({
  mathWithTransform: mathWithTransform
});
export var ArrayNode = createArrayNode({
  Node: Node
});
export var ConditionalNode = createConditionalNode({
  Node: Node
});
export var FunctionAssignmentNode = createFunctionAssignmentNode({
  Node: Node,
  typed: typed
});
export var ObjectNode = createObjectNode({
  Node: Node
});
export var ParenthesisNode = createParenthesisNode({
  Node: Node
});
export var RelationalNode = createRelationalNode({
  Node: Node
});
export var reviver = createReviver({
  classes: classes
});
export var AccessorNode = createAccessorNode({
  Node: Node,
  subset: subset
});
export var BlockNode = createBlockNode({
  Node: Node,
  ResultSet: ResultSet
});
export var OperatorNode = createOperatorNode({
  Node: Node
});
export var SymbolNode = createSymbolNode({
  Node: Node,
  math: math
});
export var ConstantNode = createConstantNode({
  Node: Node
});
export var RangeNode = createRangeNode({
  Node: Node
});
export var FunctionNode = createFunctionNode({
  Node: Node,
  SymbolNode: SymbolNode,
  math: math
});
export var AssignmentNode = createAssignmentNode({
  matrix: matrix,
  Node: Node,
  subset: subset
});
export var IndexNode = createIndexNode({
  Node: Node,
  Range: Range,
  size: size
});
export var parse = createParse({
  AccessorNode: AccessorNode,
  ArrayNode: ArrayNode,
  AssignmentNode: AssignmentNode,
  BlockNode: BlockNode,
  ConditionalNode: ConditionalNode,
  ConstantNode: ConstantNode,
  FunctionAssignmentNode: FunctionAssignmentNode,
  FunctionNode: FunctionNode,
  IndexNode: IndexNode,
  ObjectNode: ObjectNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  RangeNode: RangeNode,
  RelationalNode: RelationalNode,
  SymbolNode: SymbolNode,
  config: config,
  numeric: numeric,
  typed: typed
});
export var evaluate = createEvaluate({
  parse: parse,
  typed: typed
});
export var Help = createHelpClass({
  parse: parse
});
export var simplify = createSimplify({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  add: add,
  config: config,
  divide: divide,
  equal: equal,
  isZero: isZero,
  mathWithTransform: mathWithTransform,
  multiply: multiply,
  parse: parse,
  pow: pow,
  subtract: subtract,
  typed: typed
});
export var rationalize = createRationalize({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  add: add,
  config: config,
  divide: divide,
  equal: equal,
  isZero: isZero,
  mathWithTransform: mathWithTransform,
  multiply: multiply,
  parse: parse,
  pow: pow,
  simplify: simplify,
  subtract: subtract,
  typed: typed
});
export var compile = createCompile({
  parse: parse,
  typed: typed
});
export var help = createHelp({
  Help: Help,
  mathWithTransform: mathWithTransform,
  typed: typed
});
export var Parser = createParserClass({
  parse: parse
});
export var derivative = createDerivative({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  config: config,
  equal: equal,
  isZero: isZero,
  numeric: numeric,
  parse: parse,
  simplify: simplify,
  typed: typed
});
export var parser = createParser({
  Parser: Parser,
  typed: typed
});

_extends(math, {
  typed: typed,
  chain: chain,
  nthRoot: nthRoot,
  e: e,
  "false": _false,
  LN10: LN10,
  LOG10E: LOG10E,
  NaN: _NaN,
  phi: phi,
  SQRT1_2: SQRT1_2,
  tau: tau,
  version: version,
  string: string,
  filter: filter,
  map: map,
  combinationsWithRep: combinationsWithRep,
  pickRandom: pickRandom,
  randomInt: randomInt,
  compare: compare,
  compareText: compareText,
  smaller: smaller,
  larger: larger,
  erf: erf,
  max: max,
  format: format,
  clone: clone,
  typeOf: typeOf,
  reviver: reviver,
  unaryPlus: unaryPlus,
  addScalar: addScalar,
  ceil: ceil,
  exp: exp,
  fix: fix,
  gcd: gcd,
  log10: log10,
  mod: mod,
  multiply: multiply,
  sqrt: sqrt,
  subtract: subtract,
  divideScalar: divideScalar,
  log: log,
  add: add,
  divide: divide,
  bitNot: bitNot,
  bitXor: bitXor,
  rightArithShift: rightArithShift,
  and: and,
  or: or,
  index: index,
  subset: subset,
  gamma: gamma,
  acosh: acosh,
  acoth: acoth,
  acsch: acsch,
  asech: asech,
  asinh: asinh,
  atan2: atan2,
  cos: cos,
  cot: cot,
  csc: csc,
  sec: sec,
  sin: sin,
  tan: tan,
  isInteger: isInteger,
  isPositive: isPositive,
  isNaN: isNaN,
  round: round,
  'E': e,
  LN2: LN2,
  "null": _null,
  SQRT2: SQRT2,
  number: number,
  apply: apply,
  factorial: factorial,
  permutations: permutations,
  equalScalar: equalScalar,
  equal: equal,
  smallerEq: smallerEq,
  deepEqual: deepEqual,
  prod: prod,
  sum: sum,
  variance: variance,
  std: std,
  isPrime: isPrime,
  unaryMinus: unaryMinus,
  cbrt: cbrt,
  expm1: expm1,
  lcm: lcm,
  multiplyScalar: multiplyScalar,
  square: square,
  pow: pow,
  norm: norm,
  bitOr: bitOr,
  rightLogShift: rightLogShift,
  xor: xor,
  combinations: combinations,
  acot: acot,
  asec: asec,
  atan: atan,
  cosh: cosh,
  csch: csch,
  sinh: sinh,
  isNegative: isNegative,
  stirlingS2: stirlingS2,
  catalan: catalan,
  Infinity: _Infinity,
  pi: pi,
  "true": _true,
  forEach: forEach,
  multinomial: multinomial,
  compareNatural: compareNatural,
  largerEq: largerEq,
  min: min,
  print: print,
  numeric: numeric,
  cube: cube,
  log2: log2,
  xgcd: xgcd,
  bitAnd: bitAnd,
  not: not,
  acos: acos,
  asin: asin,
  coth: coth,
  tanh: tanh,
  bellNumbers: bellNumbers,
  LOG2E: LOG2E,
  "boolean": _boolean,
  random: random,
  unequal: unequal,
  mean: mean,
  isNumeric: isNumeric,
  abs: abs,
  sign: sign,
  leftShift: leftShift,
  acsc: acsc,
  sech: sech,
  hypot: hypot,
  'PI': pi,
  partitionSelect: partitionSelect,
  mode: mode,
  quantileSeq: quantileSeq,
  hasNumericValue: hasNumericValue,
  log1p: log1p,
  atanh: atanh,
  composition: composition,
  median: median,
  floor: floor,
  isZero: isZero,
  equalText: equalText,
  matrix: matrix,
  range: range,
  mad: mad,
  size: size,
  parse: parse,
  evaluate: evaluate,
  simplify: simplify,
  rationalize: rationalize,
  compile: compile,
  help: help,
  derivative: derivative,
  parser: parser,
  config: config
});

_extends(mathWithTransform, math, {
  filter: createFilterTransform({
    typed: typed
  }),
  map: createMapTransform({
    typed: typed
  }),
  min: createMinTransform({
    smaller: smaller,
    typed: typed
  }),
  apply: createApplyTransform({
    isInteger: isInteger,
    typed: typed
  }),
  max: createMaxTransform({
    larger: larger,
    typed: typed
  }),
  std: createStdTransform({
    sqrt: sqrt,
    typed: typed,
    variance: variance
  }),
  variance: createVarianceTransform({
    add: add,
    apply: apply,
    divide: divide,
    isNaN: isNaN,
    multiply: multiply,
    subtract: subtract,
    typed: typed
  }),
  mean: createMeanTransform({
    add: add,
    divide: divide,
    typed: typed
  }),
  sum: createSumTransform({
    add: add,
    config: config,
    typed: typed
  }),
  forEach: createForEachTransform({
    typed: typed
  }),
  subset: createSubsetTransform({
    matrix: matrix,
    typed: typed
  }),
  range: createRangeTransform({
    matrix: matrix,
    config: config,
    larger: larger,
    largerEq: largerEq,
    smaller: smaller,
    smallerEq: smallerEq,
    typed: typed
  })
});

_extends(classes, {
  Range: Range,
  Chain: Chain,
  Node: Node,
  ArrayNode: ArrayNode,
  ConditionalNode: ConditionalNode,
  FunctionAssignmentNode: FunctionAssignmentNode,
  ObjectNode: ObjectNode,
  ParenthesisNode: ParenthesisNode,
  RelationalNode: RelationalNode,
  ResultSet: ResultSet,
  AccessorNode: AccessorNode,
  BlockNode: BlockNode,
  OperatorNode: OperatorNode,
  SymbolNode: SymbolNode,
  ConstantNode: ConstantNode,
  RangeNode: RangeNode,
  FunctionNode: FunctionNode,
  AssignmentNode: AssignmentNode,
  IndexNode: IndexNode,
  Help: Help,
  Parser: Parser
});

Chain.createProxy(math);
export { embeddedDocs as docs } from '../expression/embeddedDocs/embeddedDocs';