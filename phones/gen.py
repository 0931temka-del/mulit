"""Картинки ролика 'Телефон 2035': python3 gen.py N [suffix]. Учёт в ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error
MODEL = "gemini-3.1-flash-image"
STYLE = ("Photorealistic cinematic photograph, shot on a full-frame mirrorless camera 35mm lens, real materials, natural skin texture, "
         "real hands with five fingers, shallow depth of field, soft realistic light, fine film grain, vertical 9:16, "
         "not an illustration, not CGI-looking, no text, no logos, no watermark. ")
SHOTS = {
 1: "Close-up of a hand holding an ultra-thin transparent glass smartphone with a flexible screen that is unrolling from a small cylinder into a full display, soft glowing interface, blurred neon city at night behind.",
 2: "Macro shot of a futuristic slim phone lying on a dark desk, subtle holographic blue interface floating above its surface, reflections on the glass, premium product photography.",
 3: "A young man in his late 20s walks on a modern city street at dusk, speaking calmly toward a small slim device in his palm, a soft light ring glowing from the device, taxi lights in the blurred background.",
 4: "A young woman in her late 20s wearing sleek thin smart glasses on a bright city street, discreet small glowing interface reflections in the lenses, relaxed smile, modern architecture behind.",
 5: "A slim phone lying flat on a wooden table by a sunny window, no cables and no wires anywhere, sunlight falling on its surface, a small battery-charging glow on the screen, a hand about to pick it up, warm morning light.",
 6: "A person in smart glasses seen from behind, standing on a rooftop at golden sunset looking at a glowing city skyline, quiet and cinematic.",
}
n = int(sys.argv[1]); suf = sys.argv[2] if len(sys.argv) > 2 else ""
body = json.dumps({"contents": [{"parts": [{"text": STYLE + SHOTS[n]}]}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", body,
        {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
try: img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
except Exception: sys.exit("no image: " + json.dumps(d)[:400])
out = f"img/{n:02d}{suf}.png"; open(out, "wb").write(base64.b64decode(img)); open("ledger.txt", "a").write(f"image {out} 0.067\n"); print("ok", out)
