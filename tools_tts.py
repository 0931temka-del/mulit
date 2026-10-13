"""Narration -> per-scene mp3 + character-level alignment json (ElevenLabs with-timestamps)."""
import os, re, json, base64, urllib.request, sys
key = os.environ["ELEVENLABS_API_KEY"]
voice, model = sys.argv[1], sys.argv[2]
text = open("script/narration.md", encoding="utf8").read()
parts = re.split(r"^## \d+\. .*$", text, flags=re.M)[1:]
for i, p in enumerate(parts, 1):
    p = " ".join(l.strip() for l in p.strip().splitlines())
    body = json.dumps({"text": p, "model_id": model, "language_code": "ru",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75, "style": 0.3}}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
        data=body, headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=180))
    except urllib.error.HTTPError as e:
        print("ERR", i, e.code, e.read()[:300]); sys.exit(1)
    open(f"audio/narr_{i}.mp3", "wb").write(base64.b64decode(d["audio_base64"]))
    a = d["alignment"]
    json.dump({"text": p, "chars": a["characters"], "start": a["character_start_times_seconds"],
               "end": a["character_end_times_seconds"]}, open(f"audio/narr_{i}.json", "w"), ensure_ascii=False)
    print("ok", i, round(a["character_end_times_seconds"][-1], 2))
