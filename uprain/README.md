# Uprain: web del humidificador antigravedad

Web estática de producto (HTML, CSS y JS sin compilar) pensada para una tienda Shopify de dropshipping. Ábrela con un servidor local, por ejemplo `npx http-server .`, porque los módulos JS no cargan desde `file://`.

## Qué hay

- `index.html`: la página.
- `js/uprain3d.js`: el humidificador en 3D (three.js): base, arco de acero, boquilla con anillo de luz, gotas y vapor. Lo usan la portada en vivo, la demo y las imágenes.
- `js/hero.js`: la portada. El producto entra desde la oscuridad, se enciende la luz y las gotas empiezan a subir. Se puede girar arrastrando.
- `js/efecto.js`: la demo interactiva de «Cómo suben las gotas» (interruptor de la luz estroboscópica y control del ritmo).
- `js/tienda.js`: los selectores de color de luz y de acabado, y el envío del pedido a Shopify.
- `img/`: imágenes renderizadas desde el modelo 3D. Se regeneran con `render.html` y `tools/still.mjs`, por ejemplo `node tools/still.mjs img/luz-ambar.webp "view=three&light=ambar&fill=0.9&yaw=-0.35" 2400 1000`.
- `vendor/three/`: three.js 0.170.0.
- `privacidad.html` y `condiciones.html`: textos legales básicos.

## Conectarla a Shopify

1. Crea el producto en Shopify con dos opciones: Acabado (Grafito, Arena) y Cantidad (1 humidificador, Pack regalo, 2 humidificadores). Así tendrás 6 variantes.
2. Copia el ID de cada variante (en el admin, al abrir la variante, es el número final de la URL).
3. En `js/tienda.js`, rellena `SHOPIFY.store` con tu dominio (`tutienda.myshopify.com`) y los 6 IDs.
4. El botón «Comprar Uprain» llevará al cliente directo al checkout de Shopify con la variante elegida (enlace de carrito `/cart/<id>:1`).

Puedes servir esta web como página de aterrizaje propia (Netlify, Vercel o cualquier hosting estático) y dejar que Shopify cobre, o pasarla a una plantilla de tu tema: copia el contenido de `<main>` a una sección «Liquid personalizado» y sube `assets/`, `js/`, `vendor/` e `img/` a los archivos del tema.

## Pendiente antes de publicar

- Precios, medidas, depósito, ruido, plazos de envío y contenido de la caja están marcados con `data-assumed` en el HTML. Ajústalos a la ficha real del producto de tu proveedor.
- Las imágenes son del modelo 3D, no del producto real: sustitúyelas por fotos de la muestra cuando la recibas (sobre todo `pedido-*.webp`).
- El correo `@uprain.example` es de ejemplo. Pon el tuyo.
- Revisa la marca Uprain en la OEPM y la EUIPO, y compra el dominio.
- Marcado CE, información del fabricante y responsable en la UE (GPSR): pídelo a tu proveedor y añádelo a la ficha.
