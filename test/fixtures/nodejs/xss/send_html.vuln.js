const router = require('express').Router();

router.get('/hello', (req, res) => {
  res.send(`<h1>Hello ${req.query.name}</h1>`); // @expect CWE-79
});

router.get('/link', (req, res) => {
  const url = req.query.url;
  res.send('<a href="' + url + '">continue</a>'); // @expect CWE-79
});

module.exports = router;
