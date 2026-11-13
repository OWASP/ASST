const cors = require('cors');
const router = require('express').Router();

router.use(cors({ origin: ['https://app.example.com'], credentials: true }));
router.use('/public', cors({ origin: /^https:\/\/([a-z0-9-]+\.)?example\.com$/ }));

module.exports = router;
