"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createDeprecatedEval = void 0;

var _factory = require("../../utils/factory");

var _log = require("../../utils/log");

// For backward compatibility, deprecated since version 6.0.0. Date: 2018-12-05
var createDeprecatedEval = /* #__PURE__ */(0, _factory.factory)('eval', ['evaluate'], function (_ref) {
  var evaluate = _ref.evaluate;
  return function () {
    (0, _log.warnOnce)('Function "eval" has been renamed to "evaluate" in v6.0.0, please use the new function instead.');

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return evaluate.apply(evaluate, args);
  };
});
exports.createDeprecatedEval = createDeprecatedEval;