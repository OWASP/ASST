'use strict';

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var rpc = require('sync-rpc');

var Connection = function () {
  function Connection(config) {
    (0, _classCallCheck3.default)(this, Connection);

    this._client = rpc(__dirname + '/worker.js', config);
  }

  (0, _createClass3.default)(Connection, [{
    key: '_end',
    value: function _end(id) {
      return this._client({ type: 'end', id: id });
    }
  }, {
    key: 'finishAll',
    value: function finishAll() {
      this._client({ type: 'end-all' });
    }
  }, {
    key: 'call',
    value: function call(name, args) {
      if (typeof name !== 'string') {
        throw new TypeError('Expected name to be a string');
      }
      if (!Array.isArray(args)) {
        throw new TypeError('Expected args to be strings');
      }
      if (!args.every(function (arg) {
        return typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' || arg === null;
      })) {
        throw new TypeError('Expected every arg to be a string, number, boolean or null');
      }
      return this._client({ type: 'call', name: name, args: args });
    }
  }, {
    key: 'query',
    value: function query(str) {
      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      if (typeof str !== 'string') {
        throw new TypeError('Expected query to be a string');
      }
      if (!Array.isArray(values)) {
        throw new TypeError('Expected args to be strings');
      }
      if (!values.every(function (arg) {
        return typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' || arg === null;
      })) {
        throw new TypeError('Expected every arg to be a string, number, boolean or null');
      }
      return this._client({ type: 'query', str: str, values: values });
    }
  }, {
    key: 'dispose',
    value: function dispose() {
      return this._client({ type: 'dispose' });
    }
  }, {
    key: 'queueQuery',
    value: function queueQuery(str) {
      var _this = this;

      var values = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

      if (typeof str !== 'string') {
        throw new TypeError('Expected query to be a string');
      }
      if (!Array.isArray(values)) {
        throw new TypeError('Expected args to be strings');
      }
      if (!values.every(function (arg) {
        return typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' || arg === null;
      })) {
        throw new TypeError('Expected every arg to be a string, number, boolean or null');
      }
      var id = this._client({ type: 'queue-query', str: str, values: values });
      return function () {
        return _this._end(id);
      };
    }
  }, {
    key: 'queueCall',
    value: function queueCall(name, args) {
      var _this2 = this;

      if (typeof name !== 'string') {
        throw new TypeError('Expected name to be a string');
      }
      if (!Array.isArray(args)) {
        throw new TypeError('Expected args to be strings');
      }
      if (!args.every(function (arg) {
        return typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean' || arg === null;
      })) {
        throw new TypeError('Expected every arg to be a string, number, boolean or null');
      }
      var id = this._client({ type: 'queue-call', name: name, args: args });
      return function () {
        return _this2._end(id);
      };
    }

    // shorthands

  }, {
    key: 'update',
    value: function update() {
      return this.query.apply(this, arguments);
    }
  }, {
    key: 'queueUpdate',
    value: function queueUpdate() {
      return this.queueQuery.apply(this, arguments);
    }
  }, {
    key: 'getRecord',
    value: function getRecord(table, id) {
      if (typeof table !== 'string') {
        throw new TypeError('Expected "table" to be a string but got ' + (typeof table === 'undefined' ? 'undefined' : (0, _typeof3.default)(table)));
      }
      if (typeof id !== 'string' && typeof id !== 'number') {
        throw new TypeError('Expected "id" in table "' + table + '" to be a string or number but got ' + (typeof id === 'undefined' ? 'undefined' : (0, _typeof3.default)(id)));
      }
      return this.query('SELECT * FROM ?? WHERE id = ?', [table, id])[0];
    }
  }]);
  return Connection;
}();

module.exports = Connection;