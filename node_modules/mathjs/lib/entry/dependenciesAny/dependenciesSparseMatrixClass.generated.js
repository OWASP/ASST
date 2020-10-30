"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SparseMatrixDependencies = void 0;

var _dependenciesMatrixClass = require("./dependenciesMatrixClass.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var SparseMatrixDependencies = {
  MatrixDependencies: _dependenciesMatrixClass.MatrixDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSparseMatrixClass: _factoriesAny.createSparseMatrixClass
};
exports.SparseMatrixDependencies = SparseMatrixDependencies;