"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.expmDependencies = void 0;

var _dependenciesAbs = require("./dependenciesAbs.generated");

var _dependenciesAdd = require("./dependenciesAdd.generated");

var _dependenciesIdentity = require("./dependenciesIdentity.generated");

var _dependenciesInv = require("./dependenciesInv.generated");

var _dependenciesMultiply = require("./dependenciesMultiply.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var expmDependencies = {
  absDependencies: _dependenciesAbs.absDependencies,
  addDependencies: _dependenciesAdd.addDependencies,
  identityDependencies: _dependenciesIdentity.identityDependencies,
  invDependencies: _dependenciesInv.invDependencies,
  multiplyDependencies: _dependenciesMultiply.multiplyDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createExpm: _factoriesAny.createExpm
};
exports.expmDependencies = expmDependencies;