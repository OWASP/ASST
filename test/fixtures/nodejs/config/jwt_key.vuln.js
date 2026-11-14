const jwt = require('jsonwebtoken');

module.exports = (user) => jwt.sign({ sub: user.id }, 'super-secret-key-2024', { expiresIn: '1h' }); // @expect CWE-798
