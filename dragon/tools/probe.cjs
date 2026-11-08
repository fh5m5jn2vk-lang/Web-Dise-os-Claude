const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..'); const types = { '.html': 'text/html', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
(async () => {
  const srv = http.createServer((q, r) => { const f = path.join(root, decodeURIComponent(q.url.split('?')[0]).replace(/\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
  await new Promise((r) => srv.on('listening', r));
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  p.on('console', (m) => console.log('[c]', m.text().slice(0, 200)));
  await p.goto(`http://127.0.0.1:${srv.address().port}/`); await p.waitForTimeout(8000);
  await p.evaluate(() => document.getElementById('mueve').scrollIntoView()); 
  for (const w of [2000, 4000, 7000]) { await p.waitForTimeout(w === 2000 ? 2000 : w - 2000); await p.screenshot({ path: process.argv[2] + '/mueve-' + w + '.jpg', quality: 70 }); }
  await b.close(); srv.close();
})();
