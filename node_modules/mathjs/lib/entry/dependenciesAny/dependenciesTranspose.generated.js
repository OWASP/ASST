"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transposeDependencies = void 0;

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var transposeDependencies = {
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createTranspose: _factoriesAny.createTranspose
};
exports.transposeDependencies = transposeDependencies;