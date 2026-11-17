# Datos dibujados: Shorts de datos curiosos en 2D

Cinco Shorts de datos aleatorios, cada uno dibujado con una técnica distinta. Están hechos con el mismo motor de dibujo que los últimos vídeos de LÓNG, pero sin marca ni producto.

| Vídeo | Dato | Técnica |
|---|---|---|
| `d1-cleopatra` | Cleopatra vivió más cerca del iPhone que de las pirámides | Pizarra blanca: una mano con rotulador dibuja la línea del tiempo |
| `d2-venus` | En Venus un día dura más que un año | Pizarra de tiza: el planeta gira y otra Venus recorre la órbita |
| `d3-tiburones` | Los tiburones son más antiguos que los árboles | Dibujos animados planos: mar, orilla, meteorito y bosque |
| `d4-folio` | Si doblas un folio 42 veces, llega a la Luna | Pixel art de videojuego, con marcador de dobleces y grosor |
| `d5-columna` | Ahora mismo eres más bajo que esta mañana | Papel recortado en stop-motion (12 pasos por segundo) |

Salen en `../videos-dibujados/` (MP4 + portada) y las fichas de subida en `../videos-dibujados/FICHAS.md`.

## Cómo se hace uno

1. Crea la carpeta `d6-loquesea/` con `guion.json` (frases con su etiqueta de emoción: `[excited]`, `[curious]`, `[amazed]`, `[whispers]`, `[laughs]`). `{1889|mil ochocientos ochenta y nueve}` se ve como cifra y se dice en palabras.
2. Copia `plantilla.html` como `index.html` y escribe `main.js` partiendo del vídeo cuya técnica quieras:
   - mano que dibuja: `d1` (pizarra blanca) o `d2` (tiza); `pizarra('cuaderno')`, `'boceto'` o `'arroz'` dan cuaderno con boli, lápiz o pincel;
   - dibujos animados planos: `d3`;
   - pixel art: `d4`;
   - papel recortado: `d5`.
3. `./hacer.sh d6-loquesea`: genera la voz, el movimiento de la boca, la grabación, el sonido y el MP4.

Para ver un vídeo mientras lo escribes: sirve esta carpeta (`npx http-server .`) y abre `d1-cleopatra/index.html`. Para sacar fotos de control: `node grabar.mjs d1-cleopatra --at 0,3,8`.

## Piezas

- `kit/dibujo.js`: el motor de dibujo, con la pizarra, la cámara, los trazos animados (GSAP DrawSVGPlugin), la mano que sigue la punta, el texto escrito letra a letra (opentype.js) y el coloreado a rayas. `kit/mano.js` contiene la mano y sus herramientas, y `kit/garabatos.js` flechas, círculos, nubes y tachones.
- `kit/capas.js`: subtítulos palabra a palabra, pegatinas y marcas de sonido. `kit/titere.js` es el muñeco 2D (vector, papel o trazo).
- `voz.py`: voz de ElevenLabs con tiempos por palabra; recorta los silencios largos como cortes de montaje. Guarda la respuesta en caché, así que repetir un vídeo no gasta créditos.
- `mezcla.py`: efectos sintetizados (rotulador, tiza, papel, golpes, blips) colocados donde los marca la animación.
- Fuentes OFL y Apache (Permanent Marker, Caveat, Kalam, Schoolbell, Press Start 2P, Bungee, Poppins, Anton, Inter). GSAP 3.15 con su licencia estándar gratuita y opentype.js con licencia MIT, en `vendor/`.
