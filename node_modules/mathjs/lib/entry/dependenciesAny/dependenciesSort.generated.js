"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sortDependencies = void 0;

var _dependenciesCompare = require("./dependenciesCompare.generated");

var _dependenciesCompareNatural = require("./dependenciesCompareNatural.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var sortDependencies = {
  compareDependencies: _dependenciesCompare.compareDependencies,
  compareNaturalDependencies: _dependenciesCompareNatural.compareNaturalDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSort: _factoriesAny.createSort
};
exports.sortDependencies = sortDependencies;