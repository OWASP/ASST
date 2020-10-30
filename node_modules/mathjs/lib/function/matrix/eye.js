"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEye = void 0;

var _factory = require("../../utils/factory");

// TODO: function eye is removed since v5.0.0 (June 2018). Remove it some day.
var createEye = /* #__PURE__ */(0, _factory.factory)('eye', [], function () {
  return function eye() {
    throw new Error('Function "eye" is renamed to "identity" since mathjs version 5.0.0. ' + 'To keep eye working, create an alias for it using "math.import({eye: math.identity}, {override: true})"');
  };
});
exports.createEye = createEye;