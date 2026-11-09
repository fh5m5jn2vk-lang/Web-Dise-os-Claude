# LÓNG: web del dragón articulado

Web de producto para el dragón articulado impreso en 3D de AliExpress ([88 cm, brilla en la oscuridad](https://es.aliexpress.com/item/3256809994598459.html)), con Hong Kong de noche en 3D de fondo. HTML, CSS y JS sin compilar: ábrela con un servidor local (`npx http-server .`).

## Qué hay
- **Pantalla inicial:** el carácter 龍 se dibuja en dorado y se rellena de tinta roja mientras cuenta hasta 100; después espera a que deslices (rueda, dedo, teclado o clic en «Desliza para entrar»). Al deslizar, las letras se separan, el carácter se acerca y se disuelve, la pantalla se abre en dos y entra la tienda.
- **Fondo:** la foto de la bahía Victoria (`img/hongkong.jpg`, ampliada a 3000 px con Lanczos y enfoque) convertida en escena viva por un shader (`js/photo.js`): parallax por profundidad con el ratón, agua que ondula con reflejos de neón que destellan, focos que barren el cielo, bruma sobre las nubes, ventanas que parpadean, zoom suave con el scroll y apagado total en la sección del brillo. `buildCity` en `js/scene.js` conserva la ciudad procedural anterior, sin usar.
- **El dragón (`js/dragon.js`):** un cuerpo continuo de serpiente reconstruido cada fotograma sobre su columna, con escamas en relieve, vientre dorado, crestas, melena, cabeza esculpida con mandíbula y dientes, cuernos de ciervo, bigotes que arrastran con inercia y cuatro patas de cinco garras. En la portada el cursor es la **perla de fuego**: el dragón nada en círculos a su alrededor con un giro limitado y simulación a paso fijo, así que se mueve fluido y sin tirones.
- **Scroll (GSAP ScrollTrigger, `js/main.js`):** en cada sección el dragón cambia de pose (estirado con regla de 88 cm, en espiral, en S) y gira siguiendo el ratón.
- **Brilla en la oscuridad:** al llegar a esa sección, o con el botón, Hong Kong se apaga y el dragón brilla en verde.
- **Colores:** Arcoíris, Galaxia, Plata y Fuego, como el filamento seda de los dragones del proveedor, recolorean el dragón en vivo.
- **Compra:** el formulario pide dos casillas separadas (condiciones de venta y privacidad) y lleva al pago de Shopify con el color y la cantidad elegidos. La aceptación, con su versión, fecha y hora, queda guardada en el pedido. La tienda y los IDs de variante van en `js/datos.js`; los pasos están en `SHOPIFY.md`.
- **Legal:** aviso legal, condiciones de venta, envíos, devoluciones y garantía, privacidad, cookies, seguridad del producto y el botón «Desistir del contrato aquí», en `legal/`. Se generan desde `legal/_src/` con `python3 tools/legal.py`, que también escribe las políticas para Shopify en `shopify/politicas/`. Tus datos (titular, NIF, domicilio, correo…) se escriben una sola vez en `js/datos.js`. Qué está hecho y qué te falta: `LEGAL.md`.
- **Sin terceros:** las fuentes (`fonts/`) y es-module-shims (`vendor/`) se sirven desde la propia web. La web no usa cookies; `js/cookies.js` muestra el aviso solo si algún día añades un píxel.

## Pendiente antes de publicar
- **Tus datos:** rellena `js/datos.js` y ejecuta `python3 tools/legal.py`.
- **Shopify:** el producto ya está creado y conectado. Falta elegir un plan, quitar la contraseña de la tienda y pegar las políticas (ver `SHOPIFY.md`).
- **Derechos de las imágenes, plazos y seguridad del producto:** ver `LEGAL.md`.
- **Marca LÓNG:** compruébala en la OEPM y la EUIPO y compra el dominio.
- **Fotos o vídeos reales:** añade algunos del producto cuando tengas la muestra.

`tools/shoot.cjs` hace capturas de cada sección: `node tools/shoot.cjs capturas 1440 900`.
