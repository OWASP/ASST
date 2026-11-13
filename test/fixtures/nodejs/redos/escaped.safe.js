const escapeStringRegexp = require('escape-string-regexp');
const router = require('express').Router();

router.get('/search', (req, res) => {
  const escaped = String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped, 'i');
  res.json(['alpha', 'beta'].filter((w) => pattern.test(w)));
});

router.get('/find', (req, res) => {
  const pattern = new RegExp(escapeStringRegexp(req.query.q));
  res.json({ match: pattern.test('alpha') });
});

module.exports = router;
