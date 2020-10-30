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
exports.derivative = exports.help = exports.rationalize = exports.simplify = exports.parser = exports.compile = exports.Help = exports.Parser = exports.evaluate = exports.parse = exports.FunctionNode = exports.SymbolNode = exports.AssignmentNode = exports.IndexNode = exports.AccessorNode = exports.chain = exports.FunctionAssignmentNode = exports.RangeNode = exports.OperatorNode = exports.ConditionalNode = exports.reviver = exports.Chain = exports.RelationalNode = exports.ParenthesisNode = exports.ObjectNode = exports.ConstantNode = exports.BlockNode = exports.ArrayNode = exports.Node = void 0;

var _configReadonly = require("./configReadonly");

var _factoriesAny = require("../factoriesAny");

var _pureFunctionsAny = require("./pureFunctionsAny.generated");

var _embeddedDocs = require("../expression/embeddedDocs/embeddedDocs");

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var math = {}; // NOT pure!

var mathWithTransform = {}; // NOT pure!

var classes = {}; // NOT pure!

var Node = (0, _factoriesAny.createNode)({
  mathWithTransform: mathWithTransform
});
exports.Node = Node;
var ArrayNode = (0, _factoriesAny.createArrayNode)({
  Node: Node
});
exports.ArrayNode = ArrayNode;
var BlockNode = (0, _factoriesAny.createBlockNode)({
  Node: Node,
  ResultSet: _pureFunctionsAny.ResultSet
});
exports.BlockNode = BlockNode;
var ConstantNode = (0, _factoriesAny.createConstantNode)({
  Node: Node
});
exports.ConstantNode = ConstantNode;
var ObjectNode = (0, _factoriesAny.createObjectNode)({
  Node: Node
});
exports.ObjectNode = ObjectNode;
var ParenthesisNode = (0, _factoriesAny.createParenthesisNode)({
  Node: Node
});
exports.ParenthesisNode = ParenthesisNode;
var RelationalNode = (0, _factoriesAny.createRelationalNode)({
  Node: Node
});
exports.RelationalNode = RelationalNode;
var Chain = (0, _factoriesAny.createChainClass)({
  math: math
});
exports.Chain = Chain;
var reviver = (0, _factoriesAny.createReviver)({
  classes: classes
});
exports.reviver = reviver;
var ConditionalNode = (0, _factoriesAny.createConditionalNode)({
  Node: Node
});
exports.ConditionalNode = ConditionalNode;
var OperatorNode = (0, _factoriesAny.createOperatorNode)({
  Node: Node
});
exports.OperatorNode = OperatorNode;
var RangeNode = (0, _factoriesAny.createRangeNode)({
  Node: Node
});
exports.RangeNode = RangeNode;
var FunctionAssignmentNode = (0, _factoriesAny.createFunctionAssignmentNode)({
  Node: Node,
  typed: _pureFunctionsAny.typed
});
exports.FunctionAssignmentNode = FunctionAssignmentNode;
var chain = (0, _factoriesAny.createChain)({
  Chain: Chain,
  typed: _pureFunctionsAny.typed
});
exports.chain = chain;
var AccessorNode = (0, _factoriesAny.createAccessorNode)({
  Node: Node,
  subset: _pureFunctionsAny.subset
});
exports.AccessorNode = AccessorNode;
var IndexNode = (0, _factoriesAny.createIndexNode)({
  Node: Node,
  Range: _pureFunctionsAny.Range,
  size: _pureFunctionsAny.size
});
exports.IndexNode = IndexNode;
var AssignmentNode = (0, _factoriesAny.createAssignmentNode)({
  matrix: _pureFunctionsAny.matrix,
  Node: Node,
  subset: _pureFunctionsAny.subset
});
exports.AssignmentNode = AssignmentNode;
var SymbolNode = (0, _factoriesAny.createSymbolNode)({
  Unit: _pureFunctionsAny.Unit,
  Node: Node,
  math: math
});
exports.SymbolNode = SymbolNode;
var FunctionNode = (0, _factoriesAny.createFunctionNode)({
  Node: Node,
  SymbolNode: SymbolNode,
  math: math
});
exports.FunctionNode = FunctionNode;
var parse = (0, _factoriesAny.createParse)({
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
  numeric: _pureFunctionsAny.numeric,
  typed: _pureFunctionsAny.typed
});
exports.parse = parse;
var evaluate = (0, _factoriesAny.createEvaluate)({
  parse: parse,
  typed: _pureFunctionsAny.typed
});
exports.evaluate = evaluate;
var Parser = (0, _factoriesAny.createParserClass)({
  parse: parse
});
exports.Parser = Parser;
var Help = (0, _factoriesAny.createHelpClass)({
  parse: parse
});
exports.Help = Help;
var compile = (0, _factoriesAny.createCompile)({
  parse: parse,
  typed: _pureFunctionsAny.typed
});
exports.compile = compile;
var parser = (0, _factoriesAny.createParser)({
  Parser: Parser,
  typed: _pureFunctionsAny.typed
});
exports.parser = parser;
var simplify = (0, _factoriesAny.createSimplify)({
  bignumber: _pureFunctionsAny.bignumber,
  fraction: _pureFunctionsAny.fraction,
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  add: _pureFunctionsAny.add,
  config: _configReadonly.config,
  divide: _pureFunctionsAny.divide,
  equal: _pureFunctionsAny.equal,
  isZero: _pureFunctionsAny.isZero,
  mathWithTransform: mathWithTransform,
  multiply: _pureFunctionsAny.multiply,
  parse: parse,
  pow: _pureFunctionsAny.pow,
  subtract: _pureFunctionsAny.subtract,
  typed: _pureFunctionsAny.typed
});
exports.simplify = simplify;
var rationalize = (0, _factoriesAny.createRationalize)({
  bignumber: _pureFunctionsAny.bignumber,
  fraction: _pureFunctionsAny.fraction,
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  add: _pureFunctionsAny.add,
  config: _configReadonly.config,
  divide: _pureFunctionsAny.divide,
  equal: _pureFunctionsAny.equal,
  isZero: _pureFunctionsAny.isZero,
  mathWithTransform: mathWithTransform,
  multiply: _pureFunctionsAny.multiply,
  parse: parse,
  pow: _pureFunctionsAny.pow,
  simplify: simplify,
  subtract: _pureFunctionsAny.subtract,
  typed: _pureFunctionsAny.typed
});
exports.rationalize = rationalize;
var help = (0, _factoriesAny.createHelp)({
  Help: Help,
  mathWithTransform: mathWithTransform,
  typed: _pureFunctionsAny.typed
});
exports.help = help;
var derivative = (0, _factoriesAny.createDerivative)({
  ConstantNode: ConstantNode,
  FunctionNode: FunctionNode,
  OperatorNode: OperatorNode,
  ParenthesisNode: ParenthesisNode,
  SymbolNode: SymbolNode,
  config: _configReadonly.config,
  equal: _pureFunctionsAny.equal,
  isZero: _pureFunctionsAny.isZero,
  numeric: _pureFunctionsAny.numeric,
  parse: parse,
  simplify: simplify,
  typed: _pureFunctionsAny.typed
});
exports.derivative = derivative;

