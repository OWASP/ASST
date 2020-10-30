"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.maxDependencies = void 0;

var _dependenciesLarger = require("./dependenciesLarger.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var maxDependencies = {
  largerDependencies: _dependenciesLarger.largerDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createMax: _factoriesNumber.createMax
};
exports.maxDependencies = maxDependencies;