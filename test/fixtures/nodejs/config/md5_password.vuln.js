const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex'); // @expect CWE-916
}

module.exports = { hashPassword };
