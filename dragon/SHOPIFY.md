# La web y Shopify

## Ya está hecho
- **Tienda:** `thelongdragon.com` (dominio principal; la dirección de Shopify es `t5hfva-w3.myshopify.com`), en periodo de prueba.
- **Tus datos:** el titular, el NIF y el correo están solo en la copia de `datos.js` del tema de la tienda, no en este repositorio, que es público. `tools/tema.py` los toma de `shopify/datos-privados.json`, que no se sube a GitHub.
- **Producto:** «LÓNG · Dragón articulado 88 cm», activo y publicado en la tienda online. Su handle es `long-dragon-articulado-88-cm`. Tiene 8 variantes: Arcoíris, Galaxia, Plata y Fuego, cada una con 1 dragón (21,95 €) o 2 dragones (32,95 €), y coste de 10,50 € por dragón. No controla inventario, como corresponde a un dropshipping.
- **La web:** `js/datos.js` tiene la tienda y el ID de cada variante. «Comprar el dragón» lleva directo al pago con el color y la cantidad elegidos, y añade al pedido las dos aceptaciones con su versión, fecha y hora.
- **Envíos:** gratis para la España peninsular y Baleares, con entrega en 7 a 12 días laborables. Canarias, Ceuta y Melilla quedan fuera, como dicen las condiciones.
- **Impuestos:** los precios llevan el IVA incluido.
- **La web dentro de Shopify:** el tema «LÓNG · web del dragón» es la misma web convertida en tema de Shopify (`tools/tema.py` lo genera en `shopify/tema/` y `shopify/long-tema.zip`). Está subido a tu tienda, sin publicar. Con él, tu tienda de Shopify es la web del dragón: la portada en 3D, el carrito y el pago en el mismo dominio.
- **Páginas legales en la tienda:** `/pages/aviso-legal`, `/pages/condiciones`, `/pages/envios`, `/pages/devoluciones`, `/pages/privacidad`, `/pages/cookies`, `/pages/seguridad` y `/pages/desistimiento` (el botón «Desistir del contrato aquí»).

## Lo que falta, y solo puedes hacerlo tú en Shopify
0. **Publicar el tema:** Tienda online > Temas > «LÓNG · web del dragón» > «⋯» > Publicar. Antes puedes verlo con «Vista previa». Si cambias la web, ejecuta `python3 tools/tema.py` y vuelve a subirlo (o pídemelo).
1. **Elegir un plan y quitar la contraseña de la tienda.** Mientras la tienda esté en prueba y con contraseña, el botón de compra lleva a la página de contraseña.
2. **Pegar las políticas.** El conector no tiene permiso para escribirlas. En Configuración > Políticas, pega cada texto en su sitio (copia el texto de la página de la web, sin el menú ni el pie):

   | Página de la web | En Shopify |
   |---|---|
   | `legal/devoluciones.html` | Política de reembolso |
   | `legal/privacidad.html` | Política de privacidad |
   | `legal/condiciones.html` | Términos del servicio |
   | `legal/envios.html` | Política de envío |
   | `legal/aviso-legal.html` | Aviso legal |

   En «Información de contacto», pon tu nombre o razón social, tu NIF, tu domicilio y tu correo. Las versiones en HTML están en `shopify/politicas/`. Antes, rellena tus datos en `js/datos.js` y ejecuta `python3 tools/legal.py`, o pásamelos y lo hago yo.
3. **Fotos del producto.** Súbelas en la ficha. Antes, mira el punto 8 de `LEGAL.md` sobre sus derechos. Rellena también en la descripción el fabricante, el responsable en la UE y la referencia.
4. **Ajustes de la página de pago** (Configuración > Pantalla de pago): el nombre de empresa, «No incluir»; el teléfono, «Opcional»; y la casilla de marketing por correo nunca marcada de antemano.
5. **Aviso de cookies de Shopify** (Configuración > Privacidad del cliente): actívalo para la UE.
6. **Correo de confirmación del pedido** (Configuración > Notificaciones): añade al final los enlaces a las condiciones de venta y a «Desistir del contrato aquí».
