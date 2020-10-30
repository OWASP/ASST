"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.logDependencies = void 0;

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesDivideScalar = require("./dependenciesDivideScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var logDependencies = {
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  divideScalarDependencies: _dependenciesDivideScalar.divideScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createLog: _factoriesAny.createLog
};
exports.logDependencies = logDependencies;