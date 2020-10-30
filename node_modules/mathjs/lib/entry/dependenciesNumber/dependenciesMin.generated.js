"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.minDependencies = void 0;

var _dependenciesSmaller = require("./dependenciesSmaller.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var minDependencies = {
  smallerDependencies: _dependenciesSmaller.smallerDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createMin: _factoriesNumber.createMin
};
exports.minDependencies = minDependencies;