"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rangeDependencies = void 0;

var _dependenciesBignumber = require("./dependenciesBignumber.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesLarger = require("./dependenciesLarger.generated");

var _dependenciesLargerEq = require("./dependenciesLargerEq.generated");

var _dependenciesSmaller = require("./dependenciesSmaller.generated");

var _dependenciesSmallerEq = require("./dependenciesSmallerEq.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var rangeDependencies = {
  bignumberDependencies: _dependenciesBignumber.bignumberDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  largerDependencies: _dependenciesLarger.largerDependencies,
  largerEqDependencies: _dependenciesLargerEq.largerEqDependencies,
  smallerDependencies: _dependenciesSmaller.smallerDependencies,
  smallerEqDependencies: _dependenciesSmallerEq.smallerEqDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createRange: _factoriesAny.createRange
};
exports.rangeDependencies = rangeDependencies;