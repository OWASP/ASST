"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.acscDependencies = void 0;

var _dependenciesBigNumberClass = require("./dependenciesBigNumberClass.generated");

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var acscDependencies = {
  BigNumberDependencies: _dependenciesBigNumberClass.BigNumberDependencies,
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createAcsc: _factoriesAny.createAcsc
};
exports.acscDependencies = acscDependencies;