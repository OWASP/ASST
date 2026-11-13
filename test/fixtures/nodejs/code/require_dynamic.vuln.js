const router = require('express').Router();

router.get('/plugin', (req, res) => {
  const plugin = require(`./plugins/${req.query.name}`); // @expect CWE-829
  res.json(plugin.describe());
});

module.exports = router;
