# LÓNG: web del dragón de cristal articulado

Web de producto para el dragón articulado impreso en 3D de AliExpress ([88 cm, brilla en la oscuridad](https://es.aliexpress.com/item/3256809994598459.html)), con Hong Kong de noche en 3D de fondo. HTML, CSS y JS sin compilar: ábrela con un servidor local (`npx http-server .`).

## Qué hay
- **Pantalla inicial:** el carácter 龍 se dibuja con trazo rojo, cuenta hasta 100 y la escena se abre en dos mientras la cámara baja sobre la bahía.
- **Fondo:** la foto de la bahía Victoria (`img/hongkong.jpg`, ampliada a 3000 px con Lanczos y enfoque) convertida en escena viva por un shader (`js/photo.js`): parallax por profundidad con el ratón, agua que ondula con reflejos de neón que destellan, focos que barren el cielo, bruma sobre las nubes, ventanas que parpadean, zoom suave con el scroll y apagado total en la sección del brillo. `buildCity` en `js/scene.js` conserva la ciudad procedural anterior, sin usar.
- **El dragón (`js/dragon.js`):** un cuerpo continuo de serpiente reconstruido cada fotograma sobre su columna, con escamas en relieve, vientre dorado, crestas, melena, cabeza esculpida con mandíbula y dientes, cuernos de ciervo, bigotes que arrastran con inercia y cuatro patas de cinco garras. En la portada el cursor es la **perla de fuego**: el dragón nada en círculos a su alrededor con un giro limitado y simulación a paso fijo, así que se mueve fluido y sin tirones.
- **Scroll (GSAP ScrollTrigger, `js/main.js`):** en cada sección el dragón cambia de pose (estirado con regla de 88 cm, en espiral, en S) y gira siguiendo el ratón.
- **Brilla en la oscuridad:** al llegar a esa sección, o con el botón, Hong Kong se apaga y el dragón brilla en verde.
- **Colores:** Aurora, Jade, Rubí y Obsidiana recolorean el dragón en vivo.
- **Compra:** como en Uprain, rellena `SHOPIFY.store` y los IDs de variante (color × cantidad) en `js/main.js` y el botón lleva al checkout de Shopify. Sin eso, usa un `mailto:` de ejemplo.

## Pendiente antes de publicar
- **Derechos de la foto:** confirma que la foto de Hong Kong se puede usar comercialmente (si es de un banco de imágenes, revisa su licencia).
- **Precios supuestos:** 39,95 € y 69,95 € (marcados con `data-assumed`). El proveedor cuesta unos 5-15 € según la oferta.
- **Material y plazos:** confírmalos con la ficha del proveedor. Los colores ofrecidos deben coincidir con las variantes que tenga.
- **Marca LÓNG:** compruébala en la OEPM y la EUIPO y compra el dominio. El correo `@long.example` es de ejemplo.
- **Fotos o vídeos reales:** añade algunos del producto cuando tengas la muestra.

`tools/shoot.cjs` hace capturas de cada sección: `node tools/shoot.cjs capturas 1440 900`.
