// LÓNG: gestor de consentimiento de cookies (LSSI art. 22.2 y guía de cookies de la AEPD).
// Hoy la web no usa cookies de analítica ni de publicidad, así que no muestra ningún aviso: la ley no lo pide.
// Si algún día añades un píxel (TikTok, Meta, Google…), ponlo en PIXELES: entonces aparece el aviso, con «Rechazar»
// tan visible como «Aceptar», y el píxel solo se carga cuando el visitante acepta su categoría.
(function () {
  const PIXELES = [
    // {
    //   nombre: 'Píxel de TikTok',
    //   empresa: 'TikTok Technology Limited (Irlanda)',
    //   categoria: 'marketing',                // 'analitica' o 'marketing'
    //   cookies: '_ttp, _tt_enable_cookie',
    //   duracion: '13 meses',
    //   finalidad: 'Medir qué vídeos traen visitas y compras.',
    //   cargar() { /* pega aquí el código del píxel, sin la etiqueta <script> */ },
    // },
  ];
  const CATS = {
    analitica: { nombre: 'Analítica', texto: 'Cuentan visitas y cómo se usa la web, para mejorarla.' },
    marketing: { nombre: 'Publicidad', texto: 'Miden qué vídeos y anuncios traen compras y permiten mostrarte anuncios.' },
  };
  const KEY = 'long-cookies', VERSION = 1, VIGENCIA = 365 * 864e5; // se vuelve a preguntar al año o si cambian los píxeles
  const usadas = [...new Set(PIXELES.map((p) => p.categoria))];
  const leer = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const guardar = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* sin almacenamiento: se pregunta en cada visita */ } };
  let actual = leer();
  if (actual && (actual.v !== VERSION || Date.now() - Date.parse(actual.fecha) > VIGENCIA || usadas.some((c) => !(c in actual)))) actual = null;
  const cargados = new Set();
  function aplicar(c) {
    PIXELES.forEach((p, i) => { if (c[p.categoria] && !cargados.has(i)) { cargados.add(i); try { p.cargar(); } catch (e) { console.warn(p.nombre, e); } } });
  }

  const css = `
  .ck{position:fixed;z-index:200;left:16px;right:16px;bottom:16px;max-width:560px;margin:0 auto;padding:22px;border-radius:18px;background:#0d0f16;color:#f4efe6;border:1px solid rgba(244,239,230,.16);box-shadow:0 30px 80px -20px rgba(0,0,0,.8);font:400 15px/1.55 Manrope,"Helvetica Neue",Arial,sans-serif}
  .ck h2{margin:0 0 8px;font:700 19px/1.2 Syne,"Helvetica Neue",Arial,sans-serif;letter-spacing:-.01em}
  .ck p{margin:0 0 16px;color:rgba(244,239,230,.82)}
  .ck a{color:#e8c27a}
  .ck__btns{display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:10px}
  .ck button{min-height:46px;padding:0 12px;border-radius:999px;border:1px solid rgba(244,239,230,.4);background:transparent;color:#f4efe6;font:600 15px/1 Manrope,Arial,sans-serif;cursor:pointer}
  .ck button:hover{background:rgba(244,239,230,.1)}
  .ck button:focus-visible{outline:2px solid #3fffc0;outline-offset:3px}
  .ck__cat{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:14px 0;border-top:1px solid rgba(244,239,230,.12)}
  .ck__cat b{display:block;font-weight:600}
  .ck__cat small{color:rgba(244,239,230,.7);font-size:13px}
  .ck__cat input{width:22px;height:22px;flex:none;accent-color:#ff3b4e;margin-top:2px}
  .ck__x{position:absolute;top:10px;right:10px;width:40px;min-height:40px!important;padding:0!important;border:0!important;font-size:22px!important}`;

  let caja = null;
  function cerrar() { if (caja) { caja.remove(); caja = null; } }
  function decidir(c) {
    const antes = actual;
    actual = Object.assign({ v: VERSION, fecha: new Date().toISOString() }, c);
    guardar(actual); cerrar();
    // retirar un consentimiento ya dado: el píxel cargado no se puede descargar, así que se recarga la página sin él
    if (antes && usadas.some((k) => antes[k] && !c[k]) && cargados.size) location.reload(); else aplicar(actual);
  }
  const todas = (v) => Object.fromEntries(Object.keys(CATS).map((k) => [k, v]));
  function montar(html) {
    cerrar();
    if (!document.getElementById('ck-css')) { const s = document.createElement('style'); s.id = 'ck-css'; s.textContent = css; document.head.appendChild(s); }
    caja = document.createElement('div'); caja.className = 'ck'; caja.setAttribute('role', 'dialog'); caja.setAttribute('aria-labelledby', 'ck-t');
    caja.innerHTML = html; document.body.appendChild(caja);
    const b = caja.querySelector('button'); if (b) b.focus({ preventScroll: true });
    return caja;
  }
  const politica = (document.querySelector('meta[name="long-legal"]')?.content || 'legal/') + 'cookies.html';

  function aviso() {
    const c = montar(`<h2 id="ck-t">¿Aceptas las cookies?</h2>
      <p>Usamos cookies de ${usadas.map((k) => CATS[k].nombre.toLowerCase()).join(' y ')} solo si nos dejas. Puedes cambiar de opinión cuando quieras en «Configurar cookies», al pie de la página. <a href="${politica}">Política de cookies</a>.</p>
      <div class="ck__btns"><button type="button" data-a="no">Rechazar</button><button type="button" data-a="conf">Configurar</button><button type="button" data-a="si">Aceptar</button></div>`);
    c.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'no') decidir(todas(false)); else if (a === 'si') decidir(todas(true)); else if (a === 'conf') panel();
    });
  }
  function panel() {
    const filas = usadas.length
      ? usadas.map((k) => `<label class="ck__cat"><span><b>${CATS[k].nombre}</b><small>${CATS[k].texto} ${PIXELES.filter((p) => p.categoria === k).map((p) => p.nombre).join(', ')}.</small></span><input type="checkbox" name="${k}" ${actual?.[k] ? 'checked' : ''}></label>`).join('')
      : `<p>Ahora mismo esta web no usa cookies de analítica ni de publicidad: no hay nada que aceptar ni rechazar.</p>`;
    const c = montar(`<button type="button" class="ck__x" data-a="x" aria-label="Cerrar">×</button>
      <h2 id="ck-t">Configurar cookies</h2>
      <p>Las técnicas, que solo guardan tu elección, siempre están activas. El resto, solo si las marcas. <a href="${politica}">Política de cookies</a>.</p>
      ${filas}
      ${usadas.length ? '<div class="ck__btns" style="margin-top:12px"><button type="button" data-a="no">Rechazar todo</button><button type="button" data-a="guardar">Guardar selección</button><button type="button" data-a="si">Aceptar todo</button></div>' : ''}`);
    c.addEventListener('click', (e) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'x') cerrar();
      else if (a === 'no') decidir(todas(false));
      else if (a === 'si') decidir(todas(true));
      else if (a === 'guardar') decidir(Object.fromEntries(Object.keys(CATS).map((k) => [k, !!c.querySelector(`input[name="${k}"]`)?.checked])));
    });
  }
  window.LONGCookies = { abrir: panel, estado: () => actual };
  function iniciar() {
    document.querySelectorAll('[data-cookies]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); panel(); }));
    // la tabla de la política de cookies se escribe con la misma lista, para que nunca se quede desfasada
    const t = document.getElementById('tabla-pixeles');
    if (t) t.innerHTML = PIXELES.length
      ? `<table><thead><tr><th>Herramienta</th><th>Empresa</th><th>Tipo</th><th>Cookies</th><th>Duración</th><th>Para qué</th></tr></thead><tbody>${PIXELES.map((p) => `<tr><td>${p.nombre}</td><td>${p.empresa}</td><td>${CATS[p.categoria].nombre}</td><td>${p.cookies}</td><td>${p.duracion}</td><td>${p.finalidad}</td></tr>`).join('')}</tbody></table>`
      : '<p><strong>Ahora mismo, ninguna.</strong> Esta web no instala cookies de analítica ni de publicidad, ni propias ni de terceros.</p>';
    document.querySelectorAll('[data-sin-pixeles]').forEach((el) => { el.hidden = usadas.length > 0; });
    document.querySelectorAll('[data-con-pixeles]').forEach((el) => { el.hidden = !usadas.length; });
    if (!usadas.length) return;
    if (actual) aplicar(actual); else aviso();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
