"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.numericDependencies = void 0;

var _dependenciesBignumber = require("./dependenciesBignumber.generated");

var _dependenciesFraction = require("./dependenciesFraction.generated");

var _dependenciesNumber = require("./dependenciesNumber.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var numericDependencies = {
  bignumberDependencies: _dependenciesBignumber.bignumberDependencies,
  fractionDependencies: _dependenciesFraction.fractionDependencies,
  numberDependencies: _dependenciesNumber.numberDependencies,
  createNumeric: _factoriesAny.createNumeric
};
exports.numericDependencies = numericDependencies;