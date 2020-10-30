"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.factorialDependencies = void 0;

var _dependenciesGamma = require("./dependenciesGamma.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var factorialDependencies = {
  gammaDependencies: _dependenciesGamma.gammaDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createFactorial: _factoriesNumber.createFactorial
};
exports.factorialDependencies = factorialDependencies;