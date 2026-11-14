const express = require('express');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'ignore' }));

module.exports = app;
