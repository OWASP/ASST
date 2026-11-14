const cors = require('cors');
const router = require('express').Router();

router.use(cors({ origin: true, credentials: true })); // @expect CWE-942

router.get('/api/account', (req, res) => {
  res.set('Access-Control-Allow-Origin', req.headers.origin); // @expect CWE-942
  res.json({});
});

module.exports = router;
