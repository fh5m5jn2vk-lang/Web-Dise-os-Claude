#!/usr/bin/env python3
"""LÓNG: turns the web into a Shopify theme, so the store itself is the dragon's web.

    python3 tools/tema.py

Writes shopify/tema/ (the theme's files), shopify/long-tema.zip (to upload or to create the theme from)
and shopify/paginas/*.html (the bodies of the legal pages, created in Shopify as pages under /pages/<handle>).
Shopify serves theme assets from one flat folder, so the modules' imports are rewritten to sibling files and
the import map goes away. Everything else is the same web: same page, same scripts, same legal texts.
"""
import importlib.util
import json
import pathlib
import re
import shutil
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
# the owner's details are not in this public repository: they live in the store, in the shop metafield long.datos
# (JSON: titular, nif, domicilio, email, web...), and the theme hands them to datos.js before it runs
TIENDA = "{% if shop.metafields.long.datos %}<script>window.LONG_TIENDA = {{ shop.metafields.long.datos.value | json }};</script>{% endif %}"
PRODUCTO = "<script>window.LONG_PRODUCTO = {{ all_products['long-dragon-articulado-88-cm'] | json }};</script>"
OUT = ROOT / 'shopify' / 'tema'
spec = importlib.util.spec_from_file_location('legal', ROOT / 'tools' / 'legal.py')
legal = importlib.util.module_from_spec(spec); spec.loader.exec_module(legal)

PAGES = [p for p, _ in legal.PAGES] + ['desistimiento']
FOOT = legal.PAGES

ADDONS = ['postprocessing/EffectComposer.js', 'postprocessing/RenderPass.js', 'postprocessing/UnrealBloomPass.js',
          'postprocessing/OutputPass.js', 'postprocessing/Pass.js', 'postprocessing/ShaderPass.js', 'postprocessing/MaskPass.js',
          'postprocessing/BokehPass.js', 'environments/RoomEnvironment.js', 'shaders/CopyShader.js',
          'shaders/LuminosityHighPassShader.js', 'shaders/OutputShader.js', 'shaders/BokehShader.js']


def flat_imports(src):
    src = re.sub(r"""from\s*(['"])three\1""", "from './three.module.min.js'", src)
    src = re.sub(r"""(['"])three/addons/[\w/]*?([\w-]+\.js)\1""", r"'./\2'", src)
    src = re.sub(r"""(['"])\.\./[\w-]+/([\w-]+\.js)\1""", r"'./\2'", src)
    return src


def write(rel, text):
    p = OUT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')


def copy(src, name):
    (OUT / 'assets').mkdir(parents=True, exist_ok=True)
    shutil.copyfile(ROOT / src, OUT / 'assets' / name)


def footer_nav(current=None):
    items = '\n'.join(f'      <li><a href="/pages/{p}"{" aria-current=\"page\"" if p == current else ""}>{t}</a></li>' for p, t in FOOT)
    return f'''  <nav aria-label="Información legal">
    <ul>
{items}
      <li><button type="button" data-cookies>Configurar cookies</button></li>
      <li><a class="desistir" href="/pages/desistimiento">Desistir del contrato aquí</a></li>
    </ul>
  </nav>'''


def assets():
    for f in ['main.js', 'scene.js', 'dragon.js', 'photo.js']:
        s = flat_imports((ROOT / 'js' / f).read_text(encoding='utf-8'))
        # the Hong Kong photo sits next to the scripts in the theme's assets
        s = re.sub(r"'img/(hongkong(?:-1600)?\.jpg)'", r"new URL('./\1', import.meta.url).href", s)
        write(f'assets/{f}', s)
    copy('js/cookies.js', 'cookies.js')
    copy('js/datos.js', 'datos.js')
    copy('legal/desistimiento.js', 'desistimiento.js')
    css = (ROOT / 'legal' / 'legal.css').read_text(encoding='utf-8').replace('url(../fonts/', 'url(')
    write('assets/legal.css', css)
    copy('vendor/three/three.module.min.js', 'three.module.min.js')
    for a in ADDONS:
        write(f'assets/{a.split("/")[-1]}', flat_imports((ROOT / 'vendor/three/addons' / a).read_text(encoding='utf-8')))
    for f in ['gsap.min.js', 'ScrollTrigger.min.js']:
        copy(f'vendor/gsap/{f}', f)
    for f in ['syne.woff2', 'manrope.woff2', 'han.woff2']:
        copy(f'fonts/{f}', f)
    for f in ['hongkong.jpg', 'hongkong-1600.jpg']:
        copy(f'img/{f}', f)
    copy('share.jpg', 'share.jpg'); copy('favicon.svg', 'favicon.svg')


