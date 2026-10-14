"""Оживление кадра в Veo 3.1 Fast. usage: python3 veo.py N  -> clips/NN.mp4 ; учёт в ledger.txt"""
import os, sys, json, base64, time, urllib.request, urllib.error
MODEL = "veo-3.1-lite-generate-preview"; K = os.environ["GEMINI_API_KEY"]
BASE = "https://generativelanguage.googleapis.com/v1beta/"
P = {
 1: "The thin transparent flexible screen smoothly unrolls from the small cylinder in the hand into a full glowing display, interface lights up, the camera slowly pushes in, neon city night blurred behind. Realistic motion, soft electronic ambience, no speech.",
 3: "The young man walks along the dusk street speaking calmly to the small device in his palm, the soft light ring pulses as it listens, a yellow taxi pulls up and stops beside him, he smiles and nods. Natural handheld camera, city street ambience, no speech.",
 4: "The young woman turns her head and smiles, tiny interface glints shimmer in the lenses of her smart glasses, she walks forward through the sunlit street, camera slowly tracking. Natural realistic movement, city ambience, no speech.",
 5: "The hand gently picks up the slim phone from the sunlit wooden table, the screen lights up showing a full battery, sunlight glints along the glass, shallow depth of field. Natural movement, quiet morning ambience, no speech.",
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
