const { spawn } = require('node:child_process');
const router = require('express').Router();

router.get('/grep', (req, res) => {
  const child = spawn(`grep -r ${req.query.q} ./docs`, { shell: true }); // @expect CWE-78
  child.stdout.pipe(res);
});

module.exports = router;
