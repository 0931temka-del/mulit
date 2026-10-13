"""Картинки для ролика 'Что если Земля остановится'. usage: python3 gen.py N [суффикс]  -> img/NN.png ; учёт в ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error
MODEL = "gemini-3.1-flash-image"
STYLE = ("Photorealistic cinematic still, shot on ARRI Alexa with 35mm lens, real physics, natural light, "
         "high dynamic range, fine film grain, vertical 9:16 composition, no text, no watermark, no people close-up, not CGI-looking, not an illustration. ")
SHOTS = {
 1: "Planet Earth seen from low orbit, thin glowing blue atmosphere, sunrise edge over the curve of the planet, city lights on the night side, deep black space with stars.",
 2: "A calm coastal megacity street at golden sunrise, small distant pedestrians, parked cars, palm trees, the sea behind the skyline, quiet peaceful morning, wide shot.",
 3: "A wide highway at the equator at dawn, cars and trucks on the road, a moment before disaster: dust rising from the ground, trees leaning forward, the sky strangely tense.",
 4: "A gigantic ocean wave, hundreds of metres tall, rolling over a coastal city with skyscrapers, dramatic stormy sky, spray and mist, epic disaster-film still.",
 5: "Skyscrapers in a violent hurricane wind, debris and shattered glass flying horizontally through the air, dark dramatic clouds, a city being swept away, low angle.",
 6: "Planet Earth from space, one half brightly lit by the sun, the other half completely dark, a thin line between day and night, silent and haunting.",
}
n = int(sys.argv[1]); suf = sys.argv[2] if len(sys.argv) > 2 else ""
out = f"img/{n:02d}{suf}.png"
body = json.dumps({"contents": [{"parts": [{"text": STYLE + SHOTS[n]}]}],
                   "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
req = urllib.request.Request(f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent", body,
        {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
open(out, "wb").write(base64.b64decode(img)); open("ledger.txt", "a").write(f"image {out} 0.067\n"); print("ok", out)
