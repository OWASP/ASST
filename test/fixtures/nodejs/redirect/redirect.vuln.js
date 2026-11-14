const router = require('express').Router();

router.get('/login/done', (req, res) => {
  res.redirect(req.query.next); // @expect CWE-601
});

router.get('/out', (req, res) => {
  res.setHeader('Location', req.query.to); // @expect CWE-601
  res.status(302).end();
});

module.exports = router;
