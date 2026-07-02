// Un-bundler — turns the packed root index.html back into an editable static
// site under staging/. Run from the repo root:  node tools/unbundle.mjs
//
// The packed index.html hides the real app inside a JSON-escaped "template"
// blob plus 65 base64 assets. Editing it by hand destroys formatting. This
// script replays what the runtime bundler did (un-escape, decode assets, wire
// references) but writes real files, so the app becomes normal editable HTML +
// assets. See staging/README.md.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const SRC = process.argv[2] || path.join(ROOT, 'index.html');
const OUT = process.argv[3] || path.join(ROOT, 'staging');
const PATCHES = process.argv[4] || path.join(ROOT, 'tools', 'runtime-patches.js');

const html = fs.readFileSync(SRC, 'utf8');
const grab = (t) => {
  const m = html.match(new RegExp('<script type="__bundler/' + t + '"[^>]*>([\\s\\S]*?)</script>', 'i'));
  return m ? m[1] : null;
};
const manifest = JSON.parse(grab('manifest'));
const extResources = JSON.parse(grab('ext_resources') || '[]');
let template = JSON.parse(grab('template'));

const EXT = {
  'font/woff2': 'woff2', 'application/javascript': 'js', 'text/javascript': 'js',
  'text/jsx': 'jsx', 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg',
  'image/svg+xml': 'svg', 'text/css': 'css',
};

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

// 1) Decode every asset to a real file (gunzip when the manifest marks it).
const relPath = {};
for (const uuid of Object.keys(manifest)) {
  const e = manifest[uuid];
  let bytes = Buffer.from(e.data, 'base64');
  if (e.compressed) {
    try { bytes = zlib.gunzipSync(bytes); }
    catch { try { bytes = zlib.inflateSync(bytes); } catch { bytes = zlib.brotliDecompressSync(bytes); } }
  }
  const file = `${uuid}.${EXT[e.mime] || 'bin'}`;
  fs.writeFileSync(path.join(OUT, 'assets', file), bytes);
  relPath[uuid] = `assets/${file}`;
}

// 2) Un-escape the template (JSON had every / as \/).
template = template.split('\\/').join('/');
// 3) Strip SRI + crossorigin (assets are local now).
template = template.replace(/\s+integrity="[^"]*"/gi, '').replace(/\s+crossorigin(="[^"]*")?/gi, '');
// 4) Point every asset uuid at its real relative path.
for (const uuid of Object.keys(relPath)) template = template.split(uuid).join(relPath[uuid]);

// 5) Rebuild window.__resources (id -> asset path) and inject after <head>.
const resourceMap = {};
for (const r of extResources) if (relPath[r.uuid]) resourceMap[r.id] = relPath[r.uuid];
const resScript = '\n<script>window.__resources = ' + JSON.stringify(resourceMap, null, 2) + ';</script>';
const headOpen = template.match(/<head[^>]*>/i);
if (headOpen) {
  const i = headOpen.index + headOpen[0].length;
  template = template.slice(0, i) + resScript + template.slice(i);
}

// 6) Carry over the runtime patches from the old wrapper as a normal script.
if (fs.existsSync(PATCHES)) {
  fs.copyFileSync(PATCHES, path.join(OUT, 'assets', 'runtime-patches.js'));
  const tag = '\n<script src="assets/runtime-patches.js"></script>\n';
  template = /<\/body>/i.test(template) ? template.replace(/<\/body>/i, tag + '</body>') : template + tag;
}

fs.writeFileSync(path.join(OUT, 'index.html'), template);

const bareUuids = (template.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?!\.)/g) || []).length;
console.log(`Wrote ${OUT}/index.html (${template.split('\n').length} lines) + ${Object.keys(relPath).length} assets`);
console.log(`window.__resources entries: ${Object.keys(resourceMap).length} | leftover bare uuids: ${bareUuids}`);
if (bareUuids) console.warn('WARNING: some asset uuids were not resolved — investigate before shipping.');
