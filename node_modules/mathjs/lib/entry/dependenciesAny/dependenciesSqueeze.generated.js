"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.squeezeDependencies = void 0;

var _dependenciesMatrix = require("./dependenciesMatrix.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var squeezeDependencies = {
  matrixDependencies: _dependenciesMatrix.matrixDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSqueeze: _factoriesAny.createSqueeze
};
exports.squeezeDependencies = squeezeDependencies;