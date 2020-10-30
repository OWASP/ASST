"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.roundDependencies = void 0;

var _dependenciesBigNumberClass = require("./dependenciesBigNumberClass.generated");

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesZeros = require("./dependenciesZeros.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var roundDependencies = {
  BigNumberDependencies: _dependenciesBigNumberClass.BigNumberDependencies,
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  zerosDependencies: _dependenciesZeros.zerosDependencies,
  createRound: _factoriesAny.createRound
};
exports.roundDependencies = roundDependencies;