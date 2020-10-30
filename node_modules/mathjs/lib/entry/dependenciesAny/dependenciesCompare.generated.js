"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compareDependencies = void 0;

var _dependenciesBigNumberClass = require("./dependenciesBigNumberClass.generated");

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesFractionClass = require("./dependenciesFractionClass.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var compareDependencies = {
  BigNumberDependencies: _dependenciesBigNumberClass.BigNumberDependencies,
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  FractionDependencies: _dependenciesFractionClass.FractionDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createCompare: _factoriesAny.createCompare
};
exports.compareDependencies = compareDependencies;