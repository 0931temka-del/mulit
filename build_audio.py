"""Mixes narration, SFX, synthesized phone beeps and ducked music into audio/mix.wav."""
import json, subprocess, itertools
TL = json.load(open("web/timeline.json", encoding="utf8")); sec = TL["sections"]; T = TL["total"]
ins, fl, uid = [], [], itertools.count()
def inp(path, lavfi=False):
    ins.extend((["-f", "lavfi"] if lavfi else []) + ["-i", path]); return ins.count("-i") - 1
def clip(path, t, vol=1.0, dur=None, fade=0.0, lavfi=False, fin=0.0):
    i, lab = inp(path, lavfi), f"c{next(uid)}"; f = f"[{i}:a]"
    if dur: f += f"atrim=0:{dur:.3f},asetpts=PTS-STARTPTS,"
    if fin: f += f"afade=t=in:d={fin},"
    if fade: f += f"afade=t=out:st={max(0, (dur or 0) - fade):.3f}:d={fade},"
    fl.append(f + f"volume={vol},adelay={int(t*1000)}|{int(t*1000)}[{lab}]"); return lab
mix = lambda labs, name: fl.append("".join(f"[{l}]" for l in labs) + f"amix=inputs={len(labs)}:normalize=0:duration=longest[{name}]")
s = lambda i, k: sec[i-1]["sentences"][k-1]["t0"]
mix([clip(f"audio/narr_{x['i']}.mp3", x["t0"]) for x in sec], "narr0"); fl.append(f"[narr0]apad=whole_dur={T:.3f}[narr]")
sfx = [clip("audio/sfx_gate.mp3", .6, .55, 4.6, .6),
       clip("audio/sfx_airport.mp3", s(1, 4) + .3, .30, 7, 1.5),
       clip("audio/sfx_clock.mp3", s(2, 8) - .2, .45, 6.8, 1.0),
       clip("audio/sfx_handset.mp3", sec[2]["pickup"] - .3, .8),
       clip("audio/sfx_handset.mp3", sec[3]["t0"] + 1.0, .7),
       clip("audio/sfx_wind.mp3", s(4, 11) - .2, .45, 7, 1.8),
       clip("audio/sfx_clock.mp3", s(3, 5), .30, 7.5, 1.0)]
for b, d in TL["beeps"]:  # 425 Hz ringback tone, synced to the story / visual ripples
    sfx.append(clip(f"sine=f=425:d={d}", b, .22, d, .1, lavfi=True, fin=.03))
mix(sfx, "sfx")
mus = [inp(f"audio/music_{n}.mp3") for n in (1, 2, 3, 1, 2)]
cur = f"[{mus[0]}:a]"
for k, m in enumerate(mus[1:], 1):
    fl.append(f"{cur}[{m}:a]acrossfade=d=2:c1=tri:c2=tri[mx{k}]"); cur = f"[mx{k}]"
fl.append(f"{cur}atrim=0:{T:.3f},afade=t=in:d=3,afade=t=out:st={T-6:.3f}:d=6,volume=.75[music]")
fl += ["[narr]asplit[n1][n2]", "[music][n2]sidechaincompress=threshold=0.015:ratio=7:attack=40:release=700[duck]",
       "[n1][sfx][duck]amix=inputs=3:normalize=0,alimiter=limit=0.95,loudnorm=I=-16:TP=-1.5:LRA=11[out]"]
subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(fl), "-map", "[out]", "-t", f"{T:.3f}", "-ar", "44100", "audio/mix.wav"], check=True)
print("mix ok", round(T, 1))
