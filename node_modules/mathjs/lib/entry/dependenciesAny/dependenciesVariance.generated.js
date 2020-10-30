"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.varianceDependencies = void 0;

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesApply = require("./dependenciesApply.generated");

var _dependenciesDivide = require("./dependenciesDivide.generated");

var _dependenciesIsNaN = require("./dependenciesIsNaN.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var varianceDependencies = {
  addDependencies: _dependenciesAdd.addDependencies,
  applyDependencies: _dependenciesApply.applyDependencies,
  divideDependencies: _dependenciesDivide.divideDependencies,
  isNaNDependencies: _dependenciesIsNaN.isNaNDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createVariance: _factoriesAny.createVariance
};
exports.varianceDependencies = varianceDependencies;