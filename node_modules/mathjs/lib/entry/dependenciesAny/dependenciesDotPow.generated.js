"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dotPowDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesPow = require("./dependenciesPow.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var dotPowDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  powDependencies: _dependenciesPow.powDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createDotPow: _factoriesAny.createDotPow
};
exports.dotPowDependencies = dotPowDependencies;