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
