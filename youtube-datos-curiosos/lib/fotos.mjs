// Fotos con licencia (Wikimedia Commons) para cada segmento de un guion.
//   node lib/fotos.mjs buscar guiones/01-historia.json   -> candidatos + hoja de contactos build/<id>/candidatos.jpg
//   node lib/fotos.mjs bajar  guiones/01-historia.json   -> descarga la foto elegida (foto_id, o el primer candidato)
// La búsqueda usa la skill design-taste-frontend (photos.mjs search): solo JPEG, CC0 / CC BY / CC BY-SA / dominio público.
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SKILL = path.resolve(ROOT, '../.claude/skills/design-taste-frontend/scripts/photos.mjs');
const UA = 'InformeCuriosoBot/1.0 (video pipeline; contact via repository)';
const [cmd, guionPath] = process.argv.slice(2);
const guion = JSON.parse(fs.readFileSync(guionPath, 'utf8'));
const dir = path.join(ROOT, 'build', guion.id); fs.mkdirSync(path.join(dir, 'fotos'), { recursive: true });
const candPath = path.join(dir, 'candidatos.json');
const cands = fs.existsSync(candPath) ? JSON.parse(fs.readFileSync(candPath, 'utf8')) : {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    await sleep(1500 * 2 ** i);
  }
  throw new Error('no se pudo bajar ' + url);
}
const thumb = (p, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(decodeURIComponent(p.page.split('File:')[1]))}?width=${w}`;

if (cmd === 'buscar') {
  for (const [i, s] of guion.segmentos.entries()) {
    if (cands[i]?.query === s.foto) continue;
    execFileSync('node', [SKILL, 'search', s.foto, '--count', '6', '--min', '1200', '--out', dir], { stdio: 'pipe' });
    const found = JSON.parse(fs.readFileSync(path.join(dir, '.taste-skill/found.json'), 'utf8')).photos;
    cands[i] = { query: s.foto, fotos: found.filter((p) => p.query === s.foto).slice(0, 6) };
    console.log(i, s.foto, '->', cands[i].fotos.length);
    await sleep(800);
  }
  fs.writeFileSync(candPath, JSON.stringify(cands, null, 1));
  // hoja de contactos: una fila por segmento, hasta 6 miniaturas
  const tmp = path.join(dir, 'thumbs'); fs.mkdirSync(tmp, { recursive: true });
  const rows = [];
  for (const [i, c] of Object.entries(cands)) {
    const files = [];
    for (const [k, p] of c.fotos.entries()) {
      const f = path.join(tmp, `${i}-${k}.jpg`);
      if (!fs.existsSync(f)) { fs.writeFileSync(f, await get(thumb(p, 330))); await sleep(300); }
      files.push([f, `${i}.${k} ${p.id}`]);
    }
    rows.push(files);
  }
  fs.writeFileSync(path.join(tmp, 'sheet.json'), JSON.stringify(rows));
  execFileSync('python3', [path.join(ROOT, 'lib/hoja.py'), path.join(tmp, 'sheet.json'), path.join(dir, 'candidatos.jpg')], { stdio: 'inherit' });
  console.log('hoja:', path.join(dir, 'candidatos.jpg'));
}

if (cmd === 'bajar') {
  const creditos = [];
  for (const [i, s] of guion.segmentos.entries()) {
    const list = cands[i]?.fotos || [];
    const all = Object.values(cands).flatMap((c) => c.fotos);
    const p = (s.foto_id && all.find((x) => x.id === s.foto_id)) || list[0];
    if (!p) { console.log('sin foto para el segmento', i); continue; }
    const out = path.join(dir, 'fotos', `${i}.jpg`);
    // suficiente para cubrir 1080x1920 con margen para el zoom
    const w = Math.min(p.width, Math.max(1500, Math.ceil(2300 * p.ratio)));
    if (!fs.existsSync(out) || fs.readFileSync(out + '.id', 'utf8') !== p.id) {
      fs.writeFileSync(out, await get(thumb(p, w))); fs.writeFileSync(out + '.id', p.id); await sleep(400);
    }
    creditos.push({ segmento: i, id: p.id, titulo: p.alt, autor: p.by, licencia: p.licence, url: p.page });
  }
  fs.writeFileSync(path.join(dir, 'creditos.json'), JSON.stringify(creditos, null, 1));
  console.log('fotos listas:', creditos.length);
}
