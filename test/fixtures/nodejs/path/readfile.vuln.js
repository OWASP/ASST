const fs = require('fs');
const path = require('path');
const router = require('express').Router();

router.get('/docs', (req, res) => {
  fs.readFile(path.join(__dirname, 'docs', req.query.page), 'utf8', (err, text) => res.send(text)); // @expect CWE-22
});

router.get('/download', (req, res) => {
  res.sendFile(req.query.file); // @expect CWE-22
});

module.exports = router;
