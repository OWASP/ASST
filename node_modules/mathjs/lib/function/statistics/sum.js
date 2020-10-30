"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createSum = void 0;

var _collection = require("../../utils/collection");

var _factory = require("../../utils/factory");

var _improveErrorMessage = require("./utils/improveErrorMessage");

var _noop = require("../../utils/noop");

var name = 'sum';
var dependencies = ['typed', 'config', 'add', '?bignumber', '?fraction'];
var createSum = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      config = _ref.config,
      add = _ref.add,
      bignumber = _ref.bignumber,
      fraction = _ref.fraction;

  /**
   * Compute the sum of a matrix or a list with values.
   * In case of a (multi dimensional) array or matrix, the sum of all
   * elements will be calculated.
   *
   * Syntax:
   *
   *     math.sum(a, b, c, ...)
   *     math.sum(A)
   *
   * Examples:
   *
   *     math.sum(2, 1, 4, 3)               // returns 10
   *     math.sum([2, 1, 4, 3])             // returns 10
   *     math.sum([[2, 5], [4, 3], [1, 7]]) // returns 22
   *
   * See also:
   *
   *    mean, median, min, max, prod, std, variance
   *
   * @param {... *} args  A single matrix or or multiple scalar values
   * @return {*} The sum of all values
   */
  return typed(name, {
    // sum([a, b, c, d, ...])
    'Array | Matrix': _sum,
    // sum([a, b, c, d, ...], dim)
    'Array | Matrix, number | BigNumber': _nsumDim,
    // sum(a, b, c, d, ...)
    '...': function _(args) {
      if ((0, _collection.containsCollections)(args)) {
        throw new TypeError('Scalar values expected in function sum');
      }

      return _sum(args);
    }
  });
  /**
   * Recursively calculate the sum of an n-dimensional array
   * @param {Array} array
   * @return {number} sum
   * @private
   */

  function _sum(array) {
    var sum;
    (0, _collection.deepForEach)(array, function (value) {
      try {
        sum = sum === undefined ? value : add(sum, value);
      } catch (err) {
        throw (0, _improveErrorMessage.improveErrorMessage)(err, 'sum', value);
      }
    });

    if (sum === undefined) {
      switch (config.number) {
        case 'number':
          return 0;

        case 'BigNumber':
          return bignumber ? bignumber(0) : (0, _noop.noBignumber)();

        case 'Fraction':
          return fraction ? fraction(0) : (0, _noop.noFraction)();

        default:
          return 0;
      }
    }

    return sum;
  }

  function _nsumDim(array, dim) {
    try {
      var sum = (0, _collection.reduce)(array, dim, add);
      return sum;
    } catch (err) {
      throw (0, _improveErrorMessage.improveErrorMessage)(err, 'sum');
    }
  }
});
exports.createSum = createSum;