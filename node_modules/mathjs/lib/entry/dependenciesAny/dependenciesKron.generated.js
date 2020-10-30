"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.kronDependencies = void 0;

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var kronDependencies = {
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createKron: _factoriesAny.createKron
};
exports.kronDependencies = kronDependencies;