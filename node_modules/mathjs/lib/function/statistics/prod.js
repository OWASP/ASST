"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createProd = void 0;

var _collection = require("../../utils/collection");

var _factory = require("../../utils/factory");

var _improveErrorMessage = require("./utils/improveErrorMessage");

var name = 'prod';
var dependencies = ['typed', 'multiply'];
var createProd = /* #__PURE__ */(0, _factory.factory)(name, dependencies, function (_ref) {
  var typed = _ref.typed,
      multiply = _ref.multiply;

  /**
   * Compute the product of a matrix or a list with values.
   * In case of a (multi dimensional) array or matrix, the sum of all
   * elements will be calculated.
   *
   * Syntax:
   *
   *     math.prod(a, b, c, ...)
   *     math.prod(A)
   *
   * Examples:
   *
   *     math.multiply(2, 3)           // returns 6
   *     math.prod(2, 3)               // returns 6
   *     math.prod(2, 3, 4)            // returns 24
   *     math.prod([2, 3, 4])          // returns 24
   *     math.prod([[2, 5], [4, 3]])   // returns 120
   *
   * See also:
   *
   *    mean, median, min, max, sum, std, variance
   *
   * @param {... *} args  A single matrix or or multiple scalar values
   * @return {*} The product of all values
   */
  return typed(name, {
    // prod([a, b, c, d, ...])
    'Array | Matrix': _prod,
    // prod([a, b, c, d, ...], dim)
    'Array | Matrix, number | BigNumber': function ArrayMatrixNumberBigNumber(array, dim) {
      // TODO: implement prod(A, dim)
      throw new Error('prod(A, dim) is not yet supported'); // return reduce(arguments[0], arguments[1], math.prod)
    },
    // prod(a, b, c, d, ...)
    '...': function _(args) {
      return _prod(args);
    }
  });
  /**
   * Recursively calculate the product of an n-dimensional array
   * @param {Array} array
   * @return {number} prod
   * @private
   */

  function _prod(array) {
    var prod;
    (0, _collection.deepForEach)(array, function (value) {
      try {
        prod = prod === undefined ? value : multiply(prod, value);
      } catch (err) {
        throw (0, _improveErrorMessage.improveErrorMessage)(err, 'prod', value);
      }
    });

    if (prod === undefined) {
      throw new Error('Cannot calculate prod of an empty array');
    }

    return prod;
  }
});
exports.createProd = createProd;