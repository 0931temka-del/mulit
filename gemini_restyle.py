"""Перерисовка кадра из three.js в красивый стиль через Gemini. usage: python3 gemini_restyle.py style   (читает styles_out/people/STYLE.png)"""
import os, sys, json, base64, urllib.request, urllib.error
MODEL = "gemini-3.1-flash-image"
STYLES = {
 "clay": "handmade plasticine / modeling clay stop-motion animation look: visible fingerprints, soft rounded sculpted shapes, slightly uneven surfaces, matte clay texture, warm cozy studio light, like an Aardman claymation film still",
 "toon": "high-quality anime film look: clean ink outlines, cel-shaded colors with soft gradient sky, painterly clouds, vivid warm sunlight, like a Studio Ghibli / Makoto Shinkai background and character style",
 "lego": "built entirely from LEGO bricks: the man is a LEGO minifigure-style brick character, the house and the red car are built from visible glossy plastic bricks with round studs on top, the trees and road also made of bricks, macro toy photography look, shallow depth of field, bright playful studio light",
 "diorama": "tilt-shift miniature diorama look: a tiny toy-like model scene on a small grass platform, strong depth-of-field blur at the top and bottom of the frame, miniature photography, saturated cheerful colors, soft sunny light",
}
style = sys.argv[1]
ref = base64.b64encode(open(f"styles_out/people/{style}.png", "rb").read()).decode()
prompt = ("Redraw this reference image as a beautiful, polished illustration. Keep the exact same composition, camera angle and layout: a young man in a blue jacket waving, standing in front of a small house with a red roof, a red car on the right, a road in the foreground, trees on the sides. "
          "Style: " + STYLES[style] + ". Much richer detail and nicer lighting than the reference, friendly character face with eyes and eyebrows, no text, no watermark.")
body = json.dumps({"contents": [{"parts": [{"inlineData": {"mimeType": "image/png", "data": ref}}, {"text": prompt}]}],
                   "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}}}).encode()
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", body,
        {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
try: img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
except Exception: sys.exit("no image: " + json.dumps(d)[:400])
out = f"styles_out/gemini/{style}.png"; open(out, "wb").write(base64.b64decode(img)); open("styles_out/gemini/ledger.txt", "a").write(f"image {out} 0.067\n"); print("ok", out)
