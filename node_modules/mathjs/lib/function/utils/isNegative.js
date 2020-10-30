"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createIsNegative = void 0;

var _collection = require("../../utils/collection");

var _factory = require("../../utils/factory");

var _number = require("../../plain/number");

var name = 'isNegative';
var dependencies = ['typed'];
var createIsNegative = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed;

  /**
   * Test whether a value is negative: smaller than zero.
   * The function supports types `number`, `BigNumber`, `Fraction`, and `Unit`.
   *
   * The function is evaluated element-wise in case of Array or Matrix input.
   *
   * Syntax:
   *
   *     math.isNegative(x)
   *
   * Examples:
   *
   *    math.isNegative(3)                     // returns false
   *    math.isNegative(-2)                    // returns true
   *    math.isNegative(0)                     // returns false
   *    math.isNegative(-0)                    // returns false
   *    math.isNegative(math.bignumber(2))     // returns false
   *    math.isNegative(math.fraction(-2, 5))  // returns true
   *    math.isNegative('-2')                  // returns true
   *    math.isNegative([2, 0, -3]')           // returns [false, false, true]
   *
   * See also:
   *
   *    isNumeric, isPositive, isZero, isInteger
   *
   * @param {number | BigNumber | Fraction | Unit | Array | Matrix} x  Value to be tested
   * @return {boolean}  Returns true when `x` is larger than zero.
   *                    Throws an error in case of an unknown data type.
   */
  var isNegative = typed(name, {
    number: _number.isNegativeNumber,
    BigNumber: function BigNumber(x) {
      return x.isNeg() && !x.isZero() && !x.isNaN();
    },
    Fraction: function Fraction(x) {
      return x.s < 0; // It's enough to decide on the sign
    },
    Unit: function Unit(x) {
      return isNegative(x.value);
    },
    'Array | Matrix': function ArrayMatrix(x) {
      return (0, _collection.deepMap)(x, isNegative);
    }
  });
  return isNegative;
});
exports.createIsNegative = createIsNegative;