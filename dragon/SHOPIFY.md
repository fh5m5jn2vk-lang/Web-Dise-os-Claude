# Conectar la web con Shopify

La forma rápida: vuelve a conectar el conector de Shopify en claude.ai (Ajustes, Conectores) y dímelo. Yo creo el producto y las variantes, rellena los IDs en `js/datos.js` y sube las políticas.

Si prefieres hacerlo a mano, son estos pasos:

## 1. El producto
1. En Shopify: **Productos > Importar** y sube `shopify/producto.csv`. Crea «LÓNG · Dragón articulado 88 cm» como borrador, con 8 variantes (4 colores × 1 o 2 dragones), 21,95 € y 32,95 €, y el coste de 10,50 € por dragón.
2. Añade las fotos. Antes, mira el punto 8 de `LEGAL.md` sobre sus derechos.
3. Rellena en la descripción el fabricante, el responsable en la UE y la referencia, y publica el producto.

## 2. Los IDs para la web
1. Abre `https://TU-TIENDA.myshopify.com/products/dragon-articulado-long.json` en el navegador. Cada variante tiene un `"id"`.
2. Ponlos en `js/datos.js`, en `shopify.variantes`, junto con `shopify.tienda`. Por ejemplo: `arcoiris: { uno: '4512345678901', dos: '4512345678902' }`.

Con eso, «Comprar el dragón» lleva directo al pago con el color y la cantidad elegidos, y la aceptación de las dos casillas queda guardada en el pedido. Si solo pones la tienda, sin los IDs, el botón abre la ficha del producto.

## 3. Políticas
En **Configuración > Políticas**, pega cada archivo de `shopify/politicas/` en su sitio:

| Archivo | En Shopify |
|---|---|
| `REFUND_POLICY.html` | Política de reembolso |
| `PRIVACY_POLICY.html` | Política de privacidad |
| `TERMS_OF_SERVICE.html` | Términos del servicio |
| `SHIPPING_POLICY.html` | Política de envío |
| `LEGAL_NOTICE.html` | Aviso legal |
| `CONTACT_INFORMATION.html` | Información de contacto |

Antes, rellena tus datos en `js/datos.js` y ejecuta `python3 tools/legal.py`, para que los archivos ya los lleven.

## 4. Ajustes que pide la ley
- **Configuración > Pantalla de pago:** el nombre de empresa, «No incluir»; la línea 2 de la dirección, «Opcional»; el teléfono, «Opcional». La casilla de marketing por correo puede aparecer, pero **nunca marcada de antemano**.
- **Configuración > Privacidad del cliente:** activa el aviso de cookies para la UE.
- **Configuración > Impuestos:** España, con los precios con IVA incluido.
- **Configuración > Envío:** gratis para la España peninsular y Baleares. Quita Canarias, Ceuta y Melilla, como dicen las condiciones.
- **Configuración > Notificaciones > Confirmación del pedido:** añade al final los enlaces a las condiciones de venta y a «Desistir del contrato aquí». La ley pide que el cliente reciba la confirmación con la información del contrato en un soporte duradero, y el correo lo es.
- **Configuración > Idiomas y Mercados:** español y solo España.
