const _ = require('lodash');
const router = require('express').Router();
const settings = { theme: 'light', language: 'en' };

router.put('/settings', (req, res) => {
  const { theme, language } = req.body;
  Object.assign(settings, { theme: String(theme), language: String(language) });
  _.merge(settings, { updatedAt: Date.now() });
  res.json(settings);
});

module.exports = router;
