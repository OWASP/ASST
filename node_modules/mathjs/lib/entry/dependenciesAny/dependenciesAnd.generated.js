"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.andDependencies = void 0;

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesNot = require("./dependenciesNot.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesZeros = require("./dependenciesZeros.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var andDependencies = {
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  notDependencies: _dependenciesNot.notDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  zerosDependencies: _dependenciesZeros.zerosDependencies,
  createAnd: _factoriesAny.createAnd
};
exports.andDependencies = andDependencies;