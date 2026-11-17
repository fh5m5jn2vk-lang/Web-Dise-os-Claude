// Graba un vídeo dibujado fotograma a fotograma y lo codifica.
//   node grabar.mjs <vídeo> [--fps 30] [--at 0,2.5,8 (fotos de control)]
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn, execSync } from 'node:child_process';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const ROOT = path.dirname(new URL(import.meta.url).pathname);
const film = process.argv[2]; const args = Object.fromEntries(process.argv.slice(3).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const fps = +(args.fps || 30), dir = path.join(ROOT, film);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.setDefaultTimeout(300000);
p.on('pageerror', (e) => console.log('[error de página]', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('[consola]', m.text().slice(0, 300)); });
await p.goto(`http://127.0.0.1:${srv.address().port}/${film}/index.html?record`);
await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
const dur = await p.evaluate(() => window.__dur);
fs.writeFileSync(path.join(dir, 'cues.json'), JSON.stringify(await p.evaluate(() => window.__cues), null, 1));
if (args.at) {
  fs.mkdirSync(path.join(dir, 'control'), { recursive: true });
  for (const t of args.at.split(',').map(Number)) { await p.evaluate((t) => window.__render(t), t); await p.locator('#stage').screenshot({ path: path.join(dir, 'control', `t${t}.jpg`), type: 'jpeg', quality: 85 }); }
} else {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', path.join(dir, 'imagen.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.__render(t), i / fps);
    const buf = await p.locator('#stage').screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 90 === 0) console.log(film, i, '/', n);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}
await b.close(); srv.close();
console.log(film, 'listo', dur, 's');
