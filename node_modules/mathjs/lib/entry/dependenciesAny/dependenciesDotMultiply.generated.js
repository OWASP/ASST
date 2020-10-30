"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dotMultiplyDependencies = void 0;

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var dotMultiplyDependencies = {
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createDotMultiply: _factoriesAny.createDotMultiply
};
exports.dotMultiplyDependencies = dotMultiplyDependencies;