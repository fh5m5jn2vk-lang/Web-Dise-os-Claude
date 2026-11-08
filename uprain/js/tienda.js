// Shopify: fill in the store's domain and the variant id of each finish and pack (Admin > Products > the variant's URL
// ends in its id). The order form then sends the visitor straight to the store's checkout with a cart permalink
// (https://<store>/cart/<variant id>:<quantity>). Until both are filled in, the form falls back to its mailto action.
export const SHOPIFY = {
  store: '',                     // e.g. 'uprain.myshopify.com' or your own domain
  variants: {
    grafito: { uno: '', regalo: '', dos: '' },
    arena: { uno: '', regalo: '', dos: '' },
  },
};

// the light colours in #luz swap the picture
const luzFoto = document.getElementById('luz-foto');
const names = { hielo: 'hielo', ambar: 'ámbar', cobalto: 'cobalto', menta: 'menta' };
document.querySelectorAll('#luz-colores input[name="luz"]').forEach((input) => {
  // load each colour once, so a swap never waits
  const pre = new Image(); pre.sizes = luzFoto ? luzFoto.sizes : ''; pre.srcset = `img/luz-${input.value}-700.webp 700w, img/luz-${input.value}-1200.webp 1200w, img/luz-${input.value}.webp 2400w`;
  input.addEventListener('change', () => {
    if (!input.checked || !luzFoto) return;
    luzFoto.classList.add('is-swapping');
    setTimeout(() => {
      const v = input.value;
      luzFoto.srcset = `img/luz-${v}-700.webp 700w, img/luz-${v}-1200.webp 1200w, img/luz-${v}.webp 2400w`;
      luzFoto.src = `img/luz-${v}.webp`;
      luzFoto.alt = `El humidificador Uprain grafito con la luz ${names[input.value]} encendida`;
      luzFoto.classList.remove('is-swapping');
    }, 160);
  });
});

// the finish in the order form swaps the picture beside it
const pedidoFoto = document.getElementById('pedido-foto');
document.querySelectorAll('#comprar input[name="acabado"]').forEach((input) => {
  const pre = new Image(); pre.src = input.dataset.pic;
  input.addEventListener('change', () => {
    if (!input.checked || !pedidoFoto) return;
    const small = input.dataset.pic.replace('.webp', '-560.webp');
    pedidoFoto.srcset = `${small} 560w, ${input.dataset.pic} 1000w`;
    pedidoFoto.src = input.dataset.pic;
    pedidoFoto.alt = input.dataset.alt;
  });
});

// the order form: to the Shopify checkout when the store is set up
const form = document.getElementById('comprar');
if (form) {
  form.addEventListener('submit', (e) => {
    const data = new FormData(form);
    const id = SHOPIFY.store && SHOPIFY.variants[data.get('acabado')]?.[data.get('pack')];
    if (!id) return;                               // not set up yet: the mailto action runs
    e.preventDefault();
    e.stopImmediatePropagation();
    location.href = `https://${SHOPIFY.store}/cart/${id}:1`;
  }, true);
}
