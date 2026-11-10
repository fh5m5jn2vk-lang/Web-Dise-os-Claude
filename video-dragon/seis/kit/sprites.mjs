// node seis/kit/sprites.mjs <out dir> <query>   — renders a sprite loop of the dragon as transparent PNGs
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const req = createRequire(import.meta.url); const pw = req('/opt/node22/lib/node_modules/playwright');
const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '../../..');
const T = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const out = process.argv[2], qs = process.argv[3]; fs.mkdirSync(out, { recursive: true });
const p0 = new URLSearchParams(qs), Wd = +(p0.get('w') || 360), Hd = +(p0.get('h') || 1000);
const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: Wd, height: Hd } });
p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/video-dragon/seis/kit/sprite.html?${qs}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const n = await p.evaluate(() => window.__n);
for (let i = 0; i < n; i++) { await p.evaluate((i) => window.__render(i), i); await p.locator('#gl').screenshot({ path: path.join(out, String(i).padStart(3, '0') + '.png'), omitBackground: true }); }
await b.close(); srv.close(); console.log('sprites', out, n);
