// The order card: the chosen mask swaps the picture beside it.
const sel = document.getElementById('f-producto');
const pic = document.getElementById('pedido-foto');
if (sel && pic) sel.addEventListener('change', () => {
  const o = sel.selectedOptions[0];
  pic.src = o.dataset.pic;
  pic.alt = o.dataset.alt;
});
