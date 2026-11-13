const router = require('express').Router();
const plugins = { pdf: require('./plugins/pdf'), csv: require('./plugins/csv') };

router.post('/data', (req, res) => {
  const data = JSON.parse(req.body.payload);
  setTimeout(() => res.json(data), 10);
});

router.get('/plugin', (req, res) => {
  const plugin = plugins[req.query.name];
  res.json(plugin ? plugin.describe() : null);
});

module.exports = router;
