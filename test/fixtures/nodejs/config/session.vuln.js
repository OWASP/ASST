const session = require('express-session');
const router = require('express').Router();

router.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { httpOnly: false } })); // @expect CWE-1004

module.exports = router;
