"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.invDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesDet = require("./dependenciesDet.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesIdentity = require("./dependenciesIdentity.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesUnaryMinus = require("./dependenciesUnaryMinus.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var invDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  detDependencies: _dependenciesDet.detDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  identityDependencies: _dependenciesIdentity.identityDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  unaryMinusDependencies: _dependenciesUnaryMinus.unaryMinusDependencies,
  createInv: _factoriesAny.createInv
};
exports.invDependencies = invDependencies;