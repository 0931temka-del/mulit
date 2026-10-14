"""Ключевые кадры ролика «Приезд к отелю» в стиле LEGO. python3 gen.py N  (кадры 2 и 3 берут предыдущий как образец). Учёт в ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error
MODEL = "gemini-3.1-flash-image"
STYLE = ("Built entirely from LEGO bricks, macro toy photography, glossy plastic, visible studs, tilt-shift shallow depth of field, bright sunny Dubai-like day, "
         "vertical 9:16 composition, no text, no logos, no brand badges, no watermark. ")
CAR = ("a long copper-bronze luxury open-top convertible with a tall chrome grille, black alloy wheels, cream-white leather seats and rear-hinged coach doors, all made of LEGO bricks")
SHOTS = {
 1: STYLE + f"Wide low-angle shot: {CAR} slowly pulls up under the entrance of a luxury hotel with a limestone and grey-stone facade, LEGO palm trees, a rope barrier on brass stanchions in the foreground, dappled sun and shadow on the stone floor.",
 2: STYLE + f"Same scene and the same car. The driver's rear-hinged door is swung wide open. A LEGO valet minifigure in a black polo shirt and black trousers stands beside the door, hand on it. A LEGO hero minifigure with sunglasses, a black t-shirt and black wide trousers sits in the cream-white driver's seat, one leg out of the car, a pink textured vest draped over the seat back. Medium shot, hotel wall behind.",
 3: STYLE + f"Same scene, same car with the door open, same valet and same hero minifigure. The hero now stands on the stone floor next to the car, holding a paper cup, the pink textured vest on his arm, looking confident, the valet beside him. Medium shot, palms and hotel behind.",
}
n = int(sys.argv[1]); parts = []
if n > 1 and os.path.exists(f"img/{n-1:02d}.png"):
    parts.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open(f"img/{n-1:02d}.png", "rb").read()).decode()}})
    parts.append({"text": "Keep exactly the same LEGO style, the same car, the same hotel and the same minifigures as in this reference image. "})
parts.append({"text": SHOTS[n]})
body = json.dumps({"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", body, {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
try: img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
except Exception: sys.exit("no image: " + json.dumps(d)[:400])
out = f"img/{n:02d}.png"; open(out, "wb").write(base64.b64decode(img)); open("ledger.txt", "a").write(f"image {out} 0.067\n"); print("ok", out)
