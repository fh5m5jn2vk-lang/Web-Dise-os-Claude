// LÓNG: tus datos, escritos una sola vez. Los usan las páginas legales, el pie de la web y el botón de compra.
// Rellena lo que está vacío. Mientras un dato esté vacío, la web lo muestra entre corchetes y en amarillo.
window.LONG = {
  // ---- quién vende (obligatorio por la LSSI y la ley de consumidores) ----
  titular: '',        // nombre y apellidos si eres autónomo, o razón social si es una sociedad
  nif: '',            // NIF, NIE o CIF
  domicilio: '',      // calle, número, código postal, ciudad y provincia
  email: '',          // correo de contacto, pedidos y devoluciones
  telefono: '',       // opcional: si lo dejas vacío, no se muestra
  registro: '',       // solo sociedades: «Registro Mercantil de …, tomo …, folio …, hoja …». Autónomo: déjalo vacío
  web: 'thelongdragon.com', // tu dominio, p. ej. «longdragon.es» (sin https://)

  // ---- envíos y devoluciones (confírmalos con tu proveedor) ----
  zonasEnvio: 'la España peninsular y Baleares',
  plazoEntrega: '7 a 12 días laborables',
  origenEnvio: '',    // desde dónde sale el paquete, p. ej. «nuestro taller de producción en China» o «un almacén en España»
  direccionDevoluciones: '', // dónde te devuelven el producto; si lo dejas vacío, se usa tu domicilio

  // ---- seguridad del producto (Reglamento UE 2023/988): pídeselos al proveedor ----
  fabricante: '',     // nombre, dirección postal y correo del fabricante
  responsableUE: '',  // operador responsable en la UE (importador o representante). Si no hay otro, eres tú
  referencia: '',     // modelo o referencia del producto, la misma que en el paquete

  // ---- versión de los textos legales: cámbiala cada vez que los modifiques ----
  version: '1',
  fecha: '9 de noviembre de 2026',
  fechaISO: '2026-11-09',

  // ---- Shopify: el dominio de la tienda y un ID de variante por color y cantidad ----
  shopify: {
    tienda: 't5hfva-w3.myshopify.com',
    producto: 'long-dragon-articulado-88-cm', // el «handle» del producto: si faltan los IDs, el botón abre su ficha
    variantes: {
      arcoiris: { uno: '57684870267204', dos: '57684870299972' },
      galaxia: { uno: '57684870332740', dos: '57684870365508' },
      plata: { uno: '57684870398276', dos: '57684870431044' },
      fuego: { uno: '57684870463812', dos: '57684870496580' },
    },
  },
};

// Pone cada dato en su sitio: <span data-dato="email">[correo]</span>.
// data-si="telefono" oculta el bloque entero cuando ese dato está vacío; a[data-mail] se convierte en enlace de correo.
(function () {
  const D = window.LONG;
  if (!D.direccionDevoluciones) D.direccionDevoluciones = D.domicilio;
  function rellenar() {
    document.querySelectorAll('[data-dato]').forEach((el) => {
      const v = D[el.dataset.dato];
      if (v) { el.textContent = v; el.classList.remove('falta'); } else el.classList.add('falta');
    });
    document.querySelectorAll('[data-si]').forEach((el) => { if (!D[el.dataset.si]) el.hidden = true; });
    document.querySelectorAll('a[data-mail]').forEach((a) => { if (D.email) a.href = 'mailto:' + D.email; });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rellenar); else rellenar();
})();
