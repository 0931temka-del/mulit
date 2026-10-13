import os, sys, json, base64, urllib.request, urllib.error, wave
text = open("narr.txt", encoding="utf8").read().strip()
prompt = "Говори по-русски низким, напряжённым голосом документалиста, с драматичными паузами, темп чуть быстрее обычного: " + text
body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["AUDIO"],
   "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Charon"}}}}}).encode()
r = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", body,
    {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(r, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {e.code} {e.read()[:300]}")
pcm = base64.b64decode(next(x["inlineData"]["data"] for x in d["candidates"][0]["content"]["parts"] if "inlineData" in x))
w = wave.open("narr.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm); w.close()
open("ledger.txt", "a").write("tts narr.wav 0.02\n"); print("ok", len(pcm) / 48000, "s")
