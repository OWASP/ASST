"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sumTransformDependencies = void 0;

var _dependenciesBignumber = require("./dependenciesBignumber.generated");

var _dependenciesFraction = require("./dependenciesFraction.generated");

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var sumTransformDependencies = {
  bignumberDependencies: _dependenciesBignumber.bignumberDependencies,
  fractionDependencies: _dependenciesFraction.fractionDependencies,
  addDependencies: _dependenciesAdd.addDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSumTransform: _factoriesAny.createSumTransform
};
exports.sumTransformDependencies = sumTransformDependencies;