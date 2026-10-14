"""Оживление картинки в Veo. python3 veo_run.py картинка.png файл_промпта.txt выход.mp4 секунды [lite|fast]. Учёт: ledger.txt"""
import os, sys, json, base64, time, urllib.request, urllib.error
img_path, prompt_path, out, dur = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]); tier = sys.argv[5] if len(sys.argv) > 5 else "lite"
MODEL = f"veo-3.1-{tier}-generate-preview"; PRICE = {"lite": 0.05, "fast": 0.10}[tier] * dur; K = os.environ["GEMINI_API_KEY"]; BASE = "https://generativelanguage.googleapis.com/v1beta/"
def call(url, body=None):
    r = urllib.request.Request(url, json.dumps(body).encode() if body else None, {"Content-Type": "application/json", "x-goog-api-key": K}); return json.load(urllib.request.urlopen(r, timeout=300))
img = base64.b64encode(open(img_path, "rb").read()).decode(); prompt = open(prompt_path, encoding="utf8").read().strip()
try: op = call(BASE + f"models/{MODEL}:predictLongRunning", {"instances": [{"prompt": prompt, "image": {"bytesBase64Encoded": img, "mimeType": "image/png"}}], "parameters": {"aspectRatio": "9:16", "durationSeconds": dur, "resolution": "720p"}})
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
name = op["name"]; print("started", out, flush=True)
for _ in range(120):
    time.sleep(10); d = call(BASE + name)
    if d.get("done"): break
if not d.get("done"): sys.exit("timeout")
if "error" in d: sys.exit(f"ERR {d['error']}")
resp = d["response"].get("generateVideoResponse", d["response"])
try: uri = resp["generatedSamples"][0]["video"]["uri"]
except Exception: sys.exit("no video: " + json.dumps(d)[:400])
open(out, "wb").write(urllib.request.urlopen(urllib.request.Request(uri, headers={"x-goog-api-key": K}), timeout=300).read())
open("ledger.txt", "a").write(f"veo-{tier} {out} {PRICE:.2f}\n"); print("ok", out)
