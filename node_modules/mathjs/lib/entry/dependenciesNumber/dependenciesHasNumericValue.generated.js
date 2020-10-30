"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasNumericValueDependencies = void 0;

var _dependenciesIsNumeric = require("./dependenciesIsNumeric.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var hasNumericValueDependencies = {
  isNumericDependencies: _dependenciesIsNumeric.isNumericDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createHasNumericValue: _factoriesNumber.createHasNumericValue
};
exports.hasNumericValueDependencies = hasNumericValueDependencies;