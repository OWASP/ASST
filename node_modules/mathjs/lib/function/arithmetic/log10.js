"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLog10 = void 0;

var _factory = require("../../utils/factory");

var _collection = require("../../utils/collection");

var _number = require("../../plain/number");

var name = 'log10';
var dependencies = ['typed', 'config', 'Complex'];
var createLog10 = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      config = _ref.config,
      _Complex = _ref.Complex;

  /**
   * Calculate the 10-base logarithm of a value. This is the same as calculating `log(x, 10)`.
   *
   * For matrices, the function is evaluated element wise.
   *
   * Syntax:
   *
   *    math.log10(x)
   *
   * Examples:
   *
   *    math.log10(0.00001)            // returns -5
   *    math.log10(10000)              // returns 4
   *    math.log(10000) / math.log(10) // returns 4
   *    math.pow(10, 4)                // returns 10000
   *
   * See also:
   *
   *    exp, log, log1p, log2
   *
   * @param {number | BigNumber | Complex | Array | Matrix} x
   *            Value for which to calculate the logarithm.
   * @return {number | BigNumber | Complex | Array | Matrix}
   *            Returns the 10-base logarithm of `x`
   */
  var log10 = typed(name, {
    number: function number(x) {
      if (x >= 0 || config.predictable) {
        return (0, _number.log10Number)(x);
      } else {
        // negative value -> complex value computation
        return new _Complex(x, 0).log().div(Math.LN10);
      }
    },
    Complex: function Complex(x) {
      return new _Complex(x).log().div(Math.LN10);
    },
    BigNumber: function BigNumber(x) {
      if (!x.isNegative() || config.predictable) {
        return x.log();
      } else {
        // downgrade to number, return Complex valued result
        return new _Complex(x.toNumber(), 0).log().div(Math.LN10);
      }
    },
    'Array | Matrix': function ArrayMatrix(x) {
      return (0, _collection.deepMap)(x, log10);
    }
  });
  return log10;
});
exports.createLog10 = createLog10;