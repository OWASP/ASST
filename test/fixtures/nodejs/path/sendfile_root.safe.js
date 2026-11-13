const fs = require('fs/promises');
const path = require('path');
const router = require('express').Router();
const UPLOADS = path.join(__dirname, 'uploads');

router.get('/file', (req, res) => {
  res.sendFile(req.query.name, { root: UPLOADS });
});

router.get('/raw', async (req, res) => {
  const name = path.basename(req.query.name);
  const data = await fs.readFile(path.join(UPLOADS, name));
  res.type('application/octet-stream').send(data);
});

module.exports = router;
