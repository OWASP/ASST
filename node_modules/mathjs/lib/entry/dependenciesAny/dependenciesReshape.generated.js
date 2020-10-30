"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reshapeDependencies = void 0;

var _dependenciesIsInteger = require("./dependenciesIsInteger.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var reshapeDependencies = {
  isIntegerDependencies: _dependenciesIsInteger.isIntegerDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createReshape: _factoriesAny.createReshape
};
exports.reshapeDependencies = reshapeDependencies;