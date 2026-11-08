// node tools/shoot.cjs <out-dir> [width] [height] : screenshots the page after the intro and at each section
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const [out, W = '1440', H = '900'] = process.argv.slice(2); const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.css': 'text/css' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
  await new Promise((r) => srv.on('listening', r));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: +W, height: +H } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  fs.mkdirSync(out, { recursive: true });
  await p.goto(`http://127.0.0.1:${srv.address().port}/`);
  await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/0-intro.jpg`, quality: 80 });
  await p.mouse.move(+W * 0.7, +H * 0.4);
  await p.waitForTimeout(9000); await p.screenshot({ path: `${out}/1-hero.jpg`, quality: 80 });
  for (const id of ['largo', 'mueve', 'brilla', 'colores', 'comprar', 'faq']) {
    await p.evaluate((id) => document.getElementById(id).scrollIntoView(), id);
    await p.mouse.move(+W * (0.3 + Math.random() * 0.4), +H * 0.5);
    await p.waitForTimeout(4500); await p.screenshot({ path: `${out}/${id}.jpg`, quality: 80 });
  }
  console.log('errors:', errs.slice(0, 8));
  await b.close(); srv.close();
})();
