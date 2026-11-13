const serialize = require('node-serialize');
const router = require('express').Router();

router.get('/prefs', (req, res) => {
  const prefs = serialize.unserialize(Buffer.from(req.cookies.prefs, 'base64').toString()); // @expect CWE-502
  res.json(prefs);
});

module.exports = router;
