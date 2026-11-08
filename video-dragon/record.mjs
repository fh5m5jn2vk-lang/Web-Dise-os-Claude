// node record.mjs [--fps 30] [--at 1,4,8] [--from 0 --to 22] [--out frames]
// Serves the repository root (the film imports ../uprain/js and ../uprain/vendor) and screenshots every frame in order.
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { execSync } from 'node:child_process';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const fps = +(args.fps || 30), v = 'dragon', out = args.out || 'frames', scale = +(args.scale || 1);
const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const b = await pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
p.setDefaultTimeout(300000);
p.on('pageerror', (e) => console.log('[err]', e.message)); p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[page]', m.text().slice(0, 200)); });
await p.goto(`http://127.0.0.1:${srv.address().port}/video-dragon/${args.page || 'film'}.html?record${args.q ? '&' + args.q : ''}`);
await p.waitForFunction(() => window.__ready, null, { timeout: 120000 });
const dur = await p.evaluate(() => window.__dur);
fs.mkdirSync(out, { recursive: true });
const from = +(args.from || 0), to = +(args.to || dur);
const all = Array.from({ length: Math.round(dur * fps) }, (_, i) => i / fps);
const want = args.at ? args.at.split(',').map(Number) : null;
const t0 = Date.now(); let n = 0;
for (let i = 0; i < all.length; i++) {
  const t = all[i];
  if (want) { if (t > Math.max(...want) + 0.001) break; }
  else if (t > to + 1e-6) break;
  if (want && args.jump && !want.some((w) => Math.abs(w - t) < 0.5 / fps)) continue;   // --jump 1: a quick look, no stepping between shots
  await p.evaluate((t) => window.__render(t), t);              // every frame is stepped, so drops and mist stay in order
  const keep = want ? want.some((w) => Math.abs(w - t) < 0.5 / fps) : t >= from - 1e-6;
  if (!keep) continue;
  const name = want ? `at-${t.toFixed(2)}.jpg` : `f${String(i).padStart(5, '0')}.jpg`;
  await p.locator('#stage').screenshot({ path: path.join(out, name), type: 'jpeg', quality: 93 });
  if (++n % 60 === 0) console.log(`v${v}`, n, 'frames', ((Date.now() - t0) / n).toFixed(0), 'ms/frame');
}
console.log('done', n, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
await b.close(); srv.close();
