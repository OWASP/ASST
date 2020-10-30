"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dotDependencies = void 0;

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var dotDependencies = {
  addDependencies: _dependenciesAdd.addDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createDot: _factoriesAny.createDot
};
exports.dotDependencies = dotDependencies;