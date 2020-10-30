"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createAcsch = void 0;

var _factory = require("../../utils/factory");

var _collection = require("../../utils/collection");

var _number = require("../../plain/number");

var name = 'acsch';
var dependencies = ['typed', 'BigNumber'];
var createAcsch = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      _BigNumber = _ref.BigNumber;

  /**
   * Calculate the hyperbolic arccosecant of a value,
   * defined as `acsch(x) = asinh(1/x) = ln(1/x + sqrt(1/x^2 + 1))`.
   *
   * For matrices, the function is evaluated element wise.
   *
   * Syntax:
   *
   *    math.acsch(x)
   *
   * Examples:
   *
   *    math.acsch(0.5)       // returns 1.4436354751788103
   *
   * See also:
   *
   *    asech, acoth
   *
   * @param {number | Complex | Array | Matrix} x  Function input
   * @return {number | Complex | Array | Matrix} Hyperbolic arccosecant of x
   */
  var acsch = typed(name, {
    number: _number.acschNumber,
    Complex: function Complex(x) {
      return x.acsch();
    },
    BigNumber: function BigNumber(x) {
      return new _BigNumber(1).div(x).asinh();
    },
    'Array | Matrix': function ArrayMatrix(x) {
      return (0, _collection.deepMap)(x, acsch);
    }
  });
  return acsch;
});
exports.createAcsch = createAcsch;