const axios = require('axios');
const router = require('express').Router();

router.get('/user/:id', async (req, res) => {
  const r = await axios.get('https://api.example.com/users/' + encodeURIComponent(req.params.id));
  res.json(r.data);
});

module.exports = router;
