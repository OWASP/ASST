const { Sequelize } = require('sequelize');
const router = require('express').Router();
const sequelize = new Sequelize('sqlite::memory:');

router.get('/u', async (req, res) => {
  const users = await sequelize.query(`SELECT * FROM users WHERE email = '${req.query.email}'`); // @expect CWE-89
  res.json(users);
});

module.exports = router;
