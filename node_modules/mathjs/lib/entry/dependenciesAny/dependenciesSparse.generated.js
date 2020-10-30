"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sparseDependencies = void 0;

var _dependenciesSparseMatrixClass = require("./dependenciesSparseMatrixClass.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var sparseDependencies = {
  SparseMatrixDependencies: _dependenciesSparseMatrixClass.SparseMatrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSparse: _factoriesAny.createSparse
};
exports.sparseDependencies = sparseDependencies;