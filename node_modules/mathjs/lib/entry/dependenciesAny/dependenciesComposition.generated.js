"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compositionDependencies = void 0;

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesCombinations = require("./dependenciesCombinations.generated");

var _dependenciesIsInteger = require("./dependenciesIsInteger.generated");

var _dependenciesIsNegative = require("./dependenciesIsNegative.generated");

var _dependenciesIsPositive = require("./dependenciesIsPositive.generated");

var _dependenciesLarger = require("./dependenciesLarger.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var compositionDependencies = {
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  combinationsDependencies: _dependenciesCombinations.combinationsDependencies,
  isIntegerDependencies: _dependenciesIsInteger.isIntegerDependencies,
  isNegativeDependencies: _dependenciesIsNegative.isNegativeDependencies,
  isPositiveDependencies: _dependenciesIsPositive.isPositiveDependencies,
  largerDependencies: _dependenciesLarger.largerDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createComposition: _factoriesAny.createComposition
};
exports.compositionDependencies = compositionDependencies;