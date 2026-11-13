const vm = require('vm');
const router = require('express').Router();

router.post('/run', (req, res) => {
  const fn = new Function('a', req.body.code); // @expect CWE-95
  setTimeout(req.body.later, 10); // @expect CWE-95
  const out = vm.runInNewContext(req.body.script, {}); // @expect CWE-95
  res.json({ out, value: fn(1) });
});

module.exports = router;
