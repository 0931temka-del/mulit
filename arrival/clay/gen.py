"""Пластилиновые кадры «Приезд к отелю». python3 gen.py N  (1 — базовый, остальные берут его как образец; 5 берёт кадр 4). Учёт: ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error
STYLE = ("Handmade plasticine / modeling clay look: sculpted clay figures and sets with soft rounded shapes, visible fingerprints and slightly uneven surfaces, matte clay texture, "
         "warm sunny light, macro photography with shallow depth of field, vertical 9:16, characters large in the frame with whole bodies visible, no text, no logos, no brand badges. ")
HERO = "The hero: a clay man with sunglasses, black fitted t-shirt, wide black trousers and black slip-on shoes. The valet: a clay man in a black polo shirt and black trousers. "
CAR = "a long copper-bronze luxury open-top convertible with a tall chrome grille, black wheels and cream-white leather seats, sculpted from clay"
SHOTS = {
 1: STYLE + HERO + f"Medium-wide shot: {CAR} is parked at the entrance of a luxury hotel with a sand-colored facade and arches, clay palm trees, a red rope barrier on golden posts in the foreground. The valet stands beside the entrance. Only the valet is visible.",
 2: STYLE + HERO + f"Same scene and the same car. The car's rear-hinged door is swung open; the hero sits sideways in the driver's seat holding a paper cup, one foot on the ground in a shoe and one black slipper lying on the stone floor beside the car; a pink textured vest lies on the seat back; the valet stands beside the open door. Medium shot.",
 3: STYLE + HERO + f"Same scene and the same car. The hero now stands next to the open car door wearing the pink textured vest over his black t-shirt, holding the paper cup, looking confident. The valet stands next to him. Medium shot.",
 4: STYLE + HERO + f"Same scene and the same car parked behind them. The hero in the pink textured vest holds out a folded green bill toward the valet, who is about to take it. Only these two characters in a medium close shot, the car partly visible behind.",
 5: STYLE + HERO + f"Same hotel entrance, same copper car parked at the side. The hero in the pink textured vest walks away from the camera across the sunlit stone floor toward the glass revolving door of the hotel; a doorman in a white shirt stands beside the door. Wide shot from behind the hero.",
}
n = int(sys.argv[1]); ref = 1 if n in (2, 3, 4) else (4 if n == 5 else None); parts = []
if ref and os.path.exists(f"img{ref}.png"):
    parts.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open(f"img{ref}.png", "rb").read()).decode()}})
    parts.append({"text": "Keep exactly the same clay style, the same car, the same hotel and the same clay characters as in this reference image. "})
parts.append({"text": SHOTS[n]})
body = json.dumps({"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", body, {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
try: img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
except Exception: sys.exit("no image: " + json.dumps(d)[:400])
open(f"img{n}.png", "wb").write(base64.b64decode(img)); open("ledger.txt", "a").write(f"image img{n} 0.067\n"); print("ok", n)
