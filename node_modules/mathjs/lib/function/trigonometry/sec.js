"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSec = void 0;

var _factory = require("../../utils/factory");

var _collection = require("../../utils/collection");

var _number = require("../../plain/number");

var name = 'sec';
var dependencies = ['typed', 'BigNumber'];
var createSec = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      _BigNumber = _ref.BigNumber;

  /**
   * Calculate the secant of a value, defined as `sec(x) = 1/cos(x)`.
   *
   * For matrices, the function is evaluated element wise.
   *
   * Syntax:
   *
   *    math.sec(x)
   *
   * Examples:
   *
   *    math.sec(2)      // returns number -2.4029979617223822
   *    1 / math.cos(2)  // returns number -2.4029979617223822
   *
   * See also:
   *
   *    cos, csc, cot
   *
   * @param {number | Complex | Unit | Array | Matrix} x  Function input
   * @return {number | Complex | Array | Matrix} Secant of x
   */
  var sec = typed(name, {
    number: _number.secNumber,
    Complex: function Complex(x) {
      return x.sec();
    },
    BigNumber: function BigNumber(x) {
      return new _BigNumber(1).div(x.cos());
    },
    Unit: function Unit(x) {
      if (!x.hasBase(x.constructor.BASE_UNITS.ANGLE)) {
        throw new TypeError('Unit in function sec is no angle');
      }

      return sec(x.value);
    },
    'Array | Matrix': function ArrayMatrix(x) {
      return (0, _collection.deepMap)(x, sec);
    }
  });
  return sec;
});
exports.createSec = createSec;