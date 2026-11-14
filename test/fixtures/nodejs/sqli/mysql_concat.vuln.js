const mysql = require('mysql2');
const router = require('express').Router();
const db = mysql.createPool({ host: 'localhost' });

router.get('/users', (req, res) => {
  db.query("SELECT * FROM users WHERE name = '" + req.query.name + "'", (err, rows) => res.json(rows)); // @expect CWE-89
});

module.exports = router;
