// Ficha de subida a YouTube: título, descripción (con fuentes y créditos de las fotos), etiquetas y comentario fijado.
//   node lib/metadatos.mjs guiones/01-historia.json -> videos/<id>.md
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const g = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const y = g.youtube || {};
const cred = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', g.id, 'creditos.json'), 'utf8'));
const tl = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', g.id, 'timeline.json'), 'utf8'));
const uniq = [...new Map(cred.map((c) => [c.id, c])).values()];
const guion = g.segmentos.map((s) => s.say.replace(/\{([^|}]*)\|[^}]*\}/g, '$1')).join(' ');
const desc = [
  y.descripcion || g.titulo,
  '',
  '📌 Fuentes:',
  ...(y.fuentes || []).map((f) => `• ${f}`),
  '',
  '📷 Fotos (Wikimedia Commons):',
  ...uniq.map((c) => `• ${c.titulo} · ${c.autor} · ${c.licencia} · ${c.url}`),
  '',
  '🎵 Música y efectos: originales del canal.',
  '',
  (y.hashtags || ['#Shorts', '#DatosCuriosos']).join(' '),
].join('\n');
const md = `# ${g.id} · ${g.titulo}

Archivo: \`videos/${g.id}.mp4\` · ${tl.dur.toFixed(1)} s · 1080×1920 · 30 fps

## Título (elige uno; el primero es el recomendado)
${(y.titulos || [g.titulo]).map((t, i) => `${i + 1}. ${t}`).join('\n')}

## Descripción
\`\`\`
${desc}
\`\`\`

## Etiquetas
\`\`\`
${(y.tags || []).join(', ')}
\`\`\`

## Comentario fijado
${y.comentario || ''}

## Guion
${guion}
`;
fs.mkdirSync(path.join(ROOT, 'videos'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'videos', `${g.id}.md`), md);
console.log('ficha:', `videos/${g.id}.md`);
