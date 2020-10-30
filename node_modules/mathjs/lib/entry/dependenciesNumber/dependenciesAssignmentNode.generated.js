"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AssignmentNodeDependencies = void 0;

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesNode = require("./dependenciesNode.generated");

var _dependenciesSubsetTransform = require("./dependenciesSubsetTransform.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var AssignmentNodeDependencies = {
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  NodeDependencies: _dependenciesNode.NodeDependencies,
  subsetTransformDependencies: _dependenciesSubsetTransform.subsetTransformDependencies,
  createAssignmentNode: _factoriesNumber.createAssignmentNode
};
exports.AssignmentNodeDependencies = AssignmentNodeDependencies;