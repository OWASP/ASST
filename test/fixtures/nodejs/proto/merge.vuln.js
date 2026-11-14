const _ = require('lodash');
const router = require('express').Router();
const settings = {};

router.put('/settings', (req, res) => {
  _.merge(settings, req.body); // @expect CWE-1321
  res.json(settings);
});

module.exports = router;
