"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AssignmentNodeDependencies = void 0;

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesNode = require("./dependenciesNode.generated");

var _dependenciesSubset = require("./dependenciesSubset.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var AssignmentNodeDependencies = {
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  NodeDependencies: _dependenciesNode.NodeDependencies,
  subsetDependencies: _dependenciesSubset.subsetDependencies,
  createAssignmentNode: _factoriesAny.createAssignmentNode
};
exports.AssignmentNodeDependencies = AssignmentNodeDependencies;