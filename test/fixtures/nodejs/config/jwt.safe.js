const jwt = require('jsonwebtoken');
const router = require('express').Router();

router.get('/me', (req, res) => {
  const claims = jwt.verify(req.headers.authorization, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  res.json(claims);
});

module.exports = router;
