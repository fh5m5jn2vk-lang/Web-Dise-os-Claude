// node record.mjs [--fps 30] [--at 1.5,4,8] [--out frames]
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const fps = +(args.fps || 30), out = args.out || 'frames';
const root = path.dirname(new URL(import.meta.url).pathname);
const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', (e) => console.log('[err]', e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/${args.page || 'video.html'}?record`);
await p.evaluate(() => window.__ready);
const dur = await p.evaluate(() => window.__dur);
fs.mkdirSync(out, { recursive: true });
const times = args.at ? args.at.split(',').map(Number) : Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
let i = 0;
for (const t of times) {
  await p.evaluate((t) => window.__render(t), t);
  const name = args.at ? `at-${t}.jpg` : `f${String(i).padStart(5, '0')}.jpg`;
  await p.screenshot({ path: path.join(out, name), type: 'jpeg', quality: 92 });
  if (++i % 90 === 0) console.log(i, '/', times.length);
}
await b.close(); srv.close();
