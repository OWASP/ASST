const mongoose = require('mongoose');
const router = require('express').Router();
const User = mongoose.model('User');

router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: String(req.body.username) });
  const byId = await User.findById(req.params.id);
  res.json({ user, byId });
});

module.exports = router;
