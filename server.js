// server.js — STAGING deployment for Railway. Serves the clean, un-bundled app
// from staging/ at the site root, so it can be tested on a Railway *staging*
// service before being promoted to production (main). Production main serves
// the packed index.html and is untouched by this branch.
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;

const APP_ROOT = path.join(__dirname, 'staging');          // clean app is the web root here
const VRUN = path.join(__dirname, 'virtualrun', 'index.html');
const VRUN_TEST = path.join(__dirname, 'virtualrun-test', 'index.html');

const VRUN_PATHS = ['/virtualrun', '/virtualrun/', '/virtualrun/index.html', '/virtual-run.html', '/virtualrun.html'];
const VRUN_TEST_PATHS = ['/virtualrun-test', '/virtualrun-test/', '/virtualrun-test/index.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

function sendFile(res, file, fallback) {
  const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const stream = fs.createReadStream(file);
  stream.once('open', () => { res.writeHead(200, { 'Content-Type': type }); stream.pipe(res); });
  stream.once('error', () => {
    if (fallback) return sendFile(res, fallback);
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  });
}

http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0].split('#')[0];

  if (VRUN_TEST_PATHS.indexOf(url) !== -1) return sendFile(res, VRUN_TEST);
  if (VRUN_PATHS.indexOf(url) !== -1) return sendFile(res, VRUN);

  // Serve the clean app (staging/) as the web root, with SPA fallback.
  const rel = url === '/' ? 'index.html' : url.replace(/^\/+/, '');
  const safe = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
  const file = path.resolve(APP_ROOT, safe);
  if (file !== APP_ROOT && !file.startsWith(APP_ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }
  const isRoute = path.extname(safe) === '';                // no extension => client route
  return sendFile(res, file, isRoute ? path.join(APP_ROOT, 'index.html') : null);
}).listen(PORT, () => console.log('UOB Heartbeat Run (STAGING) on ' + PORT));
