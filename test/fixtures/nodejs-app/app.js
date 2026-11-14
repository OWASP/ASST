const express = require('express');
const session = require('express-session');
const path = require('path');
const users = require('./routes/users');
const files = require('./routes/files');

const app = express(); // @expect CWE-693
app.set('view engine', 'ejs');
app.use(express.json());
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false })); // @expect CWE-1004
app.use(express.static(path.join(__dirname, 'public')));
app.use('/users', users);
app.use('/files', files);

app.get('/welcome', (req, res) => {
  res.send(`<p>Welcome back, ${req.query.name}!</p>`); // @expect CWE-79
});

app.listen(process.env.PORT || 3000);
