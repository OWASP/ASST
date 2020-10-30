"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createMaxTransform = void 0;

var _is = require("../../utils/is");

var _factory = require("../../utils/factory");

var _errorTransform = require("./utils/errorTransform");

var _max = require("../../function/statistics/max");

var name = 'max';
var dependencies = ['typed', 'larger'];
var createMaxTransform = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      larger = _ref.larger;
  var max = (0, _max.createMax)({
    typed: typed,
    larger: larger
  });
  /**
   * Attach a transform function to math.max
   * Adds a property transform containing the transform function.
   *
   * This transform changed the last `dim` parameter of function max
   * from one-based to zero based
   */

  return typed('max', {
    '...any': function any(args) {
      // change last argument dim from one-based to zero-based
      if (args.length === 2 && (0, _is.isCollection)(args[0])) {
        var dim = args[1];

        if ((0, _is.isNumber)(dim)) {
          args[1] = dim - 1;
        } else if ((0, _is.isBigNumber)(dim)) {
          args[1] = dim.minus(1);
        }
      }

      try {
        return max.apply(null, args);
      } catch (err) {
        throw (0, _errorTransform.errorTransform)(err);
      }
    }
  });
}, {
  isTransformFunction: true
});
exports.createMaxTransform = createMaxTransform;