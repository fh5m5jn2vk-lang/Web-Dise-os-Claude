# Seis vídeos para LÓNG

Seis vídeos verticales (1080×1920) para TikTok, Reels y Shorts. Cada uno tiene su propio concepto, entorno, voz, música y estilo de subtítulos. Lo único que comparten es el objetivo: que quien lo vea quiera el dragón. Todos llevan:
- un gancho en el primer segundo;
- un guion;
- voz y subtítulos;
- un banner de venta al final (21,95 €, 2 por 32,95 €, «link en mi perfil»).

| # | Vídeo | Concepto y entorno | Voz | Música (Mixkit, licencia gratuita) |
|---|---|---|---|---|
| 1 | `v1-ui` | Una sola forma de interfaz que muta sin cortes al ritmo (botón → isla dinámica «LÓNG 龍» → reproductor con el dragón → tamaño → modo noche → colores → gráfica → ⌘K → carrito → tarjeta de venta). Gris cálido, blanco y negro + rojo. 60 fps con desenfoque de movimiento; el último fotograma es el primero. | Creador (em_alex) | «Techno Fest Vibes» (EDM), ajustada a 123 BPM |
| 2 | `v2-leyenda` | 2D en tinta china: una gota cae y florece en un paisaje a la aguada; el dragón de pinceladas vive en un cuadro de un templo; el papel se rasga y aparece el real; regla de 88 cm; noche y brillo jade; papel rojo con medallón dorado; pergamino con la oferta. | Narrador grave (em_alex) | «Secret Garden» (banda sonora) |
| 3 | `v3-chat` | Chat de grupo la noche antes del amigo invisible: notificaciones, notas de voz transcritas, el vídeo del dragón en el chat que se abre en un edit a pantalla completa, el precio, «pásame el link» y la ficha del producto. | Tres voces (em_alex, ef_dora, em_santa) | «Sweet September» (lo-fi) + «Need for Speed» (trap) en el edit |
| 4 | `v4-top3` | Película de producto de lujo: estudio negro, suelo que refleja, luz que barre, polvo en el haz, números 3-2-1 y precio en dorado. | Tráiler (em_alex, grave) | «Games Music» (tráiler) |
| 5 | `v5-concurso` | Concurso de televisión «¿Cuánto cuesta?»: pantalla LED, focos, bombillas, el dragón en un pedestal giratorio, opciones A/B/C, cuenta atrás, confeti y aplausos. | Presentador de TV (em_santa) | «Light it Up Boy» (funk) |
| 6 | `v6-asmr` | ASMR de noche: dormitorio con lluvia en la ventana, mesita de nogal, lámpara cálida; el dragón se enrosca y sus piezas hacen clic; se apaga la luz y brilla. | Susurro real (ef_dora) | «Serene View» + lluvia |

## Cómo se hace
```bash
python3 seis/voz.py seis/<vídeo>        # voz.wav y tiempos.json (Kokoro + tiempos de cada palabra con faster-whisper)
./seis/montar.sh <vídeo> [fps] [subfotogramas]   # render, mezcla (voz + música + efectos) y MP4 en out/long-<vídeo>.mp4 y -movil.mp4
./seis/cola.sh &                        # cola de render: una línea «<vídeo> 30 1» por vídeo en seis/cola.txt
```
- **Música:** las pistas no se guardan en el repositorio (la licencia no permite redistribuirlas sueltas). Se descargan de `https://assets.mixkit.co/music/<id>/<id>.mp3` a `seis/musica/`. Ids usados: 124, 595, 282, 369, 706, 849 y 443. Para el vídeo 1, la pista 124 se ajusta a 123 BPM con `atempo` y se guarda como `124-123bpm.wav`.
- **Voces:** Kokoro-82M (Apache 2.0) con kokoro-onnx; el modelo se descarga de las *releases* de `thewh1teagle/kokoro-onnx`. No imitan a ninguna persona real.
- **Fotos:** las dos fotos del producto que me pasaste (`../img/`); son del proveedor de AliExpress.
- **Madera:** escaneo de Poly Haven (CC0).

# Segunda tanda: retención primero

En el vídeo de la leyenda, la gente aguantaba unos 5 segundos: el gancho funcionaba, pero lo de después iba despacio. Estos vídeos aplican lo contrario:

- **El primer segundo abre una pregunta y el final la contesta.** Ejemplos: «¡Espera a que apague la luz!», tres datos bloqueados que se abren uno a uno, «desliza si te lo pillarías», «¿no sabes qué regalar?». Cada uno termina cumpliendo lo prometido: el brillo, el número 1, el match o la caja abierta.
- **Sin tiempo muerto.** La voz empieza a los 0,05 s. Las pausas dentro de cada frase se recortan a 0,1 s, como haría un editor con cortes de salto, y entre frases quedan unos 0,05 s.
- **Algo cambia cada 1-2 segundos:** un corte, una pegatina, una cuenta atrás o un cambio de color.
- **Subtítulos grandes, palabra a palabra**, con la palabra que se dice marcada, para quien lo ve sin sonido.
- **Cortos: de 12 a 16 s.** El cierre dura unos 2 s, para que el vídeo entre en bucle.
- **Voz con emoción.** Se usa ElevenLabs `eleven_v3` con tu voz VelionF y una etiqueta por frase (`[excited]`, `[whispers]`, `[amazed]`). La etiqueta solo va a la voz, nunca a los subtítulos.
- **Nada inventado.** No hay reseñas, cifras de ventas ni escasez falsas. La urgencia del regalo es real: la entrega tarda de 7 a 12 días laborables.

