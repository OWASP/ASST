"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.matrixDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesMatrixClass = require("./dependenciesMatrixClass.generated");

var _dependenciesSparseMatrixClass = require("./dependenciesSparseMatrixClass.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var matrixDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  MatrixDependencies: _dependenciesMatrixClass.MatrixDependencies,
  SparseMatrixDependencies: _dependenciesSparseMatrixClass.SparseMatrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createMatrix: _factoriesAny.createMatrix
};
exports.matrixDependencies = matrixDependencies;