"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.medianDependencies = void 0;

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesCompare = require("./dependenciesCompare.generated");

var _dependenciesDivide = require("./dependenciesDivide.generated");

var _dependenciesPartitionSelect = require("./dependenciesPartitionSelect.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var medianDependencies = {
  addDependencies: _dependenciesAdd.addDependencies,
  compareDependencies: _dependenciesCompare.compareDependencies,
  divideDependencies: _dependenciesDivide.divideDependencies,
  partitionSelectDependencies: _dependenciesPartitionSelect.partitionSelectDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createMedian: _factoriesAny.createMedian
};
exports.medianDependencies = medianDependencies;