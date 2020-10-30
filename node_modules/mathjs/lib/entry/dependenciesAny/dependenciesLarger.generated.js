"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.largerDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var largerDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createLarger: _factoriesAny.createLarger
};
exports.largerDependencies = largerDependencies;