# Anuncio de Casa Rural Santa Creu

Vídeo vertical (1080×1920, 24 s, 30 fps) para TikTok, Reels y Shorts: `santa-creu-anuncio.mp4`.

- `video.html`: la animación. Ábrela con un servidor local (`npx http-server .`) para verla en bucle en el navegador.
- `record.mjs`: graba los fotogramas con Playwright (`node record.mjs --out frames`).
- `music.py`: genera la música (`python3 music.py` → `music.wav`), compuesta desde cero, sin derechos de terceros.
- Montaje: `ffmpeg -framerate 30 -i frames/f%05d.jpg -i music.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest santa-creu-anuncio.mp4`

Datos usados (ficha oficial de Comunitat Valenciana Turismo): casa rural de cuatro estrellas entre Elche y Santa Pola, en una antigua hacienda de 1800, 9 dormitorios y 16 plazas, con piscina, barbacoa, cenador, bodega y jardines. Fotos: las de la casa que se usaron en la web.
