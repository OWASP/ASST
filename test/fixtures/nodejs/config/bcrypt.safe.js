const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

function checksum(fileBuffer) {
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

module.exports = { hashPassword, checksum };
