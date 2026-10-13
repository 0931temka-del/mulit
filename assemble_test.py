"""Builds out/test_ai.mp4 (~29 s): scene 1 + scene 2 up to 'Третий.' over frames_ai/*.png with slow Ken Burns."""
import subprocess, os, glob
os.makedirs("out", exist_ok=True)
imgs = sorted(glob.glob("frames_ai/*.png")); assert len(imgs) == 6, "run gen_images.py first"
# narration: 1.0 lead + scene1 (12.4) + 1.0 gap + scene2 (first 15.0 s)
T = 29.4; seg = [0, 4.5, 8.5, 14.0, 19.0, 24.0, T]
fl, ins = [], []
for k, im in enumerate(imgs):
    d = seg[k+1] - seg[k]; fr = int(d * 24) + 12
    ins += ["-loop", "1", "-t", f"{d+.5:.2f}", "-i", im]
    z = "min(zoom+0.0008,1.12)" if k % 2 == 0 else "if(eq(on,0),1.12,max(zoom-0.0008,1.0))"
    fl.append(f"[{k}:v]scale=2560:-1,zoompan=z='{z}':d={fr}:s=1280x720:fps=24,trim=0:{d:.2f},setpts=PTS-STARTPTS,fade=t=in:d=.5[v{k}]")
fl.append("".join(f"[v{k}]" for k in range(6)) + "concat=n=6:v=1[v]")
a = len(imgs)
ins += ["-i", "audio/narr_1.mp3", "-i", "audio/narr_2.mp3", "-i", "audio/music_1.mp3"]
fl.append(f"[{a}:a]adelay=1000|1000[n1];[{a+1}:a]atrim=0:15.0,adelay=14400|14400[n2];"
          f"[{a+2}:a]volume=.18,afade=t=in:d=2,afade=t=out:st={T-3}:d=3[m];"
          f"[n1][n2][m]amix=inputs=3:normalize=0:duration=longest,atrim=0:{T}[a]")
subprocess.run(["ffmpeg", "-y", "-v", "error", *ins, "-filter_complex", ";".join(fl), "-map", "[v]", "-map", "[a]",
                "-t", str(T), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "out/test_ai.mp4"], check=True)
print("ok out/test_ai.mp4")
