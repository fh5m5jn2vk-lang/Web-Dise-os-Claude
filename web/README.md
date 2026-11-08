# Rubra: web de la mascarilla LED

Web estática (HTML, CSS y JS sin compilar). Abre `index.html` a través de un servidor local, por ejemplo `npx http-server .` (los módulos JS no cargan desde `file://`).

- `index.html`: la página.
- `js/mask3d.js`: los modelos 3D de las dos mascarillas (three.js), usados en la portada en vivo y para generar las imágenes.
- `js/hero.js`: la entrada 3D de la portada (la mascarilla gira y los LED se encienden del centro hacia fuera).
- `js/pedido.js`: cambia la imagen al elegir mascarilla en el pedido.
- `img/`: imágenes renderizadas desde el modelo 3D, más una foto de Wikimedia Commons (créditos en `credits.html`).
- `render.html` + `tools/still.mjs`: regeneran las imágenes, por ejemplo `node tools/still.mjs img/gama-facial.webp "view=front&bg=151515" 1000 1000`.
- `vendor/three/`: three.js 0.170.0.

Pendiente antes de publicar: precios, especificaciones y envío marcados con `data-assumed` en el HTML, la pasarela de pago (el formulario usa un `mailto:` de ejemplo en `rubra.example`), los textos legales y fotos reales del producto.