def index():
    s = (ROOT / 'index.html').read_text(encoding='utf-8')
    au = lambda f: "{{ '%s' | asset_url }}" % f

    def rep(a, b, count=1):
        nonlocal s
        assert a in s, a[:80]
        s = s.replace(a, b) if count == 0 else s.replace(a, b, count)
    s = s.replace('<!doctype html>', '{% layout none %}<!doctype html>', 1)
    rep('<link rel="icon" href="favicon.svg" type="image/svg+xml">',
        f'<link rel="icon" href="{au("favicon.svg")}" type="image/svg+xml">\n<link rel="canonical" href="{{{{ canonical_url }}}}">')
    rep('<meta property="og:image" content="share.jpg">', f'<meta property="og:image" content="https:{au("share.jpg")}">')
    rep('<meta name="long-legal" content="legal/">', '<meta name="long-legal" content="/pages/">\n<meta name="long-cookies" content="/pages/cookies">')
    rep('<link rel="preload" href="fonts/han.woff2"', f'<link rel="preload" href="{au("han.woff2")}"')
    s = re.sub(r'<!-- older iPhones.*?-->\n<script async src="vendor/es-module-shims/es-module-shims.js"></script>\n', '', s, flags=re.S)
    s = re.sub(r'<script type="importmap">.*?</script>\n', '', s)
    for f in ['syne', 'manrope', 'han']:
        rep(f'url(fonts/{f}.woff2)', f'url({au(f + ".woff2")})')
    s = re.sub(r'legal/([\w-]+)\.html', r'/pages/\1', s)
    rep('<script src="js/datos.js"></script>',
        f'{TIENDA}\n{PRODUCTO}\n<script src="{au("datos.js")}"></script>\n<script>LONG.shopify.tienda = location.host; // the store itself: the checkout opens on this same domain</script>')
    rep('<script src="js/cookies.js"></script>', f'<script src="{au("cookies.js")}"></script>')
    rep('<script src="vendor/gsap/gsap.min.js"></script>', f'<script src="{au("gsap.min.js")}"></script>')
    rep('<script src="vendor/gsap/ScrollTrigger.min.js"></script>', f'<script src="{au("ScrollTrigger.min.js")}"></script>')
    rep('<script type="module" src="js/main.js"></script>', f'<script type="module" src="{au("main.js")}"></script>')
    rep('</head>', '{{ content_for_header }}\n</head>')
    assert 'src="js/' not in s and 'href="legal/' not in s and 'vendor/' not in s
    write('templates/index.liquid', s)


def layouts():
    head = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#07080c">
<meta name="long-legal" content="/pages/">
<meta name="long-cookies" content="/pages/cookies">
<link rel="icon" href="{{ 'favicon.svg' | asset_url }}" type="image/svg+xml">
{{ 'legal.css' | asset_url | stylesheet_tag }}'''
    write('layout/theme.liquid', f'''<!doctype html>
<html lang="es">
<head>
{head}
<title>{{{{ page_title }}}}{{% unless page_title contains 'LÓNG' %}} · LÓNG{{% endunless %}}</title>
{{% if page_description %}}<meta name="description" content="{{{{ page_description | escape }}}}">{{% endif %}}
<link rel="canonical" href="{{{{ canonical_url }}}}">
{{{{ content_for_header }}}}
</head>
<body>
<header class="top">
  <a class="logo" href="{{{{ routes.root_url }}}}" aria-label="LÓNG, volver a la tienda"><span class="stamp" aria-hidden="true">龍</span>LÓNG</a>
  <a class="back" href="{{{{ routes.root_url }}}}">← Volver a la tienda</a>
</header>
<main class="doc">
{{{{ content_for_layout }}}}
</main>
<footer class="pie">
{footer_nav()}
  <small>&copy; {{{{ 'now' | date: '%Y' }}}} LÓNG · Dragones articulados impresos en 3D</small>
