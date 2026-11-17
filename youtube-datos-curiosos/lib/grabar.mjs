// Graba el vídeo fotograma a fotograma con Chromium y lo codifica con ffmpeg.
//   node lib/grabar.mjs 01-historia [--fps 30] [--at 0,3.5,10 (solo fotos de control)]
import { createRequire } from 'node:module'; import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn, execSync } from 'node:child_process';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const id = process.argv[2]; const args = Object.fromEntries(process.argv.slice(3).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const fps = +(args.fps || 30); const dir = path.join(ROOT, 'build', id);
const types = { '.html': 'text/html', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.json': 'application/json', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0, '127.0.0.1');
await new Promise((r) => srv.on('listening', r));
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
p.on('pageerror', (e) => console.log('[error de página]', e.message));
await p.goto(`http://127.0.0.1:${srv.address().port}/player.html?record&id=${id}`);
await p.evaluate(() => window.__ready);
const dur = await p.evaluate(() => window.__dur);
fs.writeFileSync(path.join(dir, 'cues.json'), JSON.stringify(await p.evaluate(() => window.__cues), null, 1));
if (args.at) {
  fs.mkdirSync(path.join(dir, 'control'), { recursive: true });
  for (const t of args.at.split(',').map(Number)) { await p.evaluate((t) => window.__render(t), t); await p.screenshot({ path: path.join(dir, 'control', `t${t}.jpg`), type: 'jpeg', quality: 85 }); }
} else {
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(fps), path.join(dir, 'imagen.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    await p.evaluate((t) => window.__render(t), i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(id, i, '/', n);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
}
await b.close(); srv.close();
console.log(id, 'listo', dur, 's');
