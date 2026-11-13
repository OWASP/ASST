const https = require('https');
const axios = require('axios');

const agent = new https.Agent({ rejectUnauthorized: false }); // @expect CWE-295

module.exports = () => axios.get('https://internal.example.com/health', { httpsAgent: agent });
