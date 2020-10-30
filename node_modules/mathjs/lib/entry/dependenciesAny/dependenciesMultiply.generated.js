"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.multiplyDependencies = void 0;

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var multiplyDependencies = {
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createMultiply: _factoriesAny.createMultiply
};
exports.multiplyDependencies = multiplyDependencies;