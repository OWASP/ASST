const router = require('express').Router();

router.post('/calc', (req, res) => {
  const result = eval(req.body.expression); // @expect CWE-95
  res.json({ result });
});

module.exports = router;
