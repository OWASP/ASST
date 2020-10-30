"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deepEqualDependencies = void 0;

var _dependenciesEqual = require("./dependenciesEqual.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesNumber = require("../../factoriesNumber.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var deepEqualDependencies = {
  equalDependencies: _dependenciesEqual.equalDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createDeepEqual: _factoriesNumber.createDeepEqual
};
exports.deepEqualDependencies = deepEqualDependencies;