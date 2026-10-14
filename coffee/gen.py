"""Картинки: python3 gen.py N [suffix]. Кадр 1 — эталон героини, остальные получают его как образец. Учёт в ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error
MODEL = "gemini-3.1-flash-image"
STYLE = ("Photorealistic candid photograph of a real person, shot on a full-frame DSLR 50mm lens, natural skin texture with pores, "
         "real human proportions and hands, natural hair and fabric, documentary film still, natural soft light, fine film grain, "
         "vertical 9:16, not a painting, not an illustration, not CGI, no text, no watermark. ")
HERO = "The same woman in every shot: about 32 years old, shoulder-length dark brown wavy hair, light olive skin, brown eyes, small mole on left cheek, wearing a cream knit sweater. "
SHOTS = {
 1: "Medium shot in a bright modern home kitchen in the morning: she holds a steaming coffee mug, looking at it thoughtfully, about to decide.",
 2: "Close-up of her hand pushing a coffee mug away on a wooden kitchen table next to a paper wall calendar with day 1 circled in red marker.",
 3: "Office desk, grey afternoon light: she sits tired with her hand on her forehead, headache, a laptop in front of her, a glass of water, no coffee.",
 4: "Bedroom at sunrise: she wakes up on her own, sits on the bed stretching her arms, soft golden light through the window, relaxed calm face.",
 5: "City park in the morning, she walks briskly in sportswear, bright confident smile, trees and warm sunlight, energetic and fresh.",
 6: "Close-up portrait of her smiling warmly at the camera, soft morning window light, shallow depth of field.",
}
n = int(sys.argv[1]); suf = sys.argv[2] if len(sys.argv) > 2 else ""
parts = []
if n != 1 and os.path.exists("img/01.png"):
    parts.append({"inlineData": {"mimeType": "image/png", "data": base64.b64encode(open("img/01.png", "rb").read()).decode()}})
    parts.append({"text": "Use the woman in this reference photo: keep exactly the same face, hair, skin and sweater. "})
parts.append({"text": STYLE + HERO + SHOTS[n]})
body = json.dumps({"contents": [{"parts": parts}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", body,
        {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
try: img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
except Exception: sys.exit("no image: " + json.dumps(d)[:400])
out = f"img/{n:02d}{suf}.png"; open(out, "wb").write(base64.b64decode(img)); open("ledger.txt", "a").write(f"image {out} 0.067\n"); print("ok", out)
