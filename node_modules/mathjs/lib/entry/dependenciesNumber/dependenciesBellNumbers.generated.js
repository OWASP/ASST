"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bellNumbersDependencies = void 0;

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesIsInteger = require("./dependenciesIsInteger.generated");

var _dependenciesIsNegative = require("./dependenciesIsNegative.generated");

var _dependenciesStirlingS = require("./dependenciesStirlingS2.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var bellNumbersDependencies = {
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  isIntegerDependencies: _dependenciesIsInteger.isIntegerDependencies,
  isNegativeDependencies: _dependenciesIsNegative.isNegativeDependencies,
  stirlingS2Dependencies: _dependenciesStirlingS.stirlingS2Dependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createBellNumbers: _factoriesNumber.createBellNumbers
};
exports.bellNumbersDependencies = bellNumbersDependencies;