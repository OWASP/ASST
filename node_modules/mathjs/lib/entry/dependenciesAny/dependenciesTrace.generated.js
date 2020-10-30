"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.traceDependencies = void 0;

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var traceDependencies = {
  addDependencies: _dependenciesAdd.addDependencies,
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createTrace: _factoriesAny.createTrace
};
exports.traceDependencies = traceDependencies;