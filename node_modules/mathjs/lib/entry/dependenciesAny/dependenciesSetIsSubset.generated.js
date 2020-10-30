"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setIsSubsetDependencies = void 0;

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
var setIsSubsetDependencies = {
  IndexDependencies: _dependenciesIndexClass.IndexDependencies,
  compareNaturalDependencies: _dependenciesCompareNatural.compareNaturalDependencies,
  sizeDependencies: _dependenciesSize.sizeDependencies,
  subsetDependencies: _dependenciesSubset.subsetDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSetIsSubset: _factoriesAny.createSetIsSubset
};
exports.setIsSubsetDependencies = setIsSubsetDependencies;