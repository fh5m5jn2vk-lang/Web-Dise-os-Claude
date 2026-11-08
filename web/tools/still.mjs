// node tools/still.mjs <out.webp> "<query>" [w] [h]  : renders render.html?<query> and saves the canvas
import { createRequire } from 'node:module';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(require_global()); }
function require_global() { return req('node:child_process').execSync('npm root -g').toString().trim() + '/playwright'; }
const { chromium } = pw;
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const [out, query, w = '1600', h = '1000'] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const port = srv.address().port;
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: +w, height: +h } });
p.on('console', (m) => console.log('[page]', m.text())); p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto(`http://127.0.0.1:${port}/render.html?${query}`);
await p.waitForFunction(() => document.title === 'ready', null, { timeout: 120000 });
const fmt = out.endsWith('.png') ? 'image/png' : 'image/webp';
const data = await p.evaluate((fmt) => document.getElementById('c').toDataURL(fmt, 0.86), fmt);
fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
console.log('saved', out, await p.evaluate(() => window.__leds), 'leds');
await b.close(); srv.close();
