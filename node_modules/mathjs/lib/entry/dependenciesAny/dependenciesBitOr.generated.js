"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bitOrDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var bitOrDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createBitOr: _factoriesAny.createBitOr
};
exports.bitOrDependencies = bitOrDependencies;