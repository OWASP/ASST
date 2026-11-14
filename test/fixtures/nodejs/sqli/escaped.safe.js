const mysql = require('mysql');
const router = require('express').Router();
const connection = mysql.createConnection({});

router.get('/x', (req, res) => {
  const id = parseInt(req.query.id, 10);
  connection.query('SELECT * FROM t WHERE id = ' + id);
  connection.query('SELECT * FROM t WHERE name = ' + mysql.escape(req.query.name));
  connection.query('SELECT * FROM t WHERE code = ' + connection.escape(req.query.code));
  res.end();
});

module.exports = router;
