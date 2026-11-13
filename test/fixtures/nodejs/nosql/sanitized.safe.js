const sanitize = require('mongo-sanitize');
const router = require('express').Router();

router.post('/find', async (req, res) => {
  const filter = sanitize(req.body.filter);
  const docs = await req.app.locals.db.collection('docs').find({ owner: filter }).toArray();
  res.json(docs);
});

module.exports = router;
