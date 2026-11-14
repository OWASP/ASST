const fs = require('fs');
const path = require('path');
const router = require('express').Router();

const REPORTS = path.join(__dirname, '..', 'reports');

function reportPath(name) {
  return path.join(REPORTS, name);
}

router.get('/report', (req, res) => {
  fs.createReadStream(reportPath(req.query.name)).pipe(res); // @expect CWE-22
});

router.get('/safe-report', (req, res) => {
  res.sendFile(req.query.name, { root: REPORTS });
});

module.exports = router;
