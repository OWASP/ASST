const knex = require('knex')({ client: 'pg' });
const router = require('express').Router();

router.get('/report', async (req, res) => {
  const rows = await knex.raw(`SELECT * FROM sales ORDER BY ${req.query.sort}`); // @expect CWE-89
  res.json(rows);
});

module.exports = router;
