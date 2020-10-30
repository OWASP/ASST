"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.gammaDependencies = void 0;

var _dependenciesBigNumberClass = require("./dependenciesBigNumberClass.generated");

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesPow = require("./dependenciesPow.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var gammaDependencies = {
  BigNumberDependencies: _dependenciesBigNumberClass.BigNumberDependencies,
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  powDependencies: _dependenciesPow.powDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createGamma: _factoriesAny.createGamma
};
exports.gammaDependencies = gammaDependencies;