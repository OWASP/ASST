"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.catalanDependencies = void 0;

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesCombinations = require("./dependenciesCombinations.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesIsInteger = require("./dependenciesIsInteger.generated");

var _dependenciesIsNegative = require("./dependenciesIsNegative.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var catalanDependencies = {
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  combinationsDependencies: _dependenciesCombinations.combinationsDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  isIntegerDependencies: _dependenciesIsInteger.isIntegerDependencies,
  isNegativeDependencies: _dependenciesIsNegative.isNegativeDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createCatalan: _factoriesNumber.createCatalan
};
exports.catalanDependencies = catalanDependencies;