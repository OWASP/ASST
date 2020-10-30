"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.chainDependencies = void 0;

var _dependenciesChainClass = require("./dependenciesChainClass.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var chainDependencies = {
  ChainDependencies: _dependenciesChainClass.ChainDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createChain: _factoriesAny.createChain
};
exports.chainDependencies = chainDependencies;