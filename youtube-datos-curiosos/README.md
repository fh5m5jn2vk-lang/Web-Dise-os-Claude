# Informe Curioso: fábrica de Shorts de datos curiosos

Cinco Shorts verticales (1080×1920, 30 fps, 42–59 s) listos para subir, y la línea de producción que los ha hecho, para seguir sacando uno al día.

| Vídeo | Gancho | Duración |
|---|---|---|
| `videos/01-historia.mp4` | Cleopatra vivió más cerca del primer iPhone que de la Gran Pirámide | 58,8 s |
| `videos/02-espacio.mp4` | En Venus, un día dura más que un año | 48,2 s |
| `videos/03-animales.mp4` | Los tiburones son más antiguos que los árboles | 45,9 s |
| `videos/04-numeros.mp4` | Cada vez que barajas, creas un orden que nunca ha existido | 43,2 s |
| `videos/05-cuerpo.mp4` | Ahora mismo eres más bajo que cuando te levantaste | 42,3 s |

Cada vídeo tiene su ficha en `videos/<id>.md`: tres títulos, descripción con fuentes y créditos de las fotos, etiquetas y comentario fijado. Por qué están hechos así: `INFORME-GANCHOS.md`.

## Hacer un vídeo nuevo

1. Copia un guion de `guiones/` y cambia `id`, `numero`, `tema`, `acento` (color), los `segmentos` y el bloque `youtube`.
2. `./hacer.sh guiones/06-loquesea.json --fotos` busca fotos con licencia para cada segmento y deja una hoja de contactos en `build/<id>/candidatos.jpg`. Elige y apunta el `foto_id` en cada segmento (si no, coge la primera).
3. `./hacer.sh guiones/06-loquesea.json` hace el resto: voz, animación, música, mezcla y ficha. Sale `videos/<id>.mp4` y `videos/<id>.md`.

Unos 140 palabras de guion dan unos 45 segundos.

### El guion

```json
{ "say": "Nintendo se fundó en {1889|mil ochocientos ochenta y nueve}…",
  "foto": "hanafuda cards",                       // búsqueda en Wikimedia Commons (en inglés va mejor)
  "foto_id": "f100222272",                        // la elegida en la hoja de contactos
  "viz": { "tipo": "counter", "a": 1889, "de": 2026, "sinmiles": true, "label": "Nintendo · cartas hanafuda" } }
```

- `{1889|mil ochocientos ochenta y nueve}`: en pantalla se ve lo de la izquierda, la voz dice lo de la derecha. Úsalo con cifras y siglas.
- El primer segmento lleva `"tipo": "gancho"` (titular grande, sin subtítulos) y el último `"tipo": "cierre"` (debe empalmar con la primera frase para el bucle). Los demás son los datos y se cuentan en la barra de arriba.
- Visualizaciones (`viz.tipo`): `slam` (titular del gancho, `lineas`), `counter` (número que sube: `a`, `de`, `pre`, `suf`, `dec`), `versus` (dos valores, `barras` para compararlos), `timeline` (`min`, `max`, `marcas`, `gaps`), `reloj` (cuenta de segundos), `stamp` (sello), `ceros` (cifra gigante), `potencias` (10ⁿ frente a 10ᵐ), `cubo`.

## Piezas

- `canal.json`: nombre del canal y voz (ElevenLabs, voz Velion2, modelo multilingüe v2).
- `lib/fotos.mjs`: busca y baja fotos de Wikimedia Commons (solo CC0, CC BY, CC BY-SA y dominio público) con la skill `design-taste-frontend` del proyecto.
- `lib/voz.mjs`: voz en off con tiempos por palabra (para los subtítulos). Guarda en caché lo ya generado.
- `player.html`: la animación. Abre `player.html?id=01-historia` con un servidor local para verla en bucle, o `?id=…&t=12` para un instante.
- `lib/grabar.mjs`: graba fotograma a fotograma con Chromium y codifica con ffmpeg.
- `lib/musica.py`: música y efectos compuestos por código para cada vídeo (sin derechos de terceros), sincronizados con los cortes y los contadores.
- `hacer.sh`: lo encadena todo y mezcla voz, música (que baja sola cuando hablas) y efectos a −14 LUFS, el volumen de YouTube.

Necesita Node 22, Python 3 con numpy y Pillow, ffmpeg, Playwright con Chromium y acceso a la API de ElevenLabs. La subida a YouTube no está automatizada: haría falta conectar la API de YouTube con tu cuenta.
