"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ctransposeDependencies = void 0;

var _dependenciesConj = require("./dependenciesConj.generated");

var _dependenciesTranspose = require("./dependenciesTranspose.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var ctransposeDependencies = {
  conjDependencies: _dependenciesConj.conjDependencies,
  transposeDependencies: _dependenciesTranspose.transposeDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createCtranspose: _factoriesAny.createCtranspose
};
exports.ctransposeDependencies = ctransposeDependencies;