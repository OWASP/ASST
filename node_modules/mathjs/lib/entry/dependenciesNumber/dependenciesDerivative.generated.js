"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.derivativeDependencies = void 0;

var _dependenciesConstantNode = require("./dependenciesConstantNode.generated");

var _dependenciesFunctionNode = require("./dependenciesFunctionNode.generated");

var _dependenciesOperatorNode = require("./dependenciesOperatorNode.generated");

var _dependenciesParenthesisNode = require("./dependenciesParenthesisNode.generated");

var _dependenciesSymbolNode = require("./dependenciesSymbolNode.generated");

var _dependenciesEqual = require("./dependenciesEqual.generated");

var _dependenciesIsZero = require("./dependenciesIsZero.generated");

var _dependenciesNumeric = require("./dependenciesNumeric.generated");

var _dependenciesParse = require("./dependenciesParse.generated");

var _dependenciesSimplify = require("./dependenciesSimplify.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var derivativeDependencies = {
  ConstantNodeDependencies: _dependenciesConstantNode.ConstantNodeDependencies,
  FunctionNodeDependencies: _dependenciesFunctionNode.FunctionNodeDependencies,
  OperatorNodeDependencies: _dependenciesOperatorNode.OperatorNodeDependencies,
  ParenthesisNodeDependencies: _dependenciesParenthesisNode.ParenthesisNodeDependencies,
  SymbolNodeDependencies: _dependenciesSymbolNode.SymbolNodeDependencies,
  equalDependencies: _dependenciesEqual.equalDependencies,
  isZeroDependencies: _dependenciesIsZero.isZeroDependencies,
  numericDependencies: _dependenciesNumeric.numericDependencies,
  parseDependencies: _dependenciesParse.parseDependencies,
  simplifyDependencies: _dependenciesSimplify.simplifyDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createDerivative: _factoriesNumber.createDerivative
};
exports.derivativeDependencies = derivativeDependencies;