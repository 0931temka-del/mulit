"""python3 gen_img.py name 'prompt'  -> name.png (аниме-кадр, 9:16). Учёт: ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error
name, prompt = sys.argv[1], sys.argv[2]
body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent", body, {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(req, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
open(f"{name}.png", "wb").write(base64.b64decode(img)); open("ledger.txt", "a").write(f"image {name} 0.067\n"); print("ok", name)
