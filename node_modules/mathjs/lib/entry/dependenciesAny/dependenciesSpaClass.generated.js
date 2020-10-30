"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SpaDependencies = void 0;

var _dependenciesFibonacciHeapClass = require("./dependenciesFibonacciHeapClass.generated");

var _dependenciesAddScalar = require("./dependenciesAddScalar.generated");

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var SpaDependencies = {
  FibonacciHeapDependencies: _dependenciesFibonacciHeapClass.FibonacciHeapDependencies,
  addScalarDependencies: _dependenciesAddScalar.addScalarDependencies,
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  createSpaClass: _factoriesAny.createSpaClass
};
exports.SpaDependencies = SpaDependencies;