"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.concatTransformDependencies = void 0;

var _dependenciesIsInteger = require("./dependenciesIsInteger.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var concatTransformDependencies = {
  isIntegerDependencies: _dependenciesIsInteger.isIntegerDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createConcatTransform: _factoriesAny.createConcatTransform
};
exports.concatTransformDependencies = concatTransformDependencies;