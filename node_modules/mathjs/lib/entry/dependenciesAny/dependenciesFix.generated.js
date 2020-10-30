"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fixDependencies = void 0;

var _dependenciesComplexClass = require("./dependenciesComplexClass.generated");

var _dependenciesCeil = require("./dependenciesCeil.generated");

var _dependenciesFloor = require("./dependenciesFloor.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var fixDependencies = {
  ComplexDependencies: _dependenciesComplexClass.ComplexDependencies,
  ceilDependencies: _dependenciesCeil.ceilDependencies,
  floorDependencies: _dependenciesFloor.floorDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createFix: _factoriesAny.createFix
};
exports.fixDependencies = fixDependencies;