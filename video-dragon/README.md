# LÓNG: anuncio vertical del dragón (TikTok, Reels, Shorts)

`out/long-dragon-anuncio.mp4`: 1080×1920, 30 fps, 22 s, con música original.

## Estructura (pensada a partir de lo que funciona en anuncios de dropshipping en TikTok)
| Tiempo | Escena | Para qué sirve |
|---|---|---|
| 0–2 s | El dragón se lanza hacia la cámara desde Hong Kong. Texto: «¿Por qué todo el mundo quiere este dragón?» | Gancho de curiosidad con movimiento en el primer segundo |
| 2–6 s | Sube por el plano, el contador llega a «88 CM» y la regla se llena | Enseña el producto y su valor enseguida |
| 6–10 s | Órbita en primer plano mientras sube en espiral. «Cada escama se mueve» | Lo satisfactorio de verlo moverse |
| 10–14 s | «Apaga la luz…», la ciudad se apaga y el dragón brilla | El momento «wow» |
| 14–16 s | Un color en cada golpe: Arcoíris, Galaxia, Plata, Fuego | Variedad y ritmo |
| 16–17 s | Los cuatro colgados. «¿Cuál eliges? Te leo en comentarios» | Provoca comentarios, que dan alcance |
| 17–22 s | Anillo alrededor de la perla, 39,95 €, 2 por 69,95 €, envío gratis y «Link en la bio» | Oferta y llamada a la acción |

Todos los textos quedan fuera de las zonas que tapan los botones de TikTok e Instagram (abajo y a la derecha).

## Cómo se hace
```bash
python3 audio/music.py          # audio/dragon.wav (120 BPM, todo sincronizado con los cortes)
node record.mjs --fps 30        # frames/ (unos 30 min en este contenedor sin GPU)
ffmpeg -framerate 30 -i frames/f%05d.jpg -i audio/dragon.wav -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/long-dragon-anuncio.mp4
```
- **Vista previa en el navegador:** sirve la raíz del repositorio y abre `video-dragon/film.html`. Se reproduce en bucle.
- **Revisar unos pocos fotogramas rápido:** `node record.mjs --jump 1 --at 1,5,12 --out shots`.

## Antes de publicar
- **Precios y envío gratis:** son supuestos. Cámbialos en `film.html` (`#card`) si tu oferta es distinta.
- **El vídeo es 3D animado, no el producto real.** Úsalo junto a vídeos grabados con el producto real. En los anuncios, que el resto del material enseñe el dragón de verdad.
- **Música:** original y generada con código, sin derechos de terceros. Puedes usarla también en anuncios de pago. Para orgánico, puedes cambiarla por un sonido en tendencia dentro de la propia app.
