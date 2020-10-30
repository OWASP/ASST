"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.divideDependencies = void 0;

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesInv = require("./dependenciesInv.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var divideDependencies = {
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  invDependencies: _dependenciesInv.invDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createDivide: _factoriesAny.createDivide
};
exports.divideDependencies = divideDependencies;