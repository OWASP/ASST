"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.lupDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesSpaClass = require("./dependenciesSpaClass.generated");

var _dependenciesSparseMatrixClass = require("./dependenciesSparseMatrixClass.generated");

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesLarger = require("./dependenciesLarger.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesUnaryMinus = require("./dependenciesUnaryMinus.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var lupDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  SpaDependencies: _dependenciesSpaClass.SpaDependencies,
  SparseMatrixDependencies: _dependenciesSparseMatrixClass.SparseMatrixDependencies,
  absDependencies: _dependenciesAbs.absDependencies,
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  largerDependencies: _dependenciesLarger.largerDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  unaryMinusDependencies: _dependenciesUnaryMinus.unaryMinusDependencies,
  createLup: _factoriesAny.createLup
};
exports.lupDependencies = lupDependencies;