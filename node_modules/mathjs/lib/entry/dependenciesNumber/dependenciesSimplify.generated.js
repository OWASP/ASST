"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.simplifyDependencies = void 0;

var _dependenciesConstantNode = require("./dependenciesConstantNode.generated");

var _dependenciesFunctionNode = require("./dependenciesFunctionNode.generated");

var _dependenciesOperatorNode = require("./dependenciesOperatorNode.generated");

var _dependenciesParenthesisNode = require("./dependenciesParenthesisNode.generated");

var _dependenciesSymbolNode = require("./dependenciesSymbolNode.generated");

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesDivide = require("./dependenciesDivide.generated");

var _dependenciesEqual = require("./dependenciesEqual.generated");

var _dependenciesIsZero = require("./dependenciesIsZero.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesParse = require("./dependenciesParse.generated");

var _dependenciesPow = require("./dependenciesPow.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var simplifyDependencies = {
  ConstantNodeDependencies: _dependenciesConstantNode.ConstantNodeDependencies,
  FunctionNodeDependencies: _dependenciesFunctionNode.FunctionNodeDependencies,
  OperatorNodeDependencies: _dependenciesOperatorNode.OperatorNodeDependencies,
  ParenthesisNodeDependencies: _dependenciesParenthesisNode.ParenthesisNodeDependencies,
  SymbolNodeDependencies: _dependenciesSymbolNode.SymbolNodeDependencies,
  addDependencies: _dependenciesAdd.addDependencies,
  divideDependencies: _dependenciesDivide.divideDependencies,
  equalDependencies: _dependenciesEqual.equalDependencies,
  isZeroDependencies: _dependenciesIsZero.isZeroDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  parseDependencies: _dependenciesParse.parseDependencies,
  powDependencies: _dependenciesPow.powDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSimplify: _factoriesNumber.createSimplify
};
exports.simplifyDependencies = simplifyDependencies;