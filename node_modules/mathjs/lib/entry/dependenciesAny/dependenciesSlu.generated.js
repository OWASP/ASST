"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sluDependencies = void 0;

var _dependenciesSparseMatrixClass = require("./dependenciesSparseMatrixClass.generated");

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesLarger = require("./dependenciesLarger.generated");

var _dependenciesLargerEq = require("./dependenciesLargerEq.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTranspose = require("./dependenciesTranspose.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var sluDependencies = {
  SparseMatrixDependencies: _dependenciesSparseMatrixClass.SparseMatrixDependencies,
  absDependencies: _dependenciesAbs.absDependencies,
  addDependencies: _dependenciesAdd.addDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  largerDependencies: _dependenciesLarger.largerDependencies,
  largerEqDependencies: _dependenciesLargerEq.largerEqDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  transposeDependencies: _dependenciesTranspose.transposeDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSlu: _factoriesAny.createSlu
};
exports.sluDependencies = sluDependencies;