"""Оживление кадра в Veo 3.1 Fast. usage: python3 veo.py N  -> clips/NN.mp4 ; учёт в ledger.txt"""
import os, sys, json, base64, time, urllib.request, urllib.error
MODEL = "veo-3.1-fast-generate-preview"; K = os.environ["GEMINI_API_KEY"]
BASE = "https://generativelanguage.googleapis.com/v1beta/"
P = {1: 'The LEGO copper convertible slowly rolls forward and stops at the hotel entrance, the LEGO doorman and the valet step toward the car, palm leaves sway gently in the breeze, soft sunlight flickers on the stone floor, smooth cinematic camera slowly pushing in. Natural toy-brick stop-motion feel, no speech, no text.', 2: "The LEGO hero minifigure swings his legs out of the open car door, stands up from the seat and steps onto the stone floor holding a paper cup, the valet holds the door, the pink vest slides off the seat back into the hero's hand, camera stays steady with a slight handheld feel. Natural toy-brick movement, no speech, no text.", 3: 'The LEGO hero puts on the pink textured vest, adjusts the collar, hands a small bill to the LEGO valet with a nod, the valet nods back and bows slightly, soft sunlight, camera slowly orbits a little to the right. Natural toy-brick movement, no speech, no text.', 4: 'The LEGO hero in the pink vest walks away from the camera across the sunlit stone floor toward the glass revolving door of the hotel, the doorman in the white shirt steps aside, the glass door slowly rotates, the copper convertible stays parked at the side, camera follows slowly from behind. Natural toy-brick movement, no speech, no text.'}
n = int(sys.argv[1])
def call(url, body=None):
    r = urllib.request.Request(url, json.dumps(body).encode() if body else None, {"Content-Type": "application/json", "x-goog-api-key": K})
    return json.load(urllib.request.urlopen(r, timeout=300))
img = base64.b64encode(open("a1.png", "rb").read()).decode()
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
open("clip_fast.mp4", "wb").write(urllib.request.urlopen(r, timeout=300).read())
open("ledger.txt", "a").write(f"veo-fast clip_fast.mp4 0.80\n"); print("ok", n)
