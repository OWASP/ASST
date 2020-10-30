"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.crossDependencies = void 0;

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesSubtract = require("./dependenciesSubtract.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var crossDependencies = {
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  subtractDependencies: _dependenciesSubtract.subtractDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createCross: _factoriesAny.createCross
};
exports.crossDependencies = crossDependencies;