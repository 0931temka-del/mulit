import os, json, urllib.request
key = os.environ["ELEVENLABS_API_KEY"]
prompts = [
 "Sad slow solo piano, soft sustained notes, sparse melody in minor key, intimate, warm room, no drums, no vocals",
 "Melancholic slow piano with a faint soft string pad underneath, gentle, emotional, minimal, no drums, no vocals",
 "Very quiet delicate piano, a few lonely notes with long reverb, tender, sorrowful, no drums, no vocals",
]
for i,p in enumerate(prompts,1):
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation",
        data=json.dumps({"text": p, "duration_seconds": 22, "prompt_influence": 0.6}).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"})
    open(f"audio/music_{i}.mp3","wb").write(urllib.request.urlopen(req, timeout=300).read()); print("ok",i)
