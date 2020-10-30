"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createBitNot = void 0;

var _bitwise = require("../../utils/bignumber/bitwise");

var _collection = require("../../utils/collection");

var _factory = require("../../utils/factory");

var _number = require("../../plain/number");

var name = 'bitNot';
var dependencies = ['typed'];
var createBitNot = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed;

  /**
   * Bitwise NOT value, `~x`.
   * For matrices, the function is evaluated element wise.
   * For units, the function is evaluated on the best prefix base.
   *
   * Syntax:
   *
   *    math.bitNot(x)
   *
   * Examples:
   *
   *    math.bitNot(1)               // returns number -2
   *
   *    math.bitNot([2, -3, 4])      // returns Array [-3, 2, 5]
   *
   * See also:
   *
   *    bitAnd, bitOr, bitXor, leftShift, rightArithShift, rightLogShift
   *
   * @param  {number | BigNumber | Array | Matrix} x Value to not
   * @return {number | BigNumber | Array | Matrix} NOT of `x`
   */
  var bitNot = typed(name, {
    number: _number.bitNotNumber,
    BigNumber: _bitwise.bitNotBigNumber,
    'Array | Matrix': function ArrayMatrix(x) {
      return (0, _collection.deepMap)(x, bitNot);
    }
  });
  return bitNot;
});
exports.createBitNot = createBitNot;