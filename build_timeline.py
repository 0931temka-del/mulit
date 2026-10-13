"""Builds web/timeline.json from audio/narr_*.json: section offsets, caption chunks,
quoted-speech word intervals (for lip-sync), word cues and phone beeps."""
import json, re, subprocess
LEAD, GAPS, OUTRO = 1.0, [1.0, 1.2, 1.2, 1.5], 5.5
def dur(i):
    return float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f"audio/narr_{i}.mp3"]))
QUOTES = {
 1: {"grandma": ["Звони мне по воскресеньям", "Просто чтобы я слышала голос"]},
 3: {"neighbor": ["Это ты?", "Она все эти воскресенья ждала у телефона. С самого утра. Говорила: вдруг он позвонит, а я на кухне."]},
 4: {"grandma": ["Это ты, мой хороший?", "Ничего. Ты же занят. Я всё понимаю."]},
}
CUES = {2: {"one": "Один раз", "two": "Второй.", "three": "Третий."},
        3: {"trubku": "Трубку"},
        5: {"one": "Один.", "two": "Второй.", "three": "Третий."}}
t = LEAD; secs = []
for i in range(1, 6):
    a = json.load(open(f"audio/narr_{i}.json", encoding="utf8")); D = dur(i)
    txt = "".join(a["chars"]); st, en = a["start"], a["end"]
    # sentences
    sents = []; pos = 0
    for m in re.finditer(r"[.?!»]\s+|$", txt):
        seg = txt[pos:m.end()]
        if seg.strip():
            s0 = pos + (len(seg) - len(seg.lstrip())); e0 = m.end() - 1 - (len(seg) - len(seg.rstrip()))
            sents.append((s0, max(s0, e0)))
        pos = m.end()
    caps, sl = [], []
    for k, (s0, e0) in enumerate(sents, 1):
        text = txt[s0:e0+1].strip().lstrip("—").strip()
        sl.append({"k": k, "t0": t + st[s0], "t1": t + en[e0], "text": text})
        parts = [(s0, e0)]
        if e0 - s0 > 62:  # split long sentence at a comma near the middle
            cs = [j for j in range(s0+10, e0-10) if txt[j] == "," ]
            if cs:
                c = min(cs, key=lambda j: abs(j - (s0+e0)/2)); parts = [(s0, c), (c+1, e0)]
        for (p0, p1) in parts:
            while p0 < p1 and txt[p0] in " —": p0 += 1
            caps.append({"t0": t + st[p0], "t1": t + en[p1] + 0.25, "text": txt[p0:p1+1].strip().lstrip("—").strip()})
    speech = {}
    for who, subs in QUOTES.get(i, {}).items():
        for sub in subs:
            q = txt.find(sub); assert q >= 0, sub
            for m in re.finditer(r"\S+", sub):
                w0, w1 = q + m.start(), q + m.end() - 1
                speech.setdefault(who, []).append([t + st[w0] - 0.03, t + en[w1] + 0.05])
    cues = {}
    for name, sub in CUES.get(i, {}).items():
        q = txt.find(sub); assert q >= 0, sub; cues[name] = t + st[q]
    secs.append({"i": i, "t0": t, "D": D, "sentences": sl, "captions": caps, "speech": speech, "cues": cues})
    t += D + (GAPS[i-1] if i < 5 else 0)
total = t + OUTRO
s3, s5 = secs[2], secs[4]
beeps, b = [], s3["t0"] + 0.4
while b < s3["cues"]["trubku"] - 0.9: beeps.append([b, 0.8]); b += 2.0
s3["pickup"] = s3["cues"]["trubku"] + 0.9
for n in ("one", "two", "three"): beeps.append([s5["cues"][n], 0.75])
json.dump({"fps": 24, "total": total, "sections": secs, "beeps": beeps}, open("web/timeline.json", "w"), ensure_ascii=False, indent=1)
print("total", round(total, 1))
for s in secs:
    print("S%d t0=%.1f D=%.1f" % (s["i"], s["t0"], s["D"]))
    for x in s["sentences"]: print("   %d  %.1f-%.1f  %s" % (x["k"], x["t0"], x["t1"], x["text"][:60]))
