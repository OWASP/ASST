"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "docs", {
  enumerable: true,
  get: function get() {
    return _embeddedDocs.embeddedDocs;
  }
});
exports.parser = exports.derivative = exports.Parser = exports.help = exports.compile = exports.rationalize = exports.simplify = exports.Help = exports.evaluate = exports.parse = exports.IndexNode = exports.AssignmentNode = exports.FunctionNode = exports.RangeNode = exports.ConstantNode = exports.SymbolNode = exports.OperatorNode = exports.BlockNode = exports.AccessorNode = exports.reviver = exports.RelationalNode = exports.ParenthesisNode = exports.ObjectNode = exports.FunctionAssignmentNode = exports.ConditionalNode = exports.ArrayNode = exports.Node = exports.chain = exports.Chain = void 0;

var _configReadonly = require("./configReadonly");

var _factoriesNumber = require("../factoriesNumber");

var _pureFunctionsNumber = require("./pureFunctionsNumber.generated");

var _embeddedDocs = require("../expression/embeddedDocs/embeddedDocs");

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var math = {}; // NOT pure!

var mathWithTransform = {}; // NOT pure!

var classes = {}; // NOT pure!

var Chain = (0, _factoriesNumber.createChainClass)({
  math: math
});
exports.Chain = Chain;
var chain = (0, _factoriesNumber.createChain)({
  Chain: Chain,
  typed: _pureFunctionsNumber.typed
});
exports.chain = chain;
var Node = (0, _factoriesNumber.createNode)({
  mathWithTransform: mathWithTransform
});
exports.Node = Node;
var ArrayNode = (0, _factoriesNumber.createArrayNode)({
  Node: Node
});
exports.ArrayNode = ArrayNode;
var ConditionalNode = (0, _factoriesNumber.createConditionalNode)({
  Node: Node
});
exports.ConditionalNode = ConditionalNode;
var FunctionAssignmentNode = (0, _factoriesNumber.createFunctionAssignmentNode)({
  Node: Node,
  typed: _pureFunctionsNumber.typed
});
exports.FunctionAssignmentNode = FunctionAssignmentNode;
var ObjectNode = (0, _factoriesNumber.createObjectNode)({
  Node: Node
});
exports.ObjectNode = ObjectNode;
var ParenthesisNode = (0, _factoriesNumber.createParenthesisNode)({
  Node: Node
});
exports.ParenthesisNode = ParenthesisNode;
var RelationalNode = (0, _factoriesNumber.createRelationalNode)({
  Node: Node
});
exports.RelationalNode = RelationalNode;
var reviver = (0, _factoriesNumber.createReviver)({
  classes: classes
});
exports.reviver = reviver;
var AccessorNode = (0, _factoriesNumber.createAccessorNode)({
  Node: Node,
  subset: _pureFunctionsNumber.subset
});
exports.AccessorNode = AccessorNode;
var BlockNode = (0, _factoriesNumber.createBlockNode)({
  Node: Node,
  ResultSet: _pureFunctionsNumber.ResultSet
});
exports.BlockNode = BlockNode;
var OperatorNode = (0, _factoriesNumber.createOperatorNode)({
  Node: Node
});
exports.OperatorNode = OperatorNode;
var SymbolNode = (0, _factoriesNumber.createSymbolNode)({
  Node: Node,
  math: math
});
exports.SymbolNode = SymbolNode;
var ConstantNode = (0, _factoriesNumber.createConstantNode)({
  Node: Node
});
exports.ConstantNode = ConstantNode;
var RangeNode = (0, _factoriesNumber.createRangeNode)({
  Node: Node
});
exports.RangeNode = RangeNode;
var FunctionNode = (0, _factoriesNumber.createFunctionNode)({
  Node: Node,
  SymbolNode: SymbolNode,
  math: math
});
exports.FunctionNode = FunctionNode;
var AssignmentNode = (0, _factoriesNumber.createAssignmentNode)({
  matrix: _pureFunctionsNumber.matrix,
  Node: Node,
  subset: _pureFunctionsNumber.subset
});
exports.AssignmentNode = AssignmentNode;
var IndexNode = (0, _factoriesNumber.createIndexNode)({
  Node: Node,
  Range: _pureFunctionsNumber.Range,
  size: _pureFunctionsNumber.size
});
exports.IndexNode = IndexNode;
var parse = (0, _factoriesNumber.createParse)({
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
  config: _configReadonly.config,
  numeric: _pureFunctionsNumber.numeric,
  typed: _pureFunctionsNumber.typed
});
exports.parse = parse;
var evaluate = (0, _factoriesNumber.createEvaluate)({
  parse: parse,
  typed: _pureFunctionsNumber.typed
});
exports.evaluate = evaluate;
var Help = (0, _factoriesNumber.createHelpClass)({
  parse: parse
});
exports.Help = Help;
var simplify = (0, _factoriesNumber.createSimplify)({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  add: _pureFunctionsNumber.add,
  config: _configReadonly.config,
  divide: _pureFunctionsNumber.divide,
  equal: _pureFunctionsNumber.equal,
  isZero: _pureFunctionsNumber.isZero,
  mathWithTransform: mathWithTransform,
  multiply: _pureFunctionsNumber.multiply,
  parse: parse,
  pow: _pureFunctionsNumber.pow,
  subtract: _pureFunctionsNumber.subtract,
  typed: _pureFunctionsNumber.typed
});
exports.simplify = simplify;
var rationalize = (0, _factoriesNumber.createRationalize)({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  add: _pureFunctionsNumber.add,
  config: _configReadonly.config,
  divide: _pureFunctionsNumber.divide,
  equal: _pureFunctionsNumber.equal,
  isZero: _pureFunctionsNumber.isZero,
  mathWithTransform: mathWithTransform,
  multiply: _pureFunctionsNumber.multiply,
  parse: parse,
  pow: _pureFunctionsNumber.pow,
  simplify: simplify,
  subtract: _pureFunctionsNumber.subtract,
  typed: _pureFunctionsNumber.typed
});
exports.rationalize = rationalize;
var compile = (0, _factoriesNumber.createCompile)({
  parse: parse,
  typed: _pureFunctionsNumber.typed
});
exports.compile = compile;
var help = (0, _factoriesNumber.createHelp)({
  Help: Help,
  mathWithTransform: mathWithTransform,
  typed: _pureFunctionsNumber.typed
});
exports.help = help;
var Parser = (0, _factoriesNumber.createParserClass)({
  parse: parse
});
exports.Parser = Parser;
var derivative = (0, _factoriesNumber.createDerivative)({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  config: _configReadonly.config,
  equal: _pureFunctionsNumber.equal,
  isZero: _pureFunctionsNumber.isZero,
  numeric: _pureFunctionsNumber.numeric,
  parse: parse,
  simplify: simplify,
  typed: _pureFunctionsNumber.typed
});
exports.derivative = derivative;
var parser = (0, _factoriesNumber.createParser)({
  Parser: Parser,
  typed: _pureFunctionsNumber.typed
});
exports.parser = parser;

