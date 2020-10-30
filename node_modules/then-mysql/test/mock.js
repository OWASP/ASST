'use strict';

var EventEmitter = require('events').EventEmitter;
var Promise = require('promise');

module.exports = function getConnection() {
  return Promise.resolve(new Connection());
};

function Connection() {
}
Connection.prototype.release = function () {
};
Connection.prototype.pause = function () {
};
Connection.prototype.resume = function () {
};
Connection.prototype.query = function (str, values, cb) {
  if (str === 'SELECT 1 + 1 AS solution' && Array.isArray(values) && values.length === 0) {
    if (typeof cb === 'function') {
      cb(null, [{solution: 2}], []);
    } else {
      var stream = new EventEmitter();
      setTimeout(function () {
        stream.emit('fields', [{name: 'solution'}]);
        stream.emit('result', {solution: 2});
        stream.emit('end');
      }, 0);
      return stream;
    }
  } else if (str === 'CALL myproc()') {
    cb(null, [[{solution: 2}], {metadata: true}]);
  } else if (str === 'CALL myprocmulti()') {
    cb(null, [[{solution: 2}], [{otherSolution: 4}], {metadata: true}]);
  } else if (/CREATE PROCEDURE/.test(str)) {
    cb();
  } else {
    throw new Error('unrecognized query ' + JSON.stringify(str) + JSON.stringify(values));
  }
};
