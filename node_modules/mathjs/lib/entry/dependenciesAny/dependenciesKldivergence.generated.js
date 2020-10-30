"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.kldivergenceDependencies = void 0;

var _dependenciesDivide = require("./dependenciesDivide.generated");

var _dependenciesDotDivide = require("./dependenciesDotDivide.generated");

var _dependenciesIsNumeric = require("./dependenciesIsNumeric.generated");

var _dependenciesLog = require("./dependenciesLog.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesSum = require("./dependenciesSum.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var kldivergenceDependencies = {
  divideDependencies: _dependenciesDivide.divideDependencies,
  dotDivideDependencies: _dependenciesDotDivide.dotDivideDependencies,
  isNumericDependencies: _dependenciesIsNumeric.isNumericDependencies,
  logDependencies: _dependenciesLog.logDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  sumDependencies: _dependenciesSum.sumDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createKldivergence: _factoriesAny.createKldivergence
};
exports.kldivergenceDependencies = kldivergenceDependencies;