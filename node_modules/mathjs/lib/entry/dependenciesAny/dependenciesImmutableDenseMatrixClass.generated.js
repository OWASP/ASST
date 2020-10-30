"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ImmutableDenseMatrixDependencies = void 0;

var _dependenciesDenseMatrixClass = require("./dependenciesDenseMatrixClass.generated");

var _dependenciesSmaller = require("./dependenciesSmaller.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var ImmutableDenseMatrixDependencies = {
  DenseMatrixDependencies: _dependenciesDenseMatrixClass.DenseMatrixDependencies,
  smallerDependencies: _dependenciesSmaller.smallerDependencies,
  createImmutableDenseMatrixClass: _factoriesAny.createImmutableDenseMatrixClass
};
exports.ImmutableDenseMatrixDependencies = ImmutableDenseMatrixDependencies;