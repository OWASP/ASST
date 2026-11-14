const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const knex = require('knex')({ client: 'pg' });
const router = require('express').Router();
const db = mysql.createPool({});
const pg = new Pool();

router.get('/a/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
  const r2 = await pg.query('SELECT * FROM users WHERE email = $1', [req.query.email]);
  const r3 = await knex('users').where('name', req.query.name);
  const r4 = await db.execute({ sql: 'SELECT * FROM t WHERE a = ?', values: [req.query.a] });
  res.json({ rows, r2, r3, r4 });
});

module.exports = router;
