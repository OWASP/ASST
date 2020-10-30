function init(connection) {
  return function(message) {
    return Promise.resolve('sent ' + message + ' to ' + connection);
  };
}
module.exports = init;
