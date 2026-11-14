const router = require('express').Router();
const db = require('../db');

router.get('/:id', async (req, res) => {
  const user = await db.findUser(req.params.id);
  const orders = await db.findOrders(req.params.id);
  res.render('profile', { user, orders });
});

router.post('/:id/avatar', async (req, res) => {
  res.redirect(req.body.returnTo); // @expect CWE-601
});

module.exports = router;
