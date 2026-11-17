# Hoja de contactos: python3 hoja.py sheet.json salida.jpg
import json, sys
from PIL import Image, ImageDraw
rows = json.load(open(sys.argv[1]))
W, H = 330, 300
sheet = Image.new('RGB', (W * 6, H * len(rows)), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for r, files in enumerate(rows):
    for c, (f, label) in enumerate(files):
        try:
            im = Image.open(f).convert('RGB'); im.thumbnail((W - 6, H - 30))
            sheet.paste(im, (c * W + 3, r * H + 3))
        except Exception as e:
            pass
        d.rectangle([c * W, r * H + H - 26, c * W + W, r * H + H], fill=(0, 0, 0))
        d.text((c * W + 6, r * H + H - 22), label, fill=(255, 220, 0))
sheet.save(sys.argv[2], quality=80)
