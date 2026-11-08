# LÓNG: web del dragón de cristal articulado

Web de producto para el dragón articulado impreso en 3D de AliExpress ([88 cm, brilla en la oscuridad](https://es.aliexpress.com/item/3256809994598459.html)), con Hong Kong de noche en 3D de fondo. HTML, CSS y JS sin compilar: ábrela con un servidor local (`npx http-server .`).

## Qué hay
- **Pantalla inicial:** el carácter 龍 se dibuja con trazo rojo, cuenta hasta 100 y la escena se abre en dos mientras la cámara baja sobre la bahía.
- **Fondo:** Hong Kong de noche hecho en three.js (`js/scene.js`): 900 rascacielos con ventanas encendidas, letreros de neón verticales en chino tradicional, la bahía con reflejos, el Peak detrás, niebla que funde la ciudad, bruma a la deriva y farolillos rojos.
- **El dragón:** cuerpo de 34 piezas facetadas de cristal iridiscente, cuernos dorados, bigotes que ondean, melena y garras. En la portada el cursor es la **perla de fuego** y el dragón la persigue, como en la tradición china.
- **Scroll (GSAP ScrollTrigger, `js/main.js`):** en cada sección el dragón cambia de pose (estirado con regla de 88 cm, en espiral, en S) y gira siguiendo el ratón.
- **Brilla en la oscuridad:** al llegar a esa sección, o con el botón, Hong Kong se apaga y el dragón brilla en verde.
- **Colores:** Aurora, Jade, Rubí y Obsidiana recolorean el dragón en vivo.
- **Compra:** como en Uprain, rellena `SHOPIFY.store` y los IDs de variante (color × cantidad) en `js/main.js` y el botón lleva al checkout de Shopify. Sin eso, usa un `mailto:` de ejemplo.

## Pendiente antes de publicar
- **Precios supuestos:** 39,95 € y 69,95 € (marcados con `data-assumed`). El proveedor cuesta unos 5-15 € según la oferta.
- **Material y plazos:** confírmalos con la ficha del proveedor. Los colores ofrecidos deben coincidir con las variantes que tenga.
- **Marca LÓNG:** compruébala en la OEPM y la EUIPO y compra el dominio. El correo `@long.example` es de ejemplo.
- **Fotos o vídeos reales:** añade algunos del producto cuando tengas la muestra.

`tools/shoot.cjs` hace capturas de cada sección: `node tools/shoot.cjs capturas 1440 900`.
