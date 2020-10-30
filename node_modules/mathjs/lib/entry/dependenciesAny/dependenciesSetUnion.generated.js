"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setUnionDependencies = void 0;

var _dependenciesIndexClass = require("./dependenciesIndexClass.generated");

var _dependenciesConcat = require("./dependenciesConcat.generated");

var _dependenciesSetIntersect = require("./dependenciesSetIntersect.generated");

var _dependenciesSetSymDifference = require("./dependenciesSetSymDifference.generated");

var _dependenciesSize = require("./dependenciesSize.generated");

var _dependenciesSubset = require("./dependenciesSubset.generated");

var _dependenciesTyped = require("./dependenciesTyped.generated");

var _factoriesAny = require("../../factoriesAny.js");

/**
 * THIS FILE IS AUTO-GENERATED
 * DON'T MAKE CHANGES HERE
 */
var setUnionDependencies = {
  IndexDependencies: _dependenciesIndexClass.IndexDependencies,
  concatDependencies: _dependenciesConcat.concatDependencies,
  setIntersectDependencies: _dependenciesSetIntersect.setIntersectDependencies,
  setSymDifferenceDependencies: _dependenciesSetSymDifference.setSymDifferenceDependencies,
  sizeDependencies: _dependenciesSize.sizeDependencies,
  subsetDependencies: _dependenciesSubset.subsetDependencies,
  typedDependencies: _dependenciesTyped.typedDependencies,
  createSetUnion: _factoriesAny.createSetUnion
};
exports.setUnionDependencies = setUnionDependencies;