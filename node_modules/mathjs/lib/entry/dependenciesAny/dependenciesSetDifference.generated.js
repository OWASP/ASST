"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setDifferenceDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesIndexClass = require("./dependenciesIndexClass.generated");

var _dependenciesCompareNatural = require("./dependenciesCompareNatural.generated");

var _dependenciesSize = require("./dependenciesSize.generated");

var _dependenciesSubset = require("./dependenciesSubset.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var setDifferenceDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  IndexDependencies: _dependenciesIndexClass.IndexDependencies,
  compareNaturalDependencies: _dependenciesCompareNatural.compareNaturalDependencies,
  sizeDependencies: _dependenciesSize.sizeDependencies,
  subsetDependencies: _dependenciesSubset.subsetDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSetDifference: _factoriesAny.createSetDifference
};
exports.setDifferenceDependencies = setDifferenceDependencies;