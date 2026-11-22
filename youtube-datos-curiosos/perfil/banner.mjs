import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import path from 'node:path';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const here = path.dirname(new URL(import.meta.url).pathname);
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 2560, height: 1440 } });
await p.goto('file://' + path.join(here, 'banner.html')); await p.waitForFunction(() => window.__listo);
console.log(JSON.stringify(await p.evaluate(() => window.__medidas)));
// la caja que ocupa el texto, para comprobar que cabe en la zona segura
console.log(JSON.stringify(await p.evaluate(() => { const r = document.getElementById('texto').getBoundingClientRect(); return { x0: Math.round(r.left), x1: Math.round(r.right), y0: Math.round(r.top), y1: Math.round(r.bottom) }; })));
await p.locator('#banner').screenshot({ path: path.join(here, 'banner.png') });
await b.close();
