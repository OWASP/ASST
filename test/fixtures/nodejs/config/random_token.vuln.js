function createResetToken() {
  const resetToken = Math.random().toString(36).slice(2); // @expect CWE-338
  return resetToken;
}

module.exports = { createResetToken };
