const util = require('util');
const execAsync = util.promisify(require('child_process').exec);
const router = require('express').Router();

router.post('/convert', async (req, res) => {
  const { file } = req.body;
  const { stdout } = await execAsync(`convert ${file} output.png`); // @expect CWE-78
  res.json({ stdout });
});

module.exports = router;
