const { Pool } = require('pg');
const router = require('express').Router();
const pool = new Pool();

router.post('/search', async (req, res) => {
  const term = req.body.term;
  const sql = "SELECT * FROM products WHERE title LIKE '%" + term + "%'";
  const result = await pool.query(sql); // @expect CWE-89
  res.json(result.rows);
});

module.exports = router;
