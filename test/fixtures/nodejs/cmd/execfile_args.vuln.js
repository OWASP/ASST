const { execFile } = require('child_process');
const router = require('express').Router();

router.get('/lookup', (req, res) => {
  execFile('whois', [req.query.domain], () => res.send('done')); // @expect CWE-88
});

module.exports = router;
