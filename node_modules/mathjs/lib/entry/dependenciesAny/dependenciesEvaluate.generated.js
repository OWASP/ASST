"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evaluateDependencies = void 0;

var _dependenciesParse = require("./dependenciesParse.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var evaluateDependencies = {
  parseDependencies: _dependenciesParse.parseDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createEvaluate: _factoriesAny.createEvaluate
};
exports.evaluateDependencies = evaluateDependencies;