| # | Vídeo | Contexto | Formato | Música |
|---|---|---|---|---|
| 7 | `v7-movil` | El presentador explica la pantalla del móvil y las cosas salen de ella | 3D + 2D | sí (744) |
| 8 | `v8-ensena` | El presentador lo sostiene: cuelga y se balancea con física, se lo enrosca como pulsera y el Luminoso le ilumina la cara | 3D | **no** (la pones tú) |
| 9 | `v9-cuarto` | «Lo que le hace falta a tu cuarto»: plano épico de noche | 3D | **sin sonido** |
| 10 | `v10-luz` | Dormitorio: «¡Espera a que apague la luz!», 3-2-1 y brilla | 3D | 443 |
| 11 | `v11-tres` | Estudio oscuro: «3 cosas que no sabías», bloqueadas hasta que se dicen | 3D | 124 |
| 12 | `v12-desliza` | App de tarjetas propia: «¡Desliza si te lo pillarías!» con las fotos reales | **2D** | 369 |
| 13 | `v13-regalo` | Regalo de Navidad: la caja se abre y el dragón sube en espiral | 3D | 849 |
| 14 | `v14-comic` | Cómic: «Mi cuarto era un aburrimiento… ¡hasta que llegó él!» | **2D** | 706 |
| 15 | `v15-gamer` | Setup gamer: el dragón cambia de color con las luces RGB | 3D | 744 |

- Cada vídeo con música sale también en `out/long-<vídeo>-sin-musica.mp4`, por si prefieres un sonido de TikTok.
- `kit/` es la base común de los vídeos 10 a 15:
  - `kit.js`: escena 3D con 4 decorados (estudio, cuarto, regalo y setup gamer) y poses del dragón;
  - `capas.js`: subtítulos, gancho, pegatinas, barra de progreso, cierre y efectos de sonido.

  Cada vídeo solo escribe su plan.

# Tercera tanda: el formato del presentador

El vídeo que mejor ha funcionado es el 8: una persona enseña el dragón, solo con voz y sin música, para que tú le pongas el sonido de TikTok. Estos seis siguen ese formato:
- un personaje habla a cámara y enseña el dragón;
- voz y efectos, **sin música**;
- cada uno con un estilo de animación y un contexto distintos;
- terminan con **una foto real del dragón** («Así es el de verdad. Link en mi perfil.»), con un color distinto en cada vídeo.

Técnicas de retención que comparten:
- el dragón sale en el primer segundo;
- la primera frase deja una pregunta abierta y el final la responde con la foto real;
- algo cambia cada 1-2 segundos (un corte, una pegatina, un dato que se desbloquea);
- una reacción con emoción (risa, susurro) para que no suene leído;
- subtítulos palabra a palabra para quien lo ve sin sonido;
- entre 11 y 14 segundos.

| # | Vídeo | Gancho | Estilo |
|---|---|---|---|
| 16 | `v16-pov` | «¡Me ha llegado esto y mira lo que hace!»: en primera persona, tus manos lo sacan de la caja, te lo pones de pulsera y apagas la lámpara | 3D en primera persona |
| 17 | `v17-llamada` | «¡Tío, cógelo!»: un amigo te videollama para enseñártelo, pasa por los 8 colores y se queda con el oro y rojo | 3D, interfaz de videollamada |
| 18 | `v18-madre` | «Mi madre: "otro trasto no". Yo:»: en la cocina se lo enseña a su madre y al final se lo queda ella | 2D, dibujos animados planos |
| 19 | `v19-pixel` | «Llevaba años buscando este objeto legendario…»: RPG de mazmorra, «¡objeto legendario!», estadísticas y LEVEL UP | 2D, pixel art |
| 20 | `v20-papel` | «¿Sabes qué es lo que más me preguntan?»: stop-motion de papel recortado sobre una plancha de corte | 2D, papel a 12 fps |
| 21 | `v21-pizarra` | «Te explico este dragón en diez segundos»: cuenta atrás dibujada en una pizarra y cuatro datos escritos a mano | 2D, rotulador |

Notas:
- Los vídeos 2D usan el dragón 3D convertido en *sprites* (`kit/sprites.mjs` → `sprites/`, sin guardar en el repositorio) y el muñeco SVG `kit/titere.js`, que tiene brazos con cinemática inversa y tres estilos: vector, papel y trazo.
- La fuente pixel es Press Start 2P (OFL). Encoge las mayúsculas con tilde a la altura de una minúscula, así que en v19 la tilde de «DRAGÓN» y «ASÍ» se dibuja aparte.
- `montar.sh <vídeo> 30 1 <segundo>` vuelve a renderizar solo desde ese segundo y conserva los fotogramas anteriores. Conviene empezar en un corte de plano, porque la física se reinicia ahí.
