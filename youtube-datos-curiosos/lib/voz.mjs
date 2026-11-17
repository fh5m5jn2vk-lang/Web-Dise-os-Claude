// Voz en off con ElevenLabs + tiempos por palabra para los subtítulos.
//   node lib/voz.mjs guiones/01-historia.json  -> build/<id>/voz.mp3 y build/<id>/timeline.json
// Marcado en el texto: {lo que se ve|lo que se dice}, p. ej. {1889|mil ochocientos ochenta y nueve}.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'canal.json'), 'utf8'));
const guion = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const dir = path.join(ROOT, 'build', guion.id); fs.mkdirSync(dir, { recursive: true });

// 1. tokens: lo que se ve en pantalla y el tramo de texto hablado que le corresponde
let spoken = ''; const tokens = [];
for (const [si, s] of guion.segmentos.entries()) {
  const subs = []; const text = s.say.replace(/\{([^|}]*)\|([^}]*)\}/g, (_, d, v) => (subs.push([d, v]), `\u0001${subs.length - 1}\u0001`));
  for (const chunk of text.split(/\s+/).filter(Boolean)) {
    const disp = chunk.replace(/\u0001(\d+)\u0001/g, (_, i) => subs[i][0]);
    const say = chunk.replace(/\u0001(\d+)\u0001/g, (_, i) => subs[i][1]);
    if (spoken) spoken += ' ';
    tokens.push({ w: disp, seg: si, a: spoken.length, b: spoken.length + say.length });
    spoken += say;
  }
}

// 2. síntesis (en caché por texto + voz)
const v = cfg.voz;
const key = crypto.createHash('sha1').update(JSON.stringify([spoken, v])).digest('hex').slice(0, 12);
const cache = path.join(dir, `tts-${key}.json`);
if (!fs.existsSync(cache)) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.voice_id}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST', headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY || 'proxy', 'content-type': 'application/json' },
    body: JSON.stringify({ text: spoken, model_id: v.model_id, language_code: 'es', voice_settings: v.settings }),
  });
  if (!r.ok) { console.error(r.status, await r.text()); process.exit(1); }
  fs.writeFileSync(cache, await r.text());
}
const res = JSON.parse(fs.readFileSync(cache, 'utf8'));
fs.writeFileSync(path.join(dir, 'voz.mp3'), Buffer.from(res.audio_base64, 'base64'));
const al = res.alignment, st = al.character_start_times_seconds, en = al.character_end_times_seconds;
if (al.characters.join('') !== spoken) console.warn('aviso: el texto alineado no coincide exactamente');

// 3. tiempos
const words = tokens.map((t) => {
  let a = t.a, b = t.b - 1;
  while (a < b && /[\s¿¡"(]/.test(spoken[a])) a++;
  while (b > a && /[\s.,:;!?…")]/.test(spoken[b])) b--;
  return { w: t.w, seg: t.seg, t0: +st[a].toFixed(3), t1: +en[b].toFixed(3) };
});
const segs = guion.segmentos.map((s, i) => {
  const ws = words.filter((w) => w.seg === i);
  return { ...s, i, start: ws[0].t0, end: ws[ws.length - 1].t1 };
});
// cada segmento empieza justo antes de su primera palabra y dura hasta que empieza el siguiente
for (let i = 0; i < segs.length; i++) {
  segs[i].start = i === 0 ? 0 : Math.max(segs[i - 1].end, segs[i].start - 0.12);
  segs[i].fin = i + 1 < segs.length ? Math.max(segs[i + 1].start - 0.12, segs[i].end) : segs[i].end;
}
const dur = +(words[words.length - 1].t1 + 0.45).toFixed(3);
segs[segs.length - 1].fin = dur;
for (let i = 0; i + 1 < segs.length; i++) segs[i].fin = segs[i + 1].start;
const timeline = { id: guion.id, numero: guion.numero, tema: guion.tema, acento: guion.acento, titulo: guion.titulo, canal: cfg.nombre, dur, segs, words };
fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify(timeline, null, 1));
console.log(guion.id, 'duración', dur, 's,', words.length, 'palabras');
