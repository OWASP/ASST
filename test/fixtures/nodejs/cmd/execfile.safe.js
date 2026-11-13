const { execFile } = require('child_process');
const router = require('express').Router();
const FORMATS = ['png', 'jpg', 'webp'];

router.get('/thumb', (req, res) => {
  const format = req.query.format;
  if (!FORMATS.includes(format)) return res.status(400).end();
  execFile('convert', ['--', 'input.tif', `out.${format}`], () => res.end());
});

router.get('/whois', (req, res) => {
  execFile('whois', ['--', req.query.domain], () => res.end());
});

module.exports = router;
