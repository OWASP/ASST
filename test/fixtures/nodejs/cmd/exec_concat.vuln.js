const { exec } = require('child_process');
const router = require('express').Router();

router.get('/ping', (req, res) => {
  exec('ping -c 1 ' + req.query.host, (err, stdout) => { // @expect CWE-78
    res.type('text').send(stdout);
  });
});

module.exports = router;
