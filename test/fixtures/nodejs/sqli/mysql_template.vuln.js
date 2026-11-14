const mysql = require('mysql2/promise');
const router = require('express').Router();
const pool = mysql.createPool({});

router.get('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(`SELECT * FROM orders WHERE id = ${id}`); // @expect CWE-89
  res.json(rows);
});

module.exports = router;
