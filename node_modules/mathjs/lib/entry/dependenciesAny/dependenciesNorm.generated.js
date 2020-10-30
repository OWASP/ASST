"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesConj = require("./dependenciesConj.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesLarger = require("./dependenciesLarger.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesPow = require("./dependenciesPow.generated");

var _dependenciesSmaller = require("./dependenciesSmaller.generated");

var _dependenciesSqrt = require("./dependenciesSqrt.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var normDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  addDependencies: _dependenciesAdd.addDependencies,
  conjDependencies: _dependenciesConj.conjDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  largerDependencies: _dependenciesLarger.largerDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  powDependencies: _dependenciesPow.powDependencies,
  smallerDependencies: _dependenciesSmaller.smallerDependencies,
  sqrtDependencies: _dependenciesSqrt.sqrtDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createNorm: _factoriesAny.createNorm
};
exports.normDependencies = normDependencies;