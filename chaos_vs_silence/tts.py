import os, sys, json, base64, urllib.request, urllib.error, wave
OUT = sys.argv[1] if len(sys.argv) > 1 else "/home/user/cvs_work/audio"
os.makedirs(OUT, exist_ok=True)
lines = {
 "v1": "Your brain, right now.",
 "v2": "Above, your day. Below, silence.",
 "v3": "Where did you look first?",
 "v4": "You already chose.",
 "v5": "Up or down? Tell me in the comments. Silence is waiting on the channel.",
}
for k, t in lines.items():
    prompt = "Say in a calm, warm, low, intimate human voice, slow and unhurried, like a quiet narrator: " + t
    body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["AUDIO"],
      "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Charon"}}}}}).encode()
    r = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", body,
        {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
    try: d = json.load(urllib.request.urlopen(r, timeout=240))
    except urllib.error.HTTPError as e: sys.exit(f"ERR {k} {e.code} {e.read()[:300]}")
    pcm = base64.b64decode(next(x["inlineData"]["data"] for x in d["candidates"][0]["content"]["parts"] if "inlineData" in x))
    w = wave.open(f"{OUT}/{k}.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm); w.close()
    print(k, len(pcm)/48000, "s")
open("ledger.txt", "a").write("tts 5 phrases 0.02\n")
