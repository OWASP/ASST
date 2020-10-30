"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.equalDependencies = void 0;

var _dependenciesEqualScalar = require("./dependenciesEqualScalar.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var equalDependencies = {
  equalScalarDependencies: _dependenciesEqualScalar.equalScalarDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createEqual: _factoriesNumber.createEqual
};
exports.equalDependencies = equalDependencies;