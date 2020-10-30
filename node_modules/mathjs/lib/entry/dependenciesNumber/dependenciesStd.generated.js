"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stdDependencies = void 0;

var _dependenciesSqrt = require("./dependenciesSqrt.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesVariance = require("./dependenciesVariance.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var stdDependencies = {
  sqrtDependencies: _dependenciesSqrt.sqrtDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  varianceDependencies: _dependenciesVariance.varianceDependencies,
  createStd: _factoriesNumber.createStd
};
exports.stdDependencies = stdDependencies;