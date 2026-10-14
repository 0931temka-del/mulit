"""Озвучка по строкам: voice/NN.wav (Gemini TTS, голос Puck). Учёт в ledger.txt"""
import os, sys, json, base64, urllib.request, urllib.error, wave
lines = json.load(open("lines.json", encoding="utf8")); n = int(sys.argv[1]); text = lines[n]["text"]
prompt = "Говори по-русски бодро и дружелюбно, как ведущий коротких познавательных роликов, живо, без пафоса: " + text
body = json.dumps({"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"responseModalities": ["AUDIO"],
   "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": "Puck"}}}}}).encode()
r = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent", body,
    {"Content-Type": "application/json", "x-goog-api-key": os.environ["GEMINI_API_KEY"]})
try: d = json.load(urllib.request.urlopen(r, timeout=240))
except urllib.error.HTTPError as e: sys.exit(f"ERR {n} {e.code} {e.read()[:200]}")
pcm = base64.b64decode(next(x["inlineData"]["data"] for x in d["candidates"][0]["content"]["parts"] if "inlineData" in x))
w = wave.open(f"voice/{n}.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm); w.close()
open("ledger.txt", "a").write(f"tts {n} 0.004\n"); print("ok", n, round(len(pcm) / 48000, 2), "s")
