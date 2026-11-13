const router = require('express').Router();
const PAGES = ['/home', '/profile', '/settings'];

router.get('/go', (req, res) => {
  const target = req.query.page;
  if (PAGES.includes(target)) return res.redirect(target);
  res.redirect('/home');
});

router.get('/item/:id', (req, res) => {
  res.redirect('/items/' + encodeURIComponent(req.params.id));
});

module.exports = router;
