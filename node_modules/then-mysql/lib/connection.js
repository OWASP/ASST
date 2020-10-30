'use strict';

var Readable = require('barrage').Readable;
var Promise = require('promise');

module.exports = MySqlConnection;
function MySqlConnection(connection) {
  this._released = false;
  this._connection = connection;
}

MySqlConnection.prototype.release = function () {
  if (this._released) return;
  this._released = true;
  if (this._connection.release) this._connection.release();
  else this._connection.end();
};

MySqlConnection.prototype.call = function (name, args) {
  return Promise.resolve(null).then(function () {
    if (this._released) throw new Error('Cannot call procedure on a disposed connection');
    assertString(name, 'Database procedure call name');
    assertArrayOrNull(args, 'Database precedure call arguments');
    var qs = (args || []).map(function () { return '?'; });
    return this.query('CALL ' + name + '(' + qs.join(', ') + ')', args).then(function (result) {
      if (!Array.isArray(result)) return {metadata: result};
      var metadata = result.pop();
      // result is now an array of arrays of results.
      // if the procedure contained a single statement, we just want to return the result of that statement
      if (result.length === 1 && Array.isArray(result[0])) result = result[0];
      // arrays can have additional properties, it won't do them any harm
      result.metadata = metadata;
      return result;
    });
  }.bind(this));
};
MySqlConnection.prototype.query = function (str, values) {
  var connection = this._connection;
  return new Promise(function (resolve, reject) {
    if (this._released) throw new Error('Cannot query a disposed connection');
    assertString(str, 'Database query');
    assertArrayOrNull(values, 'Database query values');
    values = values || [];
    values = values.map(this.nullify);
    connection.query(str, values, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  }.bind(this));
};
MySqlConnection.prototype.update = MySqlConnection.prototype.query;

MySqlConnection.prototype.queryStream = function (str, values) {
  if (this._released) throw new Error('Cannot query a disposed connection');
  assertString(str, 'Database query');
  assertArrayOrNull(values, 'Database query values');
  values = (values || []).map(this.nullify);
  var connection = this._connection;
  var paused = false;
  var started = false;
  var stream = new Readable({objectMode: true});
  function start() {
    var ended = false;
    function protect(fn, end) {
      return function () {
        if (ended) return;
        ended = end;
        fn.apply(this, arguments);
      }
    };
    var query = connection.query(str, values);
    query.on('fields', protect(function (fields) {
      stream.emit('fields', fields);
    }));
    query.on('result', protect(function (record) {
      if (!stream.push(record) && !paused) {
        connection.pause();
        paused = true;
      }
    }));
    query.on('error', protect(function (err) {
      if (paused) connection.resume();
      stream.emit('error', err);
      stream.push(null);
    }, true));
    query.on('end', protect(function () {
      if (paused) connection.resume();
      stream.push(null);
    }, true));
  };
  stream._read = function () {
    if (!started) {
      started = true;
      start();
    } else if (paused) {
      connection.resume();
      paused = false;
    }
  };
  return stream;
};

/**
 * Make null-like values into true `null` before giving them to the database
 *
 * @param {Object} value
 * @return {Object}
 */
MySqlConnection.prototype.nullify = function nullify(value) {
  if (value === '' || value === undefined) return null;
  else return value;
};

function assertString(str, name) {
  if (typeof str !== 'string')
    throw new TypeError(name + ' must be specified as a string, not ' + typeof str);
}

function assertArrayOrNull(arr, name) {
  if (arr !== null && arr !== undefined && !Array.isArray(arr))
    throw new TypeError(name + ' must be specified as an array, not ' + typeof arr);
}
