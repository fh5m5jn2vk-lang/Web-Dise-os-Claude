#!/usr/bin/env python3
"""LÓNG: builds the legal pages and the Shopify policies from legal/_src/*.html.

    python3 tools/legal.py

Writes legal/<page>.html (the web: each {{dato}} becomes a span that js/datos.js fills in the browser)
and shopify/politicas/*.html (the text for Shopify > Settings > Policies, with the values of js/datos.js written in).
Each source starts with a comment: <!-- Title | description -->. {{dato}} is a value of js/datos.js; {{dato:a}} is a mail link.
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'legal' / '_src'

PAGES = [  # order of the footer
    ('aviso-legal', 'Aviso legal'),
    ('condiciones', 'Condiciones de venta'),
    ('envios', 'Envíos'),
    ('devoluciones', 'Devoluciones y garantía'),
    ('privacidad', 'Privacidad'),
    ('cookies', 'Cookies'),
    ('seguridad', 'Seguridad del producto'),
]
LABELS = {
    'titular': 'nombre y apellidos o razón social', 'nif': 'NIF', 'domicilio': 'domicilio completo',
    'email': 'correo electrónico', 'telefono': 'teléfono', 'registro': 'datos registrales', 'web': 'tu dominio',
    'zonasEnvio': 'zonas de envío', 'plazoEntrega': 'plazo de entrega', 'origenEnvio': 'desde dónde sale el paquete',
    'direccionDevoluciones': 'dirección para devoluciones', 'fabricante': 'nombre, dirección y correo del fabricante',
    'responsableUE': 'operador responsable en la UE', 'referencia': 'modelo o referencia del producto',
    'version': 'versión', 'fecha': 'fecha',
}
# the Shopify policy each page becomes, and where its links point inside Shopify
SHOPIFY = {
    'aviso-legal': ('LEGAL_NOTICE', '/policies/legal-notice'),
    'condiciones': ('TERMS_OF_SERVICE', '/policies/terms-of-service'),
    'envios': ('SHIPPING_POLICY', '/policies/shipping-policy'),
    'devoluciones': ('REFUND_POLICY', '/policies/refund-policy'),
    'privacidad': ('PRIVACY_POLICY', '/policies/privacy-policy'),
}


def datos():
    src = (ROOT / 'js' / 'datos.js').read_text(encoding='utf-8')
    d = {k: v for k, v in re.findall(r"^\s*(\w+):\s*'([^']*)'", src, flags=re.M)}
    if not d.get('direccionDevoluciones'):
        d['direccionDevoluciones'] = d.get('domicilio', '')
    return d


def web_dato(m, d):
    key, kind = m.group(1), m.group(2)
    v = d.get(key, '')
    text = html.escape(v) if v else f'[{LABELS.get(key, key)}]'
    span = f'<span data-dato="{key}"{"" if v else " class=\"falta\""}>{text}</span>'
    if kind == 'a':
        return f'<a data-mail href="{"mailto:" + html.escape(v) if v else "#"}">{span}</a>'
    return span


def page(name, title, desc, body, d):
    body = re.sub(r'\{\{(\w+)(?::(a))?\}\}', lambda m: web_dato(m, d), body)
    body = body.replace('<table>', '<div class="tabla"><table>').replace('</table>', '</table></div>')
    links = '\n'.join(
        f'      <li><a href="{p}.html"{" aria-current=\"page\"" if p == name else ""}>{t}</a></li>' for p, t in PAGES)
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · LÓNG</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="theme-color" content="#07080c">
<meta name="long-legal" content="">
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="legal.css">
</head>
<body>
<!-- generado por tools/legal.py a partir de legal/_src/{name}.html: edita la fuente, no este archivo -->
<header class="top">
  <a class="logo" href="../index.html" aria-label="LÓNG, volver a la tienda"><span class="stamp" aria-hidden="true">龍</span>LÓNG</a>
  <a class="back" href="../index.html">← Volver a la tienda</a>
</header>
<main class="doc">
{body.strip()}
</main>
<footer class="pie">
  <nav aria-label="Información legal">
    <ul>
{links}
      <li><button type="button" data-cookies>Configurar cookies</button></li>
      <li><a class="desistir" href="desistimiento.html"{" aria-current=\"page\"" if name == "desistimiento" else ""}>Desistir del contrato aquí</a></li>
    </ul>
  </nav>
  <small>&copy; 2026 LÓNG · Dragones articulados impresos en 3D</small>
</footer>
<script src="../js/datos.js"></script>
<script src="../js/cookies.js"></script>
</body>
</html>
'''


def shopify_policy(name, body, d):
    def val(m):
        key, kind = m.group(1), m.group(2)
        v = d.get(key, '')
        text = html.escape(v) if v else f'[{LABELS.get(key, key)}]'
        return f'<a href="mailto:{html.escape(v)}">{text}</a>' if kind == 'a' and v else text
    body = re.sub(r'<h1>.*?</h1>\s*', '', body, count=1)
    body = re.sub(r'<p><button.*?</p>\s*', '', body)
    body = re.sub(r'<script.*?</script>\s*', '', body)
    body = re.sub(r'<(\w+)[^>]*data-con-pixeles hidden>.*?</\1>\s*', '', body)  # Shopify gets today's wording
    body = re.sub(r'<(\w+)([^>]*) data-sin-pixeles>', r'<\1\2>', body)
    body = re.sub(r'<div data-si="(\w+)">(.*?)</div>', lambda m: m.group(2) if d.get(m.group(1)) else '', body)
    body = re.sub(r'\{\{(\w+)(?::(a))?\}\}', val, body)

    def link(m):
        target, anchor = m.group(1), m.group(2) or ''
        if target in SHOPIFY:
            return f'href="{SHOPIFY[target][1]}{anchor}"'
        return f'href="/pages/{target}{anchor}"'  # the store has every legal page under /pages/ (tools/tema.py)
    body = re.sub(r'href="([\w-]+)\.html(#[\w-]+)?"', link, body)
    return body.strip() + '\n'


def contact(d):
    rows = [('Titular', d.get('titular')), ('NIF', d.get('nif')), ('Domicilio', d.get('domicilio')),
            ('Correo electrónico', d.get('email')), ('Teléfono', d.get('telefono')), ('Datos registrales', d.get('registro'))]
    out = ['<p>Datos de contacto del vendedor de LÓNG:</p>', '<ul>']
    for k, v in rows:
        if v or k in ('Titular', 'NIF', 'Domicilio', 'Correo electrónico'):
            out.append(f'  <li><strong>{k}:</strong> {html.escape(v) if v else "[" + k.lower() + "]"}</li>')
    out.append('</ul>')
    return '\n'.join(out) + '\n'


def main():
    d = datos()
    out_shop = ROOT / 'shopify' / 'politicas'
    out_shop.mkdir(parents=True, exist_ok=True)
    names = [p for p, _ in PAGES] + ['desistimiento']
    for name in names:
        raw = (SRC / f'{name}.html').read_text(encoding='utf-8')
        head, body = raw.split('\n', 1)
        title, desc = [s.strip() for s in re.match(r'<!--(.*)-->', head).group(1).split('|', 1)]
        (ROOT / 'legal' / f'{name}.html').write_text(page(name, title, desc, body, d), encoding='utf-8')
        if name in SHOPIFY:
            (out_shop / f'{SHOPIFY[name][0]}.html').write_text(shopify_policy(name, body, d), encoding='utf-8')
    (out_shop / 'CONTACT_INFORMATION.html').write_text(contact(d), encoding='utf-8')
    missing = [LABELS[k] for k in ('titular', 'nif', 'domicilio', 'email', 'web', 'origenEnvio', 'fabricante', 'responsableUE', 'referencia') if not d.get(k)]
    print(f'{len(names)} páginas en legal/ y {len(SHOPIFY) + 1} políticas en shopify/politicas/')
    if missing:
        print('Faltan en js/datos.js:', ', '.join(missing))


if __name__ == '__main__':
    main()
