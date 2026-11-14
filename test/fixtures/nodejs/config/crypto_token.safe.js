const crypto = require('crypto');

function createResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  const delayMs = Math.floor(Math.random() * 100);
  return { resetToken, delayMs };
}

module.exports = { createResetToken };
