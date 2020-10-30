"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stdTransformDependencies = void 0;

var _dependenciesSqrt = require("./dependenciesSqrt.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesVariance = require("./dependenciesVariance.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var stdTransformDependencies = {
  sqrtDependencies: _dependenciesSqrt.sqrtDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  varianceDependencies: _dependenciesVariance.varianceDependencies,
  createStdTransform: _factoriesNumber.createStdTransform
};
exports.stdTransformDependencies = stdTransformDependencies;