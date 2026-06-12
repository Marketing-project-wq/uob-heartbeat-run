// server.js — Railway. Sajikan index.html untuk app utama, dan halaman
// Virtual Run UOB untuk /virtualrun (plus alias lamanya).
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');
const VRUN = path.join(__dirname, 'virtualrun', 'index.html');
const VRUN_TEST = path.join(__dirname, 'virtualrun-test', 'index.html');

// Path yang mengarah ke halaman Virtual Run.
const VRUN_PATHS = ['/virtualrun', '/virtualrun/', '/virtualrun/index.html', '/virtual-run.html', '/virtualrun.html'];
// Path testing (data terpisah).
const VRUN_TEST_PATHS = ['/virtualrun-test', '/virtualrun-test/', '/virtualrun-test/index.html'];

http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0].split('#')[0];
  const file = VRUN_TEST_PATHS.indexOf(url) !== -1 ? VRUN_TEST
    : VRUN_PATHS.indexOf(url) !== -1 ? VRUN
    : INDEX;
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(file).on('error', () => res.end()).pipe(res);
}).listen(PORT, () => console.log('UOB Heartbeat Run on ' + PORT));
