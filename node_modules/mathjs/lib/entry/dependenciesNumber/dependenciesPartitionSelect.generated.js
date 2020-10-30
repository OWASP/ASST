"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.partitionSelectDependencies = void 0;

var _dependenciesCompare = require("./dependenciesCompare.generated");

var _dependenciesIsNaN = require("./dependenciesIsNaN.generated");

var _dependenciesIsNumeric = require("./dependenciesIsNumeric.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var partitionSelectDependencies = {
  compareDependencies: _dependenciesCompare.compareDependencies,
  isNaNDependencies: _dependenciesIsNaN.isNaNDependencies,
  isNumericDependencies: _dependenciesIsNumeric.isNumericDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createPartitionSelect: _factoriesNumber.createPartitionSelect
};
exports.partitionSelectDependencies = partitionSelectDependencies;