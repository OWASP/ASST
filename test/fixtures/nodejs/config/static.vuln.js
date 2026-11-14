const express = require('express');
const helmet = require('helmet');

const app = express();
app.use(helmet());
app.use(express.static(__dirname)); // @expect CWE-538

module.exports = app;