_extends(math, {
  typed: _pureFunctionsNumber.typed,
  chain: chain,
  nthRoot: _pureFunctionsNumber.nthRoot,
  e: _pureFunctionsNumber.e,
  "false": _pureFunctionsNumber._false,
  LN10: _pureFunctionsNumber.LN10,
  LOG10E: _pureFunctionsNumber.LOG10E,
  NaN: _pureFunctionsNumber._NaN,
  phi: _pureFunctionsNumber.phi,
  SQRT1_2: _pureFunctionsNumber.SQRT1_2,
  tau: _pureFunctionsNumber.tau,
  version: _pureFunctionsNumber.version,
  string: _pureFunctionsNumber.string,
  filter: _pureFunctionsNumber.filter,
  map: _pureFunctionsNumber.map,
  combinationsWithRep: _pureFunctionsNumber.combinationsWithRep,
  pickRandom: _pureFunctionsNumber.pickRandom,
  randomInt: _pureFunctionsNumber.randomInt,
  compare: _pureFunctionsNumber.compare,
  compareText: _pureFunctionsNumber.compareText,
  smaller: _pureFunctionsNumber.smaller,
  larger: _pureFunctionsNumber.larger,
  erf: _pureFunctionsNumber.erf,
  max: _pureFunctionsNumber.max,
  format: _pureFunctionsNumber.format,
  clone: _pureFunctionsNumber.clone,
  typeOf: _pureFunctionsNumber.typeOf,
  reviver: reviver,
  unaryPlus: _pureFunctionsNumber.unaryPlus,
  addScalar: _pureFunctionsNumber.addScalar,
  ceil: _pureFunctionsNumber.ceil,
  exp: _pureFunctionsNumber.exp,
  fix: _pureFunctionsNumber.fix,
  gcd: _pureFunctionsNumber.gcd,
  log10: _pureFunctionsNumber.log10,
  mod: _pureFunctionsNumber.mod,
  multiply: _pureFunctionsNumber.multiply,
  sqrt: _pureFunctionsNumber.sqrt,
  subtract: _pureFunctionsNumber.subtract,
  divideScalar: _pureFunctionsNumber.divideScalar,
  log: _pureFunctionsNumber.log,
  add: _pureFunctionsNumber.add,
  divide: _pureFunctionsNumber.divide,
  bitNot: _pureFunctionsNumber.bitNot,
  bitXor: _pureFunctionsNumber.bitXor,
  rightArithShift: _pureFunctionsNumber.rightArithShift,
  and: _pureFunctionsNumber.and,
  or: _pureFunctionsNumber.or,
  index: _pureFunctionsNumber.index,
  subset: _pureFunctionsNumber.subset,
  gamma: _pureFunctionsNumber.gamma,
  acosh: _pureFunctionsNumber.acosh,
  acoth: _pureFunctionsNumber.acoth,
  acsch: _pureFunctionsNumber.acsch,
  asech: _pureFunctionsNumber.asech,
  asinh: _pureFunctionsNumber.asinh,
  atan2: _pureFunctionsNumber.atan2,
  cos: _pureFunctionsNumber.cos,
  cot: _pureFunctionsNumber.cot,
  csc: _pureFunctionsNumber.csc,
  sec: _pureFunctionsNumber.sec,
  sin: _pureFunctionsNumber.sin,
  tan: _pureFunctionsNumber.tan,
  isInteger: _pureFunctionsNumber.isInteger,
  isPositive: _pureFunctionsNumber.isPositive,
  isNaN: _pureFunctionsNumber.isNaN,
  round: _pureFunctionsNumber.round,
  'E': _pureFunctionsNumber.e,
  LN2: _pureFunctionsNumber.LN2,
  "null": _pureFunctionsNumber._null,
  SQRT2: _pureFunctionsNumber.SQRT2,
  number: _pureFunctionsNumber.number,
  apply: _pureFunctionsNumber.apply,
  factorial: _pureFunctionsNumber.factorial,
  permutations: _pureFunctionsNumber.permutations,
  equalScalar: _pureFunctionsNumber.equalScalar,
  equal: _pureFunctionsNumber.equal,
  smallerEq: _pureFunctionsNumber.smallerEq,
  deepEqual: _pureFunctionsNumber.deepEqual,
  prod: _pureFunctionsNumber.prod,
  sum: _pureFunctionsNumber.sum,
  variance: _pureFunctionsNumber.variance,
  std: _pureFunctionsNumber.std,
  isPrime: _pureFunctionsNumber.isPrime,
  unaryMinus: _pureFunctionsNumber.unaryMinus,
  cbrt: _pureFunctionsNumber.cbrt,
  expm1: _pureFunctionsNumber.expm1,
  lcm: _pureFunctionsNumber.lcm,
  multiplyScalar: _pureFunctionsNumber.multiplyScalar,
  square: _pureFunctionsNumber.square,
  pow: _pureFunctionsNumber.pow,
  norm: _pureFunctionsNumber.norm,
  bitOr: _pureFunctionsNumber.bitOr,
  rightLogShift: _pureFunctionsNumber.rightLogShift,
  xor: _pureFunctionsNumber.xor,
  combinations: _pureFunctionsNumber.combinations,
  acot: _pureFunctionsNumber.acot,
  asec: _pureFunctionsNumber.asec,
  atan: _pureFunctionsNumber.atan,
  cosh: _pureFunctionsNumber.cosh,
  csch: _pureFunctionsNumber.csch,
  sinh: _pureFunctionsNumber.sinh,
  isNegative: _pureFunctionsNumber.isNegative,
  stirlingS2: _pureFunctionsNumber.stirlingS2,
  catalan: _pureFunctionsNumber.catalan,
  Infinity: _pureFunctionsNumber._Infinity,
  pi: _pureFunctionsNumber.pi,
  "true": _pureFunctionsNumber._true,
  forEach: _pureFunctionsNumber.forEach,
  multinomial: _pureFunctionsNumber.multinomial,
  compareNatural: _pureFunctionsNumber.compareNatural,
  largerEq: _pureFunctionsNumber.largerEq,
  min: _pureFunctionsNumber.min,
  print: _pureFunctionsNumber.print,
  numeric: _pureFunctionsNumber.numeric,
  cube: _pureFunctionsNumber.cube,
  log2: _pureFunctionsNumber.log2,
  xgcd: _pureFunctionsNumber.xgcd,
  bitAnd: _pureFunctionsNumber.bitAnd,
  not: _pureFunctionsNumber.not,
  acos: _pureFunctionsNumber.acos,
  asin: _pureFunctionsNumber.asin,
  coth: _pureFunctionsNumber.coth,
  tanh: _pureFunctionsNumber.tanh,
  bellNumbers: _pureFunctionsNumber.bellNumbers,
  LOG2E: _pureFunctionsNumber.LOG2E,
  "boolean": _pureFunctionsNumber["boolean"],
  random: _pureFunctionsNumber.random,
  unequal: _pureFunctionsNumber.unequal,
  mean: _pureFunctionsNumber.mean,
  isNumeric: _pureFunctionsNumber.isNumeric,
  abs: _pureFunctionsNumber.abs,
  sign: _pureFunctionsNumber.sign,
  leftShift: _pureFunctionsNumber.leftShift,
  acsc: _pureFunctionsNumber.acsc,
  sech: _pureFunctionsNumber.sech,
  hypot: _pureFunctionsNumber.hypot,
  'PI': _pureFunctionsNumber.pi,
  partitionSelect: _pureFunctionsNumber.partitionSelect,
  mode: _pureFunctionsNumber.mode,
  quantileSeq: _pureFunctionsNumber.quantileSeq,
  hasNumericValue: _pureFunctionsNumber.hasNumericValue,
  log1p: _pureFunctionsNumber.log1p,
  atanh: _pureFunctionsNumber.atanh,
  composition: _pureFunctionsNumber.composition,
  median: _pureFunctionsNumber.median,
  floor: _pureFunctionsNumber.floor,
  isZero: _pureFunctionsNumber.isZero,
  equalText: _pureFunctionsNumber.equalText,
  matrix: _pureFunctionsNumber.matrix,
  range: _pureFunctionsNumber.range,
  mad: _pureFunctionsNumber.mad,
  size: _pureFunctionsNumber.size,
  parse: parse,
  evaluate: evaluate,
  simplify: simplify,
  rationalize: rationalize,
  compile: compile,
  help: help,
  derivative: derivative,
  parser: parser,
  config: _configReadonly.config
});

_extends(mathWithTransform, math, {
  filter: (0, _factoriesNumber.createFilterTransform)({
    typed: _pureFunctionsNumber.typed
  }),
  map: (0, _factoriesNumber.createMapTransform)({
    typed: _pureFunctionsNumber.typed
  }),
  min: (0, _factoriesNumber.createMinTransform)({
    smaller: _pureFunctionsNumber.smaller,
    typed: _pureFunctionsNumber.typed
  }),
  apply: (0, _factoriesNumber.createApplyTransform)({
    isInteger: _pureFunctionsNumber.isInteger,
    typed: _pureFunctionsNumber.typed
  }),
  max: (0, _factoriesNumber.createMaxTransform)({
    larger: _pureFunctionsNumber.larger,
    typed: _pureFunctionsNumber.typed
  }),
  std: (0, _factoriesNumber.createStdTransform)({
    sqrt: _pureFunctionsNumber.sqrt,
    typed: _pureFunctionsNumber.typed,
    variance: _pureFunctionsNumber.variance
  }),
  variance: (0, _factoriesNumber.createVarianceTransform)({
    add: _pureFunctionsNumber.add,
    apply: _pureFunctionsNumber.apply,
    divide: _pureFunctionsNumber.divide,
    isNaN: _pureFunctionsNumber.isNaN,
    multiply: _pureFunctionsNumber.multiply,
    subtract: _pureFunctionsNumber.subtract,
    typed: _pureFunctionsNumber.typed
  }),
  mean: (0, _factoriesNumber.createMeanTransform)({
    add: _pureFunctionsNumber.add,
    divide: _pureFunctionsNumber.divide,
    typed: _pureFunctionsNumber.typed
  }),
  sum: (0, _factoriesNumber.createSumTransform)({
    add: _pureFunctionsNumber.add,
    config: _configReadonly.config,
    typed: _pureFunctionsNumber.typed
  }),
  forEach: (0, _factoriesNumber.createForEachTransform)({
    typed: _pureFunctionsNumber.typed
  }),
  subset: (0, _factoriesNumber.createSubsetTransform)({
    matrix: _pureFunctionsNumber.matrix,
    typed: _pureFunctionsNumber.typed
  }),
  range: (0, _factoriesNumber.createRangeTransform)({
    matrix: _pureFunctionsNumber.matrix,
    config: _configReadonly.config,
    larger: _pureFunctionsNumber.larger,
    largerEq: _pureFunctionsNumber.largerEq,
    smaller: _pureFunctionsNumber.smaller,
    smallerEq: _pureFunctionsNumber.smallerEq,
    typed: _pureFunctionsNumber.typed
  })
});

_extends(classes, {
  Range: _pureFunctionsNumber.Range,
  Chain: Chain,
  Node: Node,
  ArrayNode: ArrayNode,
  ConditionalNode: ConditionalNode,
  FunctionAssignmentNode: FunctionAssignmentNode,
  ObjectNode: ObjectNode,
  ParenthesisNode: ParenthesisNode,
  RelationalNode: RelationalNode,
  ResultSet: _pureFunctionsNumber.ResultSet,
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