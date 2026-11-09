// LÓNG: la función de desistimiento (art. 11 bis de la Directiva 2011/83/UE, añadido por la Directiva 2023/2673).
// Pide lo mínimo para identificar el pedido, prepara la declaración y la deja lista para enviar y guardar.
(function () {
  const f = document.getElementById('desistir');
  if (!f) return;
  const D = window.LONG || {};
  const err = document.getElementById('desistir-error');
  const hecho = document.getElementById('desistir-hecho');
  let texto = '', pedido = '';
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    const faltan = [];
    if (!d.nombre.trim()) faltan.push(['nombre', 'tu nombre']);
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) faltan.push(['email', 'un correo válido']);
    if (!d.pedido.trim()) faltan.push(['pedido', 'el número de pedido']);
    if (!f.privacidad.checked) faltan.push(['privacidad', 'marcar la casilla de privacidad']);
    if (faltan.length) {
      err.textContent = 'Falta ' + faltan.map((x) => x[1]).join(', ').replace(/, ([^,]*)$/, ' y $1') + '.';
      err.hidden = false; f.elements[faltan[0][0]].focus(); return;
    }
    err.hidden = true;
    pedido = d.pedido.trim();
    const ahora = new Date();
    texto = [
      `A la atención de ${D.titular || '[titular]'}${D.domicilio ? ', ' + D.domicilio : ''}${D.email ? ', ' + D.email : ''}:`,
      '',
      `Por la presente le comunico que desisto de mi contrato de venta del siguiente bien: dragón articulado LÓNG (${d.alcance}), pedido número ${pedido}.`,
      '',
      `Nombre del consumidor: ${d.nombre.trim()}`,
      `Correo electrónico para el acuse de recibo: ${d.email.trim()}`,
      `Fecha: ${ahora.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}`,
    ].join('\n');
    document.getElementById('desistir-texto').textContent = texto;
    f.hidden = true; hecho.hidden = false; hecho.focus();
    location.href = `mailto:${D.email || ''}?subject=${encodeURIComponent('Desistimiento del pedido ' + pedido)}&body=${encodeURIComponent(texto)}`;
  });
  document.getElementById('desistir-copiar').addEventListener('click', (e) => {
    navigator.clipboard?.writeText(texto).then(() => { e.target.textContent = 'Copiado'; }, () => {});
  });
  document.getElementById('desistir-guardar').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([texto + '\n'], { type: 'text/plain;charset=utf-8' }));
    a.download = `desistimiento-pedido-${pedido.replace(/[^\w-]+/g, '')}.txt`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
