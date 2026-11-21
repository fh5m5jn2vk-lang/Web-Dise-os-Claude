import { createRequire } from 'node:module'; import { execSync } from 'node:child_process'; import path from 'node:path';
const req = createRequire(import.meta.url); let pw; try { pw = req('playwright'); } catch { pw = req(execSync('npm root -g').toString().trim() + '/playwright'); }
const here = path.dirname(new URL(import.meta.url).pathname);
const b = await pw.chromium.launch(); const p = await b.newPage({ viewport: { width: 800, height: 800 } });
await p.goto('file://' + path.join(here, 'perfil.html')); await p.evaluate(() => document.fonts.ready);
for (const id of ['a', 'b', 'c']) {
  await p.evaluate((id) => document.querySelectorAll('svg').forEach((s) => (s.style.display = s.id === id ? 'block' : 'none')), id);
  await p.locator('#' + id).screenshot({ path: path.join(here, `perfil-${id}.png`) });
}
await b.close();
