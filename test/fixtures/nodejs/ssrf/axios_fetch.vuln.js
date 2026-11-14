const axios = require('axios');
const router = require('express').Router();

router.get('/preview', async (req, res) => {
  const response = await axios.get(req.query.url); // @expect CWE-918
  res.json({ title: response.data.title });
});

router.get('/status', async (req, res) => {
  const r = await fetch(`${req.query.base}/status`); // @expect CWE-918
  res.json(await r.json());
});

module.exports = router;
