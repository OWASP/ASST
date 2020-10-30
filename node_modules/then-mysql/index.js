'use strict';

var mysql = require('mysql');
var Promise = require('promise');
var PassThrough = require('barrage').PassThrough;
var MySqlConnection = require('./lib/connection');

module.exports = MySql;
function MySql(config) {
  this._disposed = false;
  if (typeof config === 'function') {
    this._getConnection = function () {
      return new Promise(function (resolve, reject) {
        var res = config(function (err, res) {
          if (err) reject(err);
          else resolve(res);
        });
        if (res && (typeof res === 'object' || typeof res === 'function') && typeof res.then === 'function') {
          return resolve(res);
        }
        if (res && typeof res.query === 'function' && typeof res === 'beginTransaction') {
          return resolve(res);
        }
      });
    };
    this._dispose = function () { return Promise.resolve(null); };
  } else if (typeof config.getConnection === 'function') {
    this._getConnection = Promise.denodeify(config.getConnection.bind(config));
    this._dispose = Promise.denodeify(config.end.bind(config));
  } else {
    var pool = mysql.createPool(config);
    this._getConnection = Promise.denodeify(pool.getConnection.bind(pool));
    this._dispose = Promise.denodeify(pool.end.bind(pool));
  }
}
MySql.prototype.dispose = function () {
  if (this._disposed) return Promise.resolve(null);
  this._disposed = true;
  return this._dispose();
};
MySql.prototype.getConnection = function () {
  return this._getConnection().then(function (res) {
    return new MySqlConnection(res);
  });
};
MySql.prototype.use = function (fn) {
  var connection;
  var res = this.getConnection().then(function (c) {
    connection = c;
    return fn(connection);
  });
  res.done(dispose, dispose);
  function dispose() {
    if (connection)
      connection.release();
  }
  return res;
};
MySql.prototype.useStream = function (fn) {
  var result = new PassThrough({objectMode: true});
  this.getConnection().then(function (connection) {
    var disposed = false;
    var stream = fn(connection);
    stream.on('fields', result.emit.bind(result, 'fields'));
    stream.syphon(result);
    stream.on('error', dispose);
    stream.on('end', dispose);
    function dispose() {
      if (disposed) return;
      disposed = true;
      connection.release();
    }
  }).done(null, function (err) {
    result.emit('error', err);
  });
  return result;
};

MySql.prototype.call = function (name, args) {
  return this.use(function (connection) {
    return connection.call(name, args);
  });
};
MySql.prototype.query = function (str, values) {
  return this.use(function (connection) {
    return connection.query(str, values);
  });
};
MySql.prototype.update = MySql.prototype.query;
MySql.prototype.queryStream = function (str, values) {
  return this.useStream(function (connection) {
    return connection.queryStream(str, values);
  });
};

MySql.escape = mysql.escape;
MySql.escapeId = mysql.escapeId;
MySql.format = mysql.format;
