const mongoose = require('mongoose');
const router = require('express').Router();
const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String }));

router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username, password: req.body.password }); // @expect CWE-943
  res.json({ ok: Boolean(user) });
});

module.exports = router;