</footer>
{TIENDA}
<script src="{{{{ 'datos.js' | asset_url }}}}"></script>
<script src="{{{{ 'cookies.js' | asset_url }}}}"></script>
</body>
</html>
''')
    write('layout/password.liquid', f'''<!doctype html>
<html lang="es">
<head>
{head}
<title>LÓNG 龍</title>
{{{{ content_for_header }}}}
</head>
<body>
<main class="doc">
{{{{ content_for_layout }}}}
</main>
</body>
</html>
''')


def templates():
    home = '<p><a class="btn-pri" href="{{ routes.root_url }}">Ir a la tienda</a></p>'
    write('templates/page.liquid', '{{ page.content }}\n')
    write('templates/page.desistimiento.liquid', "{{ page.content }}\n<script src=\"{{ 'desistimiento.js' | asset_url }}\"></script>\n")
    write('templates/page.contact.liquid', '<h1>{{ page.title }}</h1>\n{{ page.content }}\n<p>Escríbenos a <a data-mail href="/pages/aviso-legal"><span data-dato="email" class="falta">[correo electrónico]</span></a>, con tu número de pedido si lo tienes. Te contestamos en un mes como máximo.</p>\n')
    write('templates/product.liquid', '''<h1>{{ product.title }}</h1>
{% if product.featured_image %}<p><img src="{{ product.featured_image | image_url: width: 1400 }}" alt="{{ product.featured_image.alt | escape }}" width="700" style="width:100%;height:auto;border-radius:16px"></p>{% endif %}
<p class="lede">{{ product.price_min | money }}{% if product.price_varies %} – {{ product.price_max | money }}{% endif %} · IVA incluido · envío gratis</p>
<p><a class="btn-pri" href="{{ routes.root_url }}#comprar">Elegir color y comprar</a></p>
{{ product.description }}
''')
    write('templates/cart.liquid', '''<h1>Tu carrito</h1>
{% if cart.item_count == 0 %}
<p>Tu carrito está vacío.</p>
<p><a class="btn-pri" href="{{ routes.root_url }}#comprar">Ver el dragón</a></p>
{% else %}
<form class="form" id="carrito" action="{{ routes.cart_url }}" method="post">
  <ul>
  {% for item in cart.items %}<li>{{ item.quantity }} × {{ item.product.title }} ({{ item.variant.title }}): {{ item.final_line_price | money }} · <a href="{{ item.url_to_remove }}">Quitar</a></li>
  {% endfor %}</ul>
  <p><strong>Total: {{ cart.total_price | money }}</strong> · IVA incluido · envío gratis</p>
  <label class="check"><input type="checkbox" name="c1" required> <span>He leído y acepto las <a href="/pages/condiciones" target="_blank">condiciones de venta</a>.</span></label>
  <label class="check"><input type="checkbox" name="c2" required> <span>He leído la <a href="/pages/privacidad" target="_blank">política de privacidad</a>.</span></label>
  <input type="hidden" name="attributes[Condiciones de venta aceptadas]" id="a1">
  <input type="hidden" name="attributes[Política de privacidad leída]" id="a2">
  <input type="hidden" name="attributes[Cómo se aceptó]" value="dos casillas separadas, sin marcar por defecto, en el carrito de la tienda">
  <button class="btn-pri" type="submit" name="checkout">Finalizar compra</button>
</form>
<script>
  // the two acceptances, with the version of the texts and the time, go into the order
  document.getElementById('carrito').addEventListener('submit', () => {
    const L = window.LONG || {}, v = `versión ${L.version} del ${L.fechaISO} · ${new Date().toISOString()}`;
    document.getElementById('a1').value = v; document.getElementById('a2').value = v;
  });
</script>
{% endif %}
''')
    for name, title, text in [
        ('404', 'No encontramos esta página', 'Puede que el enlace esté mal o que la página ya no exista.'),
        ('search', 'Buscar', 'Esta tienda solo vende un producto: el dragón articulado LÓNG.'),
        ('collection', '{{ collection.title }}', 'Esta tienda solo vende un producto: el dragón articulado LÓNG.'),
        ('list-collections', 'Colecciones', 'Esta tienda solo vende un producto: el dragón articulado LÓNG.'),
        ('blog', '{{ blog.title }}', 'Pronto publicaremos aquí novedades.'),
        ('article', '{{ article.title }}', '{{ article.content }}'),
    ]:
        write(f'templates/{name}.liquid', f'<h1>{title}</h1>\n<p>{text}</p>\n{home}\n')
    write('templates/gift_card.liquid', '<h1>Tarjeta regalo</h1>\n<p class="lede">Saldo: {{ gift_card.balance | money }}</p>\n<p>Código: <strong>{{ gift_card.code | format_code }}</strong></p>\n')
    write('templates/password.liquid', '''{% layout 'password' %}
<h1>LÓNG 龍</h1>
<p class="lede">{{ shop.password_message | default: 'Abrimos muy pronto.' }}</p>
{% form 'storefront_password' %}
  {{ form.errors | default_errors }}
  <div class="form">
    <label class="campo"><span>Contraseña de la tienda</span><input type="password" name="password" autocomplete="current-password"></label>
    <button class="btn-pri" type="submit">Entrar</button>
  </div>
{% endform %}
''')
    for name in ['login', 'register', 'account', 'order', 'addresses', 'activate_account', 'reset_password']:
        write(f'templates/customers/{name}.liquid', '<h1>Tu cuenta</h1>\n<p>Gestiona tus pedidos desde tu cuenta de cliente.</p>\n<p><a class="btn-pri" href="{{ routes.account_url }}">Ir a mi cuenta</a></p>\n')


def config():
    write('config/settings_schema.json', json.dumps([{
        'name': 'theme_info', 'theme_name': 'LÓNG', 'theme_version': '1.0.0', 'theme_author': 'LÓNG',
        'theme_documentation_url': 'https://github.com/fh5m5jn2vk-lang/Web-Dise-os-Claude',
        'theme_support_url': 'https://github.com/fh5m5jn2vk-lang/Web-Dise-os-Claude'}], ensure_ascii=False, indent=2) + '\n')
    write('config/settings_data.json', json.dumps({'current': 'Default', 'presets': {'Default': {}}}, indent=2) + '\n')
    write('locales/es.default.json', json.dumps({'general': {'tienda': 'Tienda'}}, ensure_ascii=False, indent=2) + '\n')


def pages():
    # the legal pages' bodies: the same sources as legal/*.html, with links between them under /pages/
    d = legal.datos()
    out = ROOT / 'shopify' / 'paginas'
    out.mkdir(parents=True, exist_ok=True)
    meta = {}
    for name in PAGES:
        raw = (legal.SRC / f'{name}.html').read_text(encoding='utf-8')
        head, body = raw.split('\n', 1)
        title, desc = [x.strip() for x in re.match(r'<!--(.*)-->', head).group(1).split('|', 1)]
        body = re.sub(r'\{\{(\w+)(?::(a))?\}\}', lambda m: legal.web_dato(m, d), body)
        body = body.replace('<table>', '<div class="tabla"><table>').replace('</table>', '</table></div>')
        body = re.sub(r'<script src="desistimiento.js"></script>\s*', '', body)
        body = re.sub(r'href="([\w-]+)\.html(#[\w-]+)?"', lambda m: f'href="/pages/{m.group(1)}{m.group(2) or ""}"', body)
        (out / f'{name}.html').write_text(body.strip() + '\n', encoding='utf-8')
        meta[name] = {'title': title, 'description': desc, 'template': 'desistimiento' if name == 'desistimiento' else ''}
    (out / 'paginas.json').write_text(json.dumps(meta, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')


def main():
    shutil.rmtree(OUT, ignore_errors=True)
    assets(); index(); layouts(); templates(); config(); pages()
    z = ROOT / 'shopify' / 'long-tema.zip'
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as f:
        for p in sorted(OUT.rglob('*')):
            if p.is_file():
                f.write(p, p.relative_to(OUT).as_posix())
    n = sum(1 for p in OUT.rglob('*') if p.is_file())
    print(f'{n} archivos en shopify/tema/, {z.stat().st_size // 1024} KB en shopify/long-tema.zip, {len(PAGES)} páginas en shopify/paginas/')


if __name__ == '__main__':
    main()
