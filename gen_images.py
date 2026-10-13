"""Generates the stills for the 25-30 s test via Gemini image generation -> frames_ai/NN.png.
usage: python3 gen_images.py [model]   (default gemini-2.5-flash-image)
Key: uses GEMINI_API_KEY if set, otherwise relies on the agent proxy injecting it."""
import os, sys, json, base64, urllib.request, urllib.error
MODEL = sys.argv[1] if len(sys.argv) > 1 else "gemini-2.5-flash-image"
STYLE = ("Photorealistic photograph, shot on a full-frame DSLR with a 50mm lens, natural skin texture and pores, "
         "real human proportions, realistic fabric and hair, documentary film still, muted natural colors, soft natural light, "
         "subtle film grain, vertical 9:16 composition, not a painting, not an illustration, not CGI, no text, no watermark. ")
SHOTS = [  # (file, start-in-test-seconds is set in assemble_test.py)
 "A young man with a suitcase at a weathered wooden garden gate of a small village house, early morning mist.",
 "Close-up: an elderly grandmother's hand holding the sleeve of a young man's jacket at the gate, tender and reluctant to let go.",
 "The grandmother alone at the gate, small figure in a headscarf watching a road, morning light behind her.",
 "A young man in a foreign city at night, laptop glowing, work and friends' messages on the screen, phone face down on the table.",
 "A wall calendar with Sundays, pages turning, one by one crossed out, a silent black telephone in the foreground.",
 "A young man at a window of a rented flat, an untouched phone in his hand, rain and city lights outside, guilt in his face.",
]
os.makedirs("frames_ai", exist_ok=True)
url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"
hdr = {"Content-Type": "application/json"}
if os.environ.get("GEMINI_API_KEY"): hdr["x-goog-api-key"] = os.environ["GEMINI_API_KEY"]
for n, p in enumerate(SHOTS, 1):
    out = f"frames_ai/{n:02d}.png"
    if os.path.exists(out): continue
    body = json.dumps({"contents": [{"parts": [{"text": STYLE + p}]}],
                       "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "9:16"}}}).encode()
    try:
        d = json.load(urllib.request.urlopen(urllib.request.Request(url, body, hdr), timeout=180))
    except urllib.error.HTTPError as e:
        sys.exit(f"ERR {n}: {e.code} {e.read()[:300]}")
    img = next(x["inlineData"]["data"] for c in d["candidates"] for x in c["content"]["parts"] if "inlineData" in x)
    open(out, "wb").write(base64.b64decode(img)); print("ok", out)
