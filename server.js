// server.js — Railway. Sajikan index.html untuk app utama (produksi), halaman
// Virtual Run UOB untuk /virtualrun, dan versi STAGING (app bersih dari folder
// staging/, lengkap dengan asetnya) untuk /staging — buat tes sebelum live.
const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 3000;

const INDEX = path.join(__dirname, 'index.html');
const VRUN = path.join(__dirname, 'virtualrun', 'index.html');
const VRUN_TEST = path.join(__dirname, 'virtualrun-test', 'index.html');
const STAGING_DIR = path.join(__dirname, 'staging');

// Path yang mengarah ke halaman Virtual Run.
const VRUN_PATHS = ['/virtualrun', '/virtualrun/', '/virtualrun/index.html', '/virtual-run.html', '/virtualrun.html'];
// Path testing (data terpisah).
const VRUN_TEST_PATHS = ['/virtualrun-test', '/virtualrun-test/', '/virtualrun-test/index.html'];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
};

// Kirim file sebagai stream; set Content-Type dari ekstensi. Kalau file tidak
// ada dan ada fallback, sajikan fallback (buat client-side routing SPA).
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

  // --- STAGING: app bersih di /staging (punya folder assets/ sendiri) ---
  if (url === '/staging') { res.writeHead(302, { Location: '/staging/' }); return res.end(); }
  if (url.startsWith('/staging/')) {
    const rel = url.slice('/staging/'.length) || 'index.html';
    const safe = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
    const file = path.resolve(STAGING_DIR, safe);
    if (file !== STAGING_DIR && !file.startsWith(STAGING_DIR + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Forbidden');
    }
    // Rute tanpa ekstensi -> fallback ke index.html; aset hilang -> 404.
    const isRoute = path.extname(safe) === '';
    return sendFile(res, file, isRoute ? path.join(STAGING_DIR, 'index.html') : null);
  }

  // --- Virtual Run (produksi + testing) ---
  if (VRUN_TEST_PATHS.indexOf(url) !== -1) return sendFile(res, VRUN_TEST);
  if (VRUN_PATHS.indexOf(url) !== -1) return sendFile(res, VRUN);

  // --- App utama (produksi) — semua path lain ---
  return sendFile(res, INDEX);
}).listen(PORT, () => console.log('UOB Heartbeat Run on ' + PORT));
