'use strict';

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _thenMysql = require('then-mysql');

var _thenMysql2 = _interopRequireDefault(_thenMysql);

var _promise = require('promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function init(config) {
  var db = new _thenMysql2.default((0, _extends3.default)({}, config, {
    connectionLimit: 1
  }));
  var results = [];
  return function (message) {
    switch (message.type) {
      case 'dispose':
        return db.dispose();
      case 'query':
        return db.query(message.str, message.values);
      case 'call':
        return db.call(message.name, message.args);
      case 'queue-query':
        {
          var index = results.length;
          results.push(db.query(message.str, message.values));
          return index;
        }
      case 'queue-call':
        {
          var _index = results.length;
          results.push(db.query(message.str, message.values));
          return _index;
        }
      case 'end':
        {
          var result = results[message.id];
          results[message.id] = null;
          return result;
        }
      case 'end-all':
        {
          return _promise2.default.all(results).then(function (r) {
            r.forEach(function (v, i) {
              results[i] = null;
            });
            return null;
          });
        }
    }
  };
}
module.exports = init;