# Uprain: 4 vídeos para TikTok, Reels y Facebook

Vídeos verticales 1080×1920 a 30 fps, en `out/`:

| Vídeo | Duración | Idea | Sonido |
|---|---|---|---|
| `uprain-1-reaccion-en-cadena.mp4` | 24,3 s | Cortometraje de una sola toma en la oscuridad: una gota cae a cámara lenta sobre unas fichas de dominó de cristal, una bola rueda hasta un péndulo de Newton y una canica pulsa el botón del humidificador. Se enciende, las gotas suben y llega el amanecer. Los momentos clave van con las subidas del sonido. | El sonido del vídeo de referencia (`audio/referencia.wav`), cortado antes del logo de TikTok |
| `uprain-2-cuatro-colores.mp4` | 21 s | Un corte y un color nuevo cada dos compases: hielo, ámbar, cobalto y menta, cada uno con su movimiento de cámara. | `audio/colores.wav`, house a 120 BPM |
| `uprain-3-el-truco.mp4` | 20 s | Cómo suben las gotas: con la luz apagada caen, con la luz al ritmo del agua se congelan en el aire (cámara girando alrededor) y con la luz más rápida suben. | `audio/truco.wav`, tic-tac que se para y explota |
| `uprain-4-el-regalo.mp4` | 20 s | Acabado arena con luz ámbar, bokeh cálido, «para Navidad, para Reyes», cuatro datos en fichas de cristal y el pack regalo con su precio. | `audio/regalo.wav`, lo-fi de piano |

Los textos van en la parte de arriba, fuera de la zona inferior y lateral donde TikTok, Reels y Facebook ponen su interfaz.

## Cómo se hacen

- `film.html?v=1` (a `4`): la animación. Usa el modelo 3D de la web (`../uprain/js/uprain3d.js`) con suelo reflectante, cámara por fotogramas clave y textos animados. Para verla en bucle, sirve la carpeta del repositorio (`npx http-server ..`) y abre `video-uprain/film.html?v=1`.
- `js/film.js`: el motor. `js/v1.js` a `js/v4.js`: cada vídeo.
- `record.mjs`: graba los fotogramas, por ejemplo `node record.mjs --v 2` (deja `frames/v2/`).
- `audio/music.py`: compone la música de los vídeos 2, 3 y 4 desde cero (`python3 music.py`), sin derechos de terceros.
- Montaje: `ffmpeg -framerate 30 -i frames/v2/f%05d.jpg -i audio/colores.wav -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest out/uprain-2-cuatro-colores.mp4`

## Antes de publicar

- El vídeo 1 lleva un sonido sacado de un vídeo de otra persona en TikTok. Para un post orgánico en TikTok lo más seguro es quitarle el audio y elegir ese mismo sonido en la app. Para anuncios pagados en Meta o TikTok usa la versión con música propia o un sonido de la biblioteca comercial.
- Precio (44,95 € y 49,95 € el pack), depósito de 800 ml, 8 horas, menos de 36 dB y envío en 24-72 h son los datos supuestos de la web. Cámbialos en `js/v*.js` si tu proveedor da otros.
- El humidificador es el modelo 3D, no el producto real: cuando tengas la muestra, combina estos vídeos con tomas reales grabadas con el móvil.
