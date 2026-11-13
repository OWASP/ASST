const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = require('express').Router();

router.get('/p', async (req, res) => {
  const rows = await prisma.$queryRaw`SELECT * FROM users WHERE id = ${req.query.id}`;
  res.json(rows);
});

module.exports = router;
