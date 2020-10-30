"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.typedDependencies = void 0;

var _dependenciesBigNumberClass = require("./dependenciesBigNumberClass.generated");

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesFractionClass = require("./dependenciesFractionClass.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var typedDependencies = {
  BigNumberDependencies: _dependenciesBigNumberClass.BigNumberDependencies,
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  FractionDependencies: _dependenciesFractionClass.FractionDependencies,
  createTyped: _factoriesAny.createTyped
};
exports.typedDependencies = typedDependencies;