_extends(math, {
  'typeof': _pureFunctionsAny.typeOf,
  eye: _pureFunctionsAny.eye,
  reviver: reviver,
  "false": _pureFunctionsAny._false,
  "null": _pureFunctionsAny._null,
  "true": _pureFunctionsAny._true,
  e: _pureFunctionsAny.e,
  i: _pureFunctionsAny.i,
  LN10: _pureFunctionsAny.LN10,
  LOG10E: _pureFunctionsAny.LOG10E,
  NaN: _pureFunctionsAny._NaN,
  pi: _pureFunctionsAny.pi,
  SQRT1_2: _pureFunctionsAny.SQRT1_2,
  tau: _pureFunctionsAny.tau,
  efimovFactor: _pureFunctionsAny.efimovFactor,
  fineStructure: _pureFunctionsAny.fineStructure,
  sackurTetrode: _pureFunctionsAny.sackurTetrode,
  weakMixingAngle: _pureFunctionsAny.weakMixingAngle,
  'E': _pureFunctionsAny.e,
  LN2: _pureFunctionsAny.LN2,
  phi: _pureFunctionsAny.phi,
  SQRT2: _pureFunctionsAny.SQRT2,
  Infinity: _pureFunctionsAny._Infinity,
  'PI': _pureFunctionsAny.pi,
  typed: _pureFunctionsAny.typed,
  isInteger: _pureFunctionsAny.isInteger,
  isNumeric: _pureFunctionsAny.isNumeric,
  isPositive: _pureFunctionsAny.isPositive,
  isNaN: _pureFunctionsAny.isNaN,
  equalScalar: _pureFunctionsAny.equalScalar,
  number: _pureFunctionsAny.number,
  "boolean": _pureFunctionsAny["boolean"],
  complex: _pureFunctionsAny.complex,
  splitUnit: _pureFunctionsAny.splitUnit,
  unaryPlus: _pureFunctionsAny.unaryPlus,
  apply: _pureFunctionsAny.apply,
  cube: _pureFunctionsAny.cube,
  expm1: _pureFunctionsAny.expm1,
  log10: _pureFunctionsAny.log10,
  multiplyScalar: _pureFunctionsAny.multiplyScalar,
  sign: _pureFunctionsAny.sign,
  square: _pureFunctionsAny.square,
  bitNot: _pureFunctionsAny.bitNot,
  arg: _pureFunctionsAny.arg,
  im: _pureFunctionsAny.im,
  not: _pureFunctionsAny.not,
  filter: _pureFunctionsAny.filter,
  forEach: _pureFunctionsAny.forEach,
  map: _pureFunctionsAny.map,
  erf: _pureFunctionsAny.erf,
  format: _pureFunctionsAny.format,
  isPrime: _pureFunctionsAny.isPrime,
  acos: _pureFunctionsAny.acos,
  acot: _pureFunctionsAny.acot,
  acsc: _pureFunctionsAny.acsc,
  asec: _pureFunctionsAny.asec,
  asin: _pureFunctionsAny.asin,
  atan: _pureFunctionsAny.atan,
  atanh: _pureFunctionsAny.atanh,
  cosh: _pureFunctionsAny.cosh,
  coth: _pureFunctionsAny.coth,
  csch: _pureFunctionsAny.csch,
  sech: _pureFunctionsAny.sech,
  sinh: _pureFunctionsAny.sinh,
  tanh: _pureFunctionsAny.tanh,
  chain: chain,
  combinations: _pureFunctionsAny.combinations,
  pickRandom: _pureFunctionsAny.pickRandom,
  randomInt: _pureFunctionsAny.randomInt,
  LOG2E: _pureFunctionsAny.LOG2E,
  clone: _pureFunctionsAny.clone,
  hasNumericValue: _pureFunctionsAny.hasNumericValue,
  typeOf: _pureFunctionsAny.typeOf,
  string: _pureFunctionsAny.string,
  fraction: _pureFunctionsAny.fraction,
  unaryMinus: _pureFunctionsAny.unaryMinus,
  addScalar: _pureFunctionsAny.addScalar,
  exp: _pureFunctionsAny.exp,
  log2: _pureFunctionsAny.log2,
  sqrt: _pureFunctionsAny.sqrt,
  conj: _pureFunctionsAny.conj,
  getMatrixDataType: _pureFunctionsAny.getMatrixDataType,
  mode: _pureFunctionsAny.mode,
  print: _pureFunctionsAny.print,
  acosh: _pureFunctionsAny.acosh,
  acsch: _pureFunctionsAny.acsch,
  asinh: _pureFunctionsAny.asinh,
  cos: _pureFunctionsAny.cos,
  csc: _pureFunctionsAny.csc,
  sin: _pureFunctionsAny.sin,
  combinationsWithRep: _pureFunctionsAny.combinationsWithRep,
  random: _pureFunctionsAny.random,
  version: _pureFunctionsAny.version,
  isNegative: _pureFunctionsAny.isNegative,
  matrix: _pureFunctionsAny.matrix,
  cbrt: _pureFunctionsAny.cbrt,
  gcd: _pureFunctionsAny.gcd,
  mod: _pureFunctionsAny.mod,
  nthRoot: _pureFunctionsAny.nthRoot,
  xgcd: _pureFunctionsAny.xgcd,
  bitAnd: _pureFunctionsAny.bitAnd,
  bitXor: _pureFunctionsAny.bitXor,
  or: _pureFunctionsAny.or,
  concat: _pureFunctionsAny.concat,
  diag: _pureFunctionsAny.diag,
  identity: _pureFunctionsAny.identity,
  ones: _pureFunctionsAny.ones,
  reshape: _pureFunctionsAny.reshape,
  size: _pureFunctionsAny.size,
  subset: _pureFunctionsAny.subset,
  zeros: _pureFunctionsAny.zeros,
  to: _pureFunctionsAny.to,
  round: _pureFunctionsAny.round,
  leftShift: _pureFunctionsAny.leftShift,
  rightLogShift: _pureFunctionsAny.rightLogShift,
  compare: _pureFunctionsAny.compare,
  compareText: _pureFunctionsAny.compareText,
  smaller: _pureFunctionsAny.smaller,
  larger: _pureFunctionsAny.larger,
  unequal: _pureFunctionsAny.unequal,
  max: _pureFunctionsAny.max,
  sparse: _pureFunctionsAny.sparse,
  acoth: _pureFunctionsAny.acoth,
  atan2: _pureFunctionsAny.atan2,
  sec: _pureFunctionsAny.sec,
  add: _pureFunctionsAny.add,
  trace: _pureFunctionsAny.trace,
  composition: _pureFunctionsAny.composition,
  isZero: _pureFunctionsAny.isZero,
  abs: _pureFunctionsAny.abs,
  floor: _pureFunctionsAny.floor,
  multiply: _pureFunctionsAny.multiply,
  dotMultiply: _pureFunctionsAny.dotMultiply,
  re: _pureFunctionsAny.re,
  flatten: _pureFunctionsAny.flatten,
  resize: _pureFunctionsAny.resize,
  squeeze: _pureFunctionsAny.squeeze,
  prod: _pureFunctionsAny.prod,
  pow: _pureFunctionsAny.pow,
  dotPow: _pureFunctionsAny.dotPow,
  rightArithShift: _pureFunctionsAny.rightArithShift,
  compareNatural: _pureFunctionsAny.compareNatural,
  equalText: _pureFunctionsAny.equalText,
  largerEq: _pureFunctionsAny.largerEq,
  partitionSelect: _pureFunctionsAny.partitionSelect,
  min: _pureFunctionsAny.min,
  asech: _pureFunctionsAny.asech,
  tan: _pureFunctionsAny.tan,
  setSize: _pureFunctionsAny.setSize,
  norm: _pureFunctionsAny.norm,
  quantileSeq: _pureFunctionsAny.quantileSeq,
  gamma: _pureFunctionsAny.gamma,
  bignumber: _pureFunctionsAny.bignumber,
  lcm: _pureFunctionsAny.lcm,
  bitOr: _pureFunctionsAny.bitOr,
  kron: _pureFunctionsAny.kron,
  transpose: _pureFunctionsAny.transpose,
  numeric: _pureFunctionsAny.numeric,
  and: _pureFunctionsAny.and,
  smallerEq: _pureFunctionsAny.smallerEq,
  sort: _pureFunctionsAny.sort,
  cot: _pureFunctionsAny.cot,
  dot: _pureFunctionsAny.dot,
  sum: _pureFunctionsAny.sum,
  factorial: _pureFunctionsAny.factorial,
  permutations: _pureFunctionsAny.permutations,
  ceil: _pureFunctionsAny.ceil,
  subtract: _pureFunctionsAny.subtract,
  cross: _pureFunctionsAny.cross,
  ctranspose: _pureFunctionsAny.ctranspose,
  equal: _pureFunctionsAny.equal,
  setCartesian: _pureFunctionsAny.setCartesian,
  setDistinct: _pureFunctionsAny.setDistinct,
  setIsSubset: _pureFunctionsAny.setIsSubset,
  setPowerset: _pureFunctionsAny.setPowerset,
  index: _pureFunctionsAny.index,
  fix: _pureFunctionsAny.fix,
  range: _pureFunctionsAny.range,
  divideScalar: _pureFunctionsAny.divideScalar,
  nthRoots: _pureFunctionsAny.nthRoots,
  lsolve: _pureFunctionsAny.lsolve,
  deepEqual: _pureFunctionsAny.deepEqual,
  setDifference: _pureFunctionsAny.setDifference,
  setMultiplicity: _pureFunctionsAny.setMultiplicity,
  hypot: _pureFunctionsAny.hypot,
  lup: _pureFunctionsAny.lup,
  slu: _pureFunctionsAny.slu,
  det: _pureFunctionsAny.det,
  distance: _pureFunctionsAny.distance,
  stirlingS2: _pureFunctionsAny.stirlingS2,
  catalan: _pureFunctionsAny.catalan,
  xor: _pureFunctionsAny.xor,
  row: _pureFunctionsAny.row,
  dotDivide: _pureFunctionsAny.dotDivide,
  createUnit: _pureFunctionsAny.createUnit,
  setSymDifference: _pureFunctionsAny.setSymDifference,
  qr: _pureFunctionsAny.qr,
  inv: _pureFunctionsAny.inv,
  expm: _pureFunctionsAny.expm,
  divide: _pureFunctionsAny.divide,
  mean: _pureFunctionsAny.mean,
  variance: _pureFunctionsAny.variance,
  std: _pureFunctionsAny.std,
  multinomial: _pureFunctionsAny.multinomial,
  atomicMass: _pureFunctionsAny.atomicMass,
  bohrMagneton: _pureFunctionsAny.bohrMagneton,
  boltzmann: _pureFunctionsAny.boltzmann,
  conductanceQuantum: _pureFunctionsAny.conductanceQuantum,
  deuteronMass: _pureFunctionsAny.deuteronMass,
  electronMass: _pureFunctionsAny.electronMass,
  faraday: _pureFunctionsAny.faraday,
  firstRadiation: _pureFunctionsAny.firstRadiation,
  gravitationConstant: _pureFunctionsAny.gravitationConstant,
  hartreeEnergy: _pureFunctionsAny.hartreeEnergy,
  klitzing: _pureFunctionsAny.klitzing,
  magneticConstant: _pureFunctionsAny.magneticConstant,
  molarMass: _pureFunctionsAny.molarMass,
  molarPlanckConstant: _pureFunctionsAny.molarPlanckConstant,
  neutronMass: _pureFunctionsAny.neutronMass,
  planckCharge: _pureFunctionsAny.planckCharge,
  planckLength: _pureFunctionsAny.planckLength,
  planckTemperature: _pureFunctionsAny.planckTemperature,
  protonMass: _pureFunctionsAny.protonMass,
  reducedPlanckConstant: _pureFunctionsAny.reducedPlanckConstant,
  secondRadiation: _pureFunctionsAny.secondRadiation,
  stefanBoltzmann: _pureFunctionsAny.stefanBoltzmann,
  vacuumImpedance: _pureFunctionsAny.vacuumImpedance,
  column: _pureFunctionsAny.column,
  usolve: _pureFunctionsAny.usolve,
  setIntersect: _pureFunctionsAny.setIntersect,
  lusolve: _pureFunctionsAny.lusolve,
  eigs: _pureFunctionsAny.eigs,
  intersect: _pureFunctionsAny.intersect,
  'var': _pureFunctionsAny.variance,
  bellNumbers: _pureFunctionsAny.bellNumbers,
  avogadro: _pureFunctionsAny.avogadro,
  classicalElectronRadius: _pureFunctionsAny.classicalElectronRadius,
  electricConstant: _pureFunctionsAny.electricConstant,
  fermiCoupling: _pureFunctionsAny.fermiCoupling,
  gravity: _pureFunctionsAny.gravity,
  loschmidt: _pureFunctionsAny.loschmidt,
  molarMassC12: _pureFunctionsAny.molarMassC12,
  nuclearMagneton: _pureFunctionsAny.nuclearMagneton,
  planckMass: _pureFunctionsAny.planckMass,
  quantumOfCirculation: _pureFunctionsAny.quantumOfCirculation,
  speedOfLight: _pureFunctionsAny.speedOfLight,
  wienDisplacement: _pureFunctionsAny.wienDisplacement,
  log: _pureFunctionsAny.log,
  unit: _pureFunctionsAny.unit,
  parse: parse,
  evaluate: evaluate,
  sqrtm: _pureFunctionsAny.sqrtm,
  kldivergence: _pureFunctionsAny.kldivergence,
  bohrRadius: _pureFunctionsAny.bohrRadius,
  elementaryCharge: _pureFunctionsAny.elementaryCharge,
  inverseConductanceQuantum: _pureFunctionsAny.inverseConductanceQuantum,
  molarVolume: _pureFunctionsAny.molarVolume,
  planckTime: _pureFunctionsAny.planckTime,
  thomsonCrossSection: _pureFunctionsAny.thomsonCrossSection,
  log1p: _pureFunctionsAny.log1p,
  compile: compile,
  parser: parser,
  median: _pureFunctionsAny.median,
  simplify: simplify,
  rationalize: rationalize,
  gasConstant: _pureFunctionsAny.gasConstant,
  planckConstant: _pureFunctionsAny.planckConstant,
  setUnion: _pureFunctionsAny.setUnion,
  help: help,
  derivative: derivative,
  magneticFluxQuantum: _pureFunctionsAny.magneticFluxQuantum,
  'eval': evaluate,
  coulomb: _pureFunctionsAny.coulomb,
  mad: _pureFunctionsAny.mad,
  rydberg: _pureFunctionsAny.rydberg,
  config: _configReadonly.config
});

_extends(mathWithTransform, math, {
  apply: (0, _factoriesAny.createApplyTransform)({
    isInteger: _pureFunctionsAny.isInteger,
    typed: _pureFunctionsAny.typed
  }),
  filter: (0, _factoriesAny.createFilterTransform)({
    typed: _pureFunctionsAny.typed
  }),
  map: (0, _factoriesAny.createMapTransform)({
    typed: _pureFunctionsAny.typed
  }),
  forEach: (0, _factoriesAny.createForEachTransform)({
    typed: _pureFunctionsAny.typed
  }),
  max: (0, _factoriesAny.createMaxTransform)({
    larger: _pureFunctionsAny.larger,
    typed: _pureFunctionsAny.typed
  }),
  min: (0, _factoriesAny.createMinTransform)({
    smaller: _pureFunctionsAny.smaller,
    typed: _pureFunctionsAny.typed
  }),
  subset: (0, _factoriesAny.createSubsetTransform)({
    matrix: _pureFunctionsAny.matrix,
    typed: _pureFunctionsAny.typed
  }),
  concat: (0, _factoriesAny.createConcatTransform)({
    isInteger: _pureFunctionsAny.isInteger,
    matrix: _pureFunctionsAny.matrix,
    typed: _pureFunctionsAny.typed
  }),
  range: (0, _factoriesAny.createRangeTransform)({
    bignumber: _pureFunctionsAny.bignumber,
    matrix: _pureFunctionsAny.matrix,
    config: _configReadonly.config,
    larger: _pureFunctionsAny.larger,
    largerEq: _pureFunctionsAny.largerEq,
    smaller: _pureFunctionsAny.smaller,
    smallerEq: _pureFunctionsAny.smallerEq,
    typed: _pureFunctionsAny.typed
  }),
  sum: (0, _factoriesAny.createSumTransform)({
    bignumber: _pureFunctionsAny.bignumber,
    fraction: _pureFunctionsAny.fraction,
    add: _pureFunctionsAny.add,
    config: _configReadonly.config,
    typed: _pureFunctionsAny.typed
  }),
  index: (0, _factoriesAny.createIndexTransform)({
    Index: _pureFunctionsAny.Index
  }),
  column: (0, _factoriesAny.createColumnTransform)({
    Index: _pureFunctionsAny.Index,
    matrix: _pureFunctionsAny.matrix,
    range: _pureFunctionsAny.range,
    typed: _pureFunctionsAny.typed
  }),
  row: (0, _factoriesAny.createRowTransform)({
    Index: _pureFunctionsAny.Index,
    matrix: _pureFunctionsAny.matrix,
    range: _pureFunctionsAny.range,
    typed: _pureFunctionsAny.typed
  }),
  mean: (0, _factoriesAny.createMeanTransform)({
    add: _pureFunctionsAny.add,
    divide: _pureFunctionsAny.divide,
    typed: _pureFunctionsAny.typed
  }),
  variance: (0, _factoriesAny.createVarianceTransform)({
    add: _pureFunctionsAny.add,
    apply: _pureFunctionsAny.apply,
    divide: _pureFunctionsAny.divide,
    isNaN: _pureFunctionsAny.isNaN,
    multiply: _pureFunctionsAny.multiply,
    subtract: _pureFunctionsAny.subtract,
    typed: _pureFunctionsAny.typed
  }),
  std: (0, _factoriesAny.createStdTransform)({
    sqrt: _pureFunctionsAny.sqrt,
    typed: _pureFunctionsAny.typed,
    variance: _pureFunctionsAny.variance
  })
});

_extends(classes, {
  ResultSet: _pureFunctionsAny.ResultSet,
  Complex: _pureFunctionsAny.Complex,
  Range: _pureFunctionsAny.Range,
  Node: Node,
  ArrayNode: ArrayNode,
  BlockNode: BlockNode,
  ConstantNode: ConstantNode,
  ObjectNode: ObjectNode,
  ParenthesisNode: ParenthesisNode,
  RelationalNode: RelationalNode,
  Chain: Chain,
  BigNumber: _pureFunctionsAny.BigNumber,
  Matrix: _pureFunctionsAny.Matrix,
  ConditionalNode: ConditionalNode,
  OperatorNode: OperatorNode,
  Fraction: _pureFunctionsAny.Fraction,
  RangeNode: RangeNode,
  DenseMatrix: _pureFunctionsAny.DenseMatrix,
  FunctionAssignmentNode: FunctionAssignmentNode,
  SparseMatrix: _pureFunctionsAny.SparseMatrix,
  ImmutableDenseMatrix: _pureFunctionsAny.ImmutableDenseMatrix,
  FibonacciHeap: _pureFunctionsAny.FibonacciHeap,
  AccessorNode: AccessorNode,
  IndexNode: IndexNode,
  Spa: _pureFunctionsAny.Spa,
  AssignmentNode: AssignmentNode,
  Index: _pureFunctionsAny.Index,
  Unit: _pureFunctionsAny.Unit,
  SymbolNode: SymbolNode,
  FunctionNode: FunctionNode,
  Parser: Parser,
  Help: Help
});

Chain.createProxy(math);