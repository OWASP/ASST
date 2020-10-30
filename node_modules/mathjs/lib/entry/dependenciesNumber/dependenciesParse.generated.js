"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.parseDependencies = void 0;

var _dependenciesAccessorNode = require("./dependenciesAccessorNode.generated");

var _dependenciesArrayNode = require("./dependenciesArrayNode.generated");

var _dependenciesAssignmentNode = require("./dependenciesAssignmentNode.generated");

var _dependenciesBlockNode = require("./dependenciesBlockNode.generated");

var _dependenciesConditionalNode = require("./dependenciesConditionalNode.generated");

var _dependenciesConstantNode = require("./dependenciesConstantNode.generated");

var _dependenciesFunctionAssignmentNode = require("./dependenciesFunctionAssignmentNode.generated");

var _dependenciesFunctionNode = require("./dependenciesFunctionNode.generated");

var _dependenciesIndexNode = require("./dependenciesIndexNode.generated");

var _dependenciesObjectNode = require("./dependenciesObjectNode.generated");

var _dependenciesOperatorNode = require("./dependenciesOperatorNode.generated");

var _dependenciesParenthesisNode = require("./dependenciesParenthesisNode.generated");

var _dependenciesRangeNode = require("./dependenciesRangeNode.generated");

var _dependenciesRelationalNode = require("./dependenciesRelationalNode.generated");

var _dependenciesSymbolNode = require("./dependenciesSymbolNode.generated");

var _dependenciesNumeric = require("./dependenciesNumeric.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var parseDependencies = {
  AccessorNodeDependencies: _dependenciesAccessorNode.AccessorNodeDependencies,
  ArrayNodeDependencies: _dependenciesArrayNode.ArrayNodeDependencies,
  AssignmentNodeDependencies: _dependenciesAssignmentNode.AssignmentNodeDependencies,
  BlockNodeDependencies: _dependenciesBlockNode.BlockNodeDependencies,
  ConditionalNodeDependencies: _dependenciesConditionalNode.ConditionalNodeDependencies,
  ConstantNodeDependencies: _dependenciesConstantNode.ConstantNodeDependencies,
  FunctionAssignmentNodeDependencies: _dependenciesFunctionAssignmentNode.FunctionAssignmentNodeDependencies,
  FunctionNodeDependencies: _dependenciesFunctionNode.FunctionNodeDependencies,
  IndexNodeDependencies: _dependenciesIndexNode.IndexNodeDependencies,
  ObjectNodeDependencies: _dependenciesObjectNode.ObjectNodeDependencies,
  OperatorNodeDependencies: _dependenciesOperatorNode.OperatorNodeDependencies,
  ParenthesisNodeDependencies: _dependenciesParenthesisNode.ParenthesisNodeDependencies,
  RangeNodeDependencies: _dependenciesRangeNode.RangeNodeDependencies,
  RelationalNodeDependencies: _dependenciesRelationalNode.RelationalNodeDependencies,
  SymbolNodeDependencies: _dependenciesSymbolNode.SymbolNodeDependencies,
  numericDependencies: _dependenciesNumeric.numericDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createParse: _factoriesNumber.createParse
};
exports.parseDependencies = parseDependencies;