# Anuncio de Casa Rural Santa Creu

Vídeo vertical (1080×1920, 30 s, 30 fps) para TikTok, Reels y Shorts: `santa-creu-anuncio.mp4`.

- `video.html`: la animación. Ábrela con un servidor local (`npx http-server .`) para verla en bucle en el navegador.
- `record.mjs`: graba los fotogramas con Playwright (`node record.mjs --out frames`).
- `music.py`: genera la música (`python3 music.py` → `music.wav`), compuesta desde cero, sin derechos de terceros.
- Montaje: `ffmpeg -framerate 30 -i frames/f%05d.jpg -i music.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -shortest santa-creu-anuncio.mp4`

Datos y fotos sacados de https://casaruralsantacreu.com: antigua Hacienda Santa Cruz (1800), entre Elche y Santa Pola; 9 habitaciones, 16 personas, 601 m²; casa de uso exclusivo; piscina, bodega, barbacoa, cenador, futbolín y ping-pong, jardín; playa a 5 min, Elche a 8 km, aeropuerto de Alicante a 15 min; desde 880 € la noche (temporada baja); cupón SANTACREU15 (−15 %); WhatsApp 661 531 053; reseña de Juande. Cuatro estrellas según su cartel y la ficha oficial de turismo.

## Versión premium

`santa-creu-anuncio-premium.mp4` (30 s): estilo basado solo en casaruralsantacreu.com (marrón oscuro, dorado de la marca, serif del logo con Playfair Display, Poppins de la web, los cuatro soles dorados). Fuente: `premium.html`; música de piano: `music_premium.py`. Grabar con `node record.mjs --page premium.html --out frames`.
