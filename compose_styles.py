"""Собирает лист 16:9 из кадров стилей: python3 compose_styles.py styles_out/people sheet.png "Заголовок листа" """
import sys, numpy as np
from PIL import Image, ImageFilter, ImageDraw, ImageFont, ImageEnhance
src, out, title = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""
STYLES = [("cartoon", "Мягкий мультфильм"), ("clay", "Пластилин"), ("diorama", "Диорама (миниатюра)"), ("lowpoly", "Low-poly"),
          ("voxel", "Воксели"), ("neon", "Неон / киберпанк"), ("paper", "Бумага (вырезки)"), ("flat2d", "Плоская графика"),
          ("toon", "Аниме / cel-shading"), ("ps1", "Ретро PS1"), ("lego", "Кубики LEGO"), ("watercolor", "Акварель")]
W, H = 640, 360
def load(k): return Image.open(f"{src}/{k}.png").convert("RGB")
def tilt(im):
    a = np.asarray(im).astype(float); b = np.asarray(im.filter(ImageFilter.GaussianBlur(7))).astype(float)
    y = np.linspace(0, 1, im.height)[:, None, None]; m = np.clip(np.abs(y - 0.5) / 0.5, 0, 1) ** 2.2
    r = Image.fromarray((a * (1 - m) + b * m).astype("uint8")); return ImageEnhance.Color(ImageEnhance.Contrast(r).enhance(1.12)).enhance(1.35)
def bloom(im):
    a = np.asarray(im).astype(float); br = np.clip(a - 75, 0, 255) * 2.4
    g = np.asarray(Image.fromarray(br.astype("uint8")).filter(ImageFilter.GaussianBlur(9))).astype(float) * 2.4
    g2 = np.asarray(Image.fromarray(br.astype("uint8")).filter(ImageFilter.GaussianBlur(2.5))).astype(float) * 1.6
    return Image.fromarray(np.clip(a * 1.15 + g * 1.3 + g2 * 1.2, 0, 255).astype("uint8"))
def ps1(im):
    s = im.resize((256, 144), Image.BILINEAR); a = np.asarray(s).astype(float)
    bay = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.5
    d = np.tile(bay, (144 // 4, 256 // 4))[:, :, None] * 28
    a = np.round((a + d) / 36) * 36; return Image.fromarray(np.clip(a, 0, 255).astype("uint8")).resize((im.width, im.height), Image.NEAREST)
def water(im):
    rng = np.random.default_rng(3); s = im.filter(ImageFilter.GaussianBlur(1.2)).filter(ImageFilter.MedianFilter(5)); a = np.asarray(s).astype(float)
    a = np.round(a / 18) * 18; paper = rng.normal(0, 7, a.shape[:2])[:, :, None]
    p = np.asarray(Image.fromarray(((paper + 128).clip(0, 255)).astype("uint8")[:, :, 0]).filter(ImageFilter.GaussianBlur(1.2))).astype(float)[:, :, None] - 128
    ed = np.asarray(im.filter(ImageFilter.FIND_EDGES).convert("L").filter(ImageFilter.GaussianBlur(1.2))).astype(float)[:, :, None]
    a = a * 0.9 + 30 - ed * 0.22 + p * 0.9
    return ImageEnhance.Color(Image.fromarray(np.clip(a, 0, 255).astype("uint8"))).enhance(1.2)
POST = {"diorama": tilt, "neon": bloom, "ps1": ps1, "watercolor": water}
fnt = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 22); ft = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
G, TOP, LAB = 14, 64, 34
cols, rows = 4, 3
sheet = Image.new("RGB", (cols * W + (cols + 1) * G, TOP + rows * (H + LAB) + (rows + 1) * G), "#15161c"); d = ImageDraw.Draw(sheet)
d.text((G, 14), title, font=ft, fill="#ffffff")
for i, (k, name) in enumerate(STYLES):
    im = load(k).resize((W, H), Image.LANCZOS); im = POST.get(k, lambda x: x)(im)
    x = G + (i % cols) * (W + G); y = TOP + G + (i // cols) * (H + LAB + G)
    sheet.paste(im, (x, y)); d.rectangle([x, y + H, x + W, y + H + LAB], fill="#222532"); d.text((x + 10, y + H + 4), f"{i+1}. {name}", font=fnt, fill="#ffd27a")
sheet.save(out); print(sheet.size)
