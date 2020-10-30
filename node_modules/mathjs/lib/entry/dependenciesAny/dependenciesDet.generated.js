"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.detDependencies = void 0;

var _dependenciesLup = require("./dependenciesLup.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _dependenciesUnaryMinus = require("./dependenciesUnaryMinus.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var detDependencies = {
  lupDependencies: _dependenciesLup.lupDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  unaryMinusDependencies: _dependenciesUnaryMinus.unaryMinusDependencies,
  createDet: _factoriesAny.createDet
};
exports.detDependencies = detDependencies;