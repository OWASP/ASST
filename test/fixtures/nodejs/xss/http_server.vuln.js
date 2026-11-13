const http = require('http');
const url = require('url');

http.createServer((req, res) => {
  const query = url.parse(req.url, true).query;
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<p>' + query.message + '</p>'); // @expect CWE-79
}).listen(8080);
