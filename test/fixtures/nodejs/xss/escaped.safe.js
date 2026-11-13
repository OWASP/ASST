const escapeHtml = require('escape-html');
const router = require('express').Router();

router.get('/hello', (req, res) => {
  res.send(`<h1>Hello ${escapeHtml(req.query.name)}</h1>`);
});

router.get('/api/hello', (req, res) => {
  res.json({ name: req.query.name });
});

router.get('/profile', (req, res) => {
  res.render('profile', { name: req.query.name });
});

router.get('/count', (req, res) => {
  res.send(`<p>${Number(req.query.count) + 1} items</p>`);
});

module.exports = router;
