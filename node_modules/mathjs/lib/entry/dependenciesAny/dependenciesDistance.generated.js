"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.distanceDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesSqrt = require("./dependenciesSqrt.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesUnaryMinus = require("./dependenciesUnaryMinus.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var distanceDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  sqrtDependencies: _dependenciesSqrt.sqrtDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  unaryMinusDependencies: _dependenciesUnaryMinus.unaryMinusDependencies,
  createDistance: _factoriesAny.createDistance
};
exports.distanceDependencies = distanceDependencies;