"""Узнаёт клипы по содержимому, а не по имени: сравнивает кадры клипа с исходными картинками.
usage: python3 match_clips.py папка_с_клипами папка_с_картинками"""
import sys, os, glob, subprocess, io
import numpy as np
from PIL import Image
clips = sorted(glob.glob(os.path.join(sys.argv[1], "*.mp4"))); imgs = sorted(glob.glob(os.path.join(sys.argv[2], "*.png")))
def small(im): return np.asarray(im.convert("RGB").resize((48, 80), Image.BILINEAR)).astype(float)
ref = {p: small(Image.open(p)) for p in imgs}
def first_frames(c):
    out = []
    for t in (0.0, 0.3):
        b = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", c, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        out.append(small(Image.open(io.BytesIO(b))))
    return out
for c in clips:
    fr = first_frames(c)
    sc = sorted((min(np.mean((f - r) ** 2) for f in fr), os.path.basename(p)) for p, r in ref.items())
    ok = "уверенно" if len(sc) < 2 or sc[1][0] > sc[0][0] * 1.5 else "ПРОВЕРИТЬ"
    print(f"{os.path.basename(c):>18} -> {sc[0][1]}  (расхождение {sc[0][0]:.0f}; второй вариант {sc[1][1]} {sc[1][0]:.0f})  {ok}")
