"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.powDependencies = void 0;

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesFraction = require("./dependenciesFraction.generated");

var _dependenciesIdentity = require("./dependenciesIdentity.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesNumber = require("./dependenciesNumber.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var powDependencies = {
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  fractionDependencies: _dependenciesFraction.fractionDependencies,
  identityDependencies: _dependenciesIdentity.identityDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  numberDependencies: _dependenciesNumber.numberDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createPow: _factoriesAny.createPow
};
exports.powDependencies = powDependencies;