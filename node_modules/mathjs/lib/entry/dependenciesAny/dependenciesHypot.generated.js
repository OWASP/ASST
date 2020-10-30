"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hypotDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesIsPositive = require("./dependenciesIsPositive.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesSmaller = require("./dependenciesSmaller.generated");

var _dependenciesSqrt = require("./dependenciesSqrt.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var hypotDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  isPositiveDependencies: _dependenciesIsPositive.isPositiveDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  smallerDependencies: _dependenciesSmaller.smallerDependencies,
  sqrtDependencies: _dependenciesSqrt.sqrtDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createHypot: _factoriesAny.createHypot
};
exports.hypotDependencies = hypotDependencies;