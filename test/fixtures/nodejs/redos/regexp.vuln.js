const router = require('express').Router();

router.get('/search', (req, res) => {
  const pattern = new RegExp(req.query.q, 'i'); // @expect CWE-1333
  res.json(['alpha', 'beta'].filter((w) => pattern.test(w)));
});

module.exports = router;
