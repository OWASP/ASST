"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.intersectDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesMultiplyScalar = require("./dependenciesMultiplyScalar.generated");

var _dependenciesSmaller = require("./dependenciesSmaller.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var intersectDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  addDependencies: _dependenciesAdd.addDependencies,
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  multiplyScalarDependencies: _dependenciesMultiplyScalar.multiplyScalarDependencies,
  smallerDependencies: _dependenciesSmaller.smallerDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createIntersect: _factoriesAny.createIntersect
};
exports.intersectDependencies = intersectDependencies;