# Lo legal de la web, punto por punto

El vídeo era de un abogado colombiano, así que aquí está adaptado a España y a la UE: LSSI, RGPD y LOPDGDD, ley de consumidores (TRLGDCU) y Reglamento 2023/988 de seguridad de los productos. No sustituye a un abogado o una gestoría: revisadlo juntos antes de vender.

## Los 9 puntos del vídeo

| # | Punto del vídeo | En la web | Te falta |
|---|---|---|---|
| 1 | Términos y condiciones | `legal/condiciones.html`, más el aviso legal de la LSSI (`legal/aviso-legal.html`), que en España es obligatorio. | Rellenar tus datos en `js/datos.js`. |
| 2 | Política de privacidad | `legal/privacidad.html`: responsable, datos, finalidades, bases legales, plazos, destinatarios, transferencias fuera de la UE (el proveedor de China y Shopify) y derechos. | Lo mismo. |
| 3 | Política de cookies y saber si hace falta consentimiento | `legal/cookies.html`. **Hoy no hace falta aviso:** la web no usa cookies de analítica ni de publicidad, y ya no carga nada de Google Fonts ni de otros servidores (las fuentes y el resto se sirven desde la propia web). `js/cookies.js` está listo: si añades un píxel de TikTok o de Meta, el aviso aparece solo, con «Rechazar» igual de visible que «Aceptar», y el píxel no se carga hasta que el visitante acepta. | Si añades un píxel, ponlo en `PIXELES` dentro de `js/cookies.js`, nunca directamente en el HTML. |
| 4 | Dos casillas separadas, cada una con su enlace | En el formulario de compra: «He leído y acepto las condiciones de venta» y «He leído la política de privacidad». Están separadas, sin marcar y con enlace a cada texto, y no se puede comprar sin marcarlas. El formulario de desistimiento tiene la de privacidad. | Nada. |
| 5 | Registro de cuándo y cómo se aceptó | Al pulsar «Comprar», la aceptación viaja dentro del pedido de Shopify como atributo: qué se aceptó, qué versión de los textos, la fecha y la hora exactas, y cómo («dos casillas separadas, sin marcar por defecto»). Lo verás en cada pedido, en «Detalles adicionales». | Cada vez que cambies un texto legal, sube `version` y `fecha` en `js/datos.js` y guarda una copia de la versión anterior (por ejemplo, en `legal/archivo/`). |
| 6 | Política de reembolsos | `legal/devoluciones.html`: desistimiento de 14 días, modelo oficial de formulario, reembolso en 14 días y garantía legal de 3 años. Además, `legal/desistimiento.html` es el botón «Desistir del contrato aquí» que exige la Directiva 2023/2673 desde el 19 de junio de 2026, y está en el pie de todas las páginas. | Decidir quién paga la devolución (ahora lo paga el cliente; si lo pagas tú, cámbialo en `legal/_src/devoluciones.html`). Hoy el botón prepara un correo: si quieres que llegue sin depender de la aplicación de correo del cliente, conéctalo a un formulario (te lo hago). |
| 7 | Pedir solo los datos necesarios | La web no pide ningún dato. Shopify pide los de envío y pago. El formulario de desistimiento pide nombre, correo y número de pedido, nada más. | En Shopify, que el teléfono sea opcional y el nombre de empresa no se pida (pasos en `SHOPIFY.md`). |
| 8 | Derechos de las imágenes | Las fuentes tienen licencia libre (`fonts/LICENCIAS.txt`) y la textura de madera de los vídeos es CC0. | **La foto de Hong Kong** (`img/hongkong.jpg`): confirma que la hiciste tú o que tienes licencia comercial. **Las fotos del producto** son del proveedor de AliExpress: pídele por escrito permiso para usarlas, o mejor, haz las tuyas con la muestra. **El diseño del dragón:** muchos dragones articulados impresos en 3D son diseños con autor que se venden con licencia comercial. Pregunta al proveedor si la tiene. |
| 9 | Leyes locales | Todo está adaptado a España: ver la lista de abajo. | Lo de abajo. |

## Además, lo que pide la ley española y el vídeo no menciona

- **Textos que podían engañar:** decía «dragón de cristal» y «escamas de cristal», pero es plástico PLA. También decía «envío desde España» y «24-72 h», cuando un pedido de AliExpress tarda más. Ahora pone «dragón articulado» y el plazo sale de `plazoEntrega` en `js/datos.js`. Confirma el plazo real con el proveedor; el máximo legal es de 30 días.
- **Precio final con IVA:** ahora pone «IVA incluido» y que el envío es gratis.
- **Recreación 3D:** el dragón animado de la web no es una foto. Las condiciones y el aviso legal lo dicen.
- **Seguridad del producto (Reglamento UE 2023/988):** `legal/seguridad.html` y la ficha del producto en Shopify deben mostrar el fabricante, el operador responsable en la UE, la referencia y las advertencias. Pídele los datos al proveedor. Si nadie en la UE responde del producto, la autoridad te lo puede atribuir a ti.
- **¿Juguete o decoración?** La web lo vende como figura decorativa, «no es un juguete». Si en los vídeos lo vendes como juguete o antiestrés para niños, pasa a ser un juguete: necesita marcado CE, ensayos EN 71 y advertencias en español en el paquete. Pide al proveedor los certificados o mantén el mensaje de decoración.
- **Alta y facturas:** alta de autónomo (o sociedad) en Hacienda y en la Seguridad Social, y facturas de cada venta. Pregunta también a tu gestoría por el IVA de las compras al proveedor fuera de la UE (IOSS).
- **Envases:** desde 2025, quien pone productos envasados en el mercado español se inscribe en el Registro de Productores de Producto (Real Decreto 1055/2022). Consúltalo con la gestoría.
- **Marca LÓNG:** compruébala en la OEPM y la EUIPO antes de invertir en ella, y registra el dominio.
- **Resolución de litigios en línea:** la plataforma europea ODR cerró en julio de 2025. No hay que enlazarla, y la web no lo hace.

## Cómo se cambian los textos

1. Edita la fuente en `legal/_src/` (no las páginas de `legal/`, que se generan).
2. Sube `version` y `fecha` en `js/datos.js`.
3. Ejecuta `python3 tools/legal.py`: regenera las páginas y las políticas de `shopify/politicas/`.
