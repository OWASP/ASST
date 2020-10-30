"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.identityDependencies = void 0;

var _dependenciesBigNumberClass = require("./dependenciesBigNumberClass.generated");

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesSparseMatrixClass = require("./dependenciesSparseMatrixClass.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var identityDependencies = {
  BigNumberDependencies: _dependenciesBigNumberClass.BigNumberDependencies,
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  SparseMatrixDependencies: _dependenciesSparseMatrixClass.SparseMatrixDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createIdentity: _factoriesAny.createIdentity
};
exports.identityDependencies = identityDependencies;