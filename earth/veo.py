"""Оживление кадра в Veo 3.1 Fast. usage: python3 veo.py N  -> clips/NN.mp4 ; учёт в ledger.txt"""
import os, sys, json, base64, time, urllib.request, urllib.error
MODEL = "veo-3.1-fast-generate-preview"; K = os.environ["GEMINI_API_KEY"]
BASE = "https://generativelanguage.googleapis.com/v1beta/"
P = {
 1: "Slow cinematic drift over planet Earth from orbit, the planet's rotation gently slows and comes to a complete stop, atmosphere glow pulsing softly. Deep space ambience, no voices.",
 3: "The highway suddenly goes wrong: the ground stops but cars and trucks keep sliding forward uncontrollably, dust and debris surge forward, trees bend, vehicles tumble. Realistic physics, handheld cinematic camera, rumbling sound, no voices.",
 4: "The giant ocean wave slowly crashes into the coastal city, water engulfing skyscrapers, spray and mist, cinematic slow motion. Roaring water sound, no voices.",
 5: "Violent hurricane winds tear through the skyscrapers, debris and glass fly through the air, camera slowly tilts up. Howling wind sound, no voices.",
}
n = int(sys.argv[1])
def call(url, body=None):
    r = urllib.request.Request(url, json.dumps(body).encode() if body else None, {"Content-Type": "application/json", "x-goog-api-key": K})
    return json.load(urllib.request.urlopen(r, timeout=300))
img = base64.b64encode(open(f"img/{n:02d}.png", "rb").read()).decode()
try:
    op = call(BASE + f"models/{MODEL}:predictLongRunning", {"instances": [{"prompt": P[n], "image": {"bytesBase64Encoded": img, "mimeType": "image/png"}}],
        "parameters": {"aspectRatio": "9:16", "durationSeconds": 8, "resolution": "720p"}})
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:400]}")
name = op["name"]; print(n, "started", flush=True)
for _ in range(120):
    time.sleep(10); d = call(BASE + name)
    if d.get("done"): break
if not d.get("done"): sys.exit("timeout "+name)
if "error" in d: sys.exit(f"ERR {d['error']}")
resp = d["response"].get("generateVideoResponse", d["response"])
try: uri = resp["generatedSamples"][0]["video"]["uri"]
except Exception: sys.exit("no video: " + json.dumps(d)[:500])
r = urllib.request.Request(uri, headers={"x-goog-api-key": K})
open(f"clips/{n:02d}.mp4", "wb").write(urllib.request.urlopen(r, timeout=300).read())
open("ledger.txt", "a").write(f"veo-fast clips/{n:02d}.mp4 0.80\n"); print("ok", n)
