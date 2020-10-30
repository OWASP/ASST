"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.log1pDependencies = void 0;

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesLog = require("./dependenciesLog.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var log1pDependencies = {
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  logDependencies: _dependenciesLog.logDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createLog1p: _factoriesAny.createLog1p
};
exports.log1pDependencies = log1pDependencies;