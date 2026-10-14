"""Оживление кадра в Veo 3.1 Fast. usage: python3 veo.py N  -> clips/NN.mp4 ; учёт в ledger.txt"""
import os, sys, json, base64, time, urllib.request, urllib.error
MODEL = "veo-3.1-lite-generate-preview"; K = os.environ["GEMINI_API_KEY"]
BASE = "https://generativelanguage.googleapis.com/v1beta/"
P = {
 1: "Natural handheld cinematic shot: the woman looks at the coffee mug in her hands, hesitates, then slowly sets the mug down on the counter and exhales with quiet resolve. Realistic natural movement, soft kitchen ambience, no speech.",
 3: "She rubs her forehead with a tired sigh, slowly lifts her head and looks at the laptop screen with a weary expression, then takes a sip of water. Realistic natural movement, quiet office ambience, no speech.",
 4: "She wakes up naturally, stretches her arms, takes a deep relaxed breath and smiles softly looking toward the sunrise window. Realistic natural movement, soft morning birdsong, no speech.",
 5: "She walks briskly along the park path toward the camera, smiling confidently, hair moving in the breeze, camera slowly tracking backwards. Realistic natural movement, birdsong and footsteps, no speech.",
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
open("ledger.txt", "a").write(f"veo-lite clips/{n:02d}.mp4 0.40\n"); print("ok", n)
