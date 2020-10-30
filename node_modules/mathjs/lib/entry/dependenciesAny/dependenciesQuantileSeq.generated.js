"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.quantileSeqDependencies = void 0;

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesCompare = require("./dependenciesCompare.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesPartitionSelect = require("./dependenciesPartitionSelect.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var quantileSeqDependencies = {
  addDependencies: _dependenciesAdd.addDependencies,
  compareDependencies: _dependenciesCompare.compareDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  partitionSelectDependencies: _dependenciesPartitionSelect.partitionSelectDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createQuantileSeq: _factoriesAny.createQuantileSeq
};
exports.quantileSeqDependencies = quantileSeqDependencies;