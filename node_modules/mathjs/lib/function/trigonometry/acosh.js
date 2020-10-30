"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAcosh = void 0;

var _factory = require("../../utils/factory");

var _collection = require("../../utils/collection");

var _number = require("../../plain/number");

var name = 'acosh';
var dependencies = ['typed', 'config', 'Complex'];
var createAcosh = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      config = _ref.config,
      Complex = _ref.Complex;

  /**
   * Calculate the hyperbolic arccos of a value,
   * defined as `acosh(x) = ln(sqrt(x^2 - 1) + x)`.
   *
   * For matrices, the function is evaluated element wise.
   *
   * Syntax:
   *
   *    math.acosh(x)
   *
   * Examples:
   *
   *    math.acosh(1.5)       // returns 0.9624236501192069
   *
   * See also:
   *
   *    cosh, asinh, atanh
   *
   * @param {number | Complex | Unit | Array | Matrix} x  Function input
   * @return {number | Complex | Array | Matrix} Hyperbolic arccosine of x
   */
  var acosh = typed(name, {
    number: function number(x) {
      if (x >= 1 || config.predictable) {
        return (0, _number.acoshNumber)(x);
      }

      if (x <= -1) {
        return new Complex(Math.log(Math.sqrt(x * x - 1) - x), Math.PI);
      }

      return new Complex(x, 0).acosh();
    },
    Complex: function Complex(x) {
      return x.acosh();
    },
    BigNumber: function BigNumber(x) {
      return x.acosh();
    },
    'Array | Matrix': function ArrayMatrix(x) {
      return (0, _collection.deepMap)(x, acosh);
    }
  });
  return acosh;
});
exports.createAcosh = createAcosh;