"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.madDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesMap = require("./dependenciesMap.generated");

var _dependenciesMedian = require("./dependenciesMedian.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var madDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  mapDependencies: _dependenciesMap.mapDependencies,
  medianDependencies: _dependenciesMedian.medianDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createMad: _factoriesNumber.createMad
};
exports.madDependencies = madDependencies;