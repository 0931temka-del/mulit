import os, json, urllib.request, sys
key = os.environ["ELEVENLABS_API_KEY"]
def post(url, payload, out):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
        headers={"xi-api-key": key, "Content-Type": "application/json"})
    try:
        open(out, "wb").write(urllib.request.urlopen(req, timeout=300).read()); print("ok", out)
    except urllib.error.HTTPError as e:
        print("ERR", out, e.code, e.read()[:300])
S = "https://api.elevenlabs.io/v1/sound-generation"
sfx = {
 "sfx_dialtone": ("Old rotary phone: long ringing tone, slow beeps, calm and lonely, no voices", 8),
 "sfx_gate": ("Creaky wooden garden gate opening and closing, quiet village morning, birds far away", 5),
 "sfx_airport": ("Distant airport ambience, soft announcement murmur, rolling suitcase, muffled", 8),
 "sfx_clock": ("Quiet kitchen with slow ticking wall clock, room tone, lonely", 10),
 "sfx_handset": ("Phone handset picked up and put against ear, soft click", 2),
 "sfx_wind": ("Soft evening wind outside a window, gentle, melancholic", 10),
}
for k,(t,d) in sfx.items(): post(S, {"text": t, "duration_seconds": d, "prompt_influence": 0.5}, f"audio/{k}.mp3")
post("https://api.elevenlabs.io/v1/music", {"prompt": "Sad, intimate solo piano with soft warm strings, slow tempo, minimal, emotional documentary storytelling, no vocals, gentle build and a quiet fade out", "music_length_ms": 110000}, "audio/music.mp3")
