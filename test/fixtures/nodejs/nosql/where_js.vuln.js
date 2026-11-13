const router = require('express').Router();

router.get('/items', async (req, res) => {
  const items = await req.app.locals.db.collection('items').find({ $where: `this.owner == '${req.query.owner}'` }).toArray(); // @expect CWE-943
  res.json(items);
});

module.exports = router;
