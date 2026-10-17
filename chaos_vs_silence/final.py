import subprocess, os
W="/home/user/cvs_work"; CAP=W+"/caps"; os.makedirs(CAP,exist_ok=True)
F="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# (текст, t0, t1, y, размер)
caps=[("YOUR BRAIN",0.2,1.5,760,96),("RIGHT NOW",0.2,1.5,880,96),
 ("ABOVE: YOUR DAY",3.4,9.5,640,64),("BELOW: SILENCE",3.4,9.5,1220,64),
 ("WHERE DID YOU",10.0,13.0,520,84),("LOOK FIRST?",10.0,13.0,630,84),
 ("YOU ALREADY",19.0,22.5,740,96),("CHOSE.",19.0,22.5,860,96),
 ("TEST #1",22.8,30,420,60),("UP OR DOWN?",22.8,30,560,90),("WHICH HALF DID YOU WATCH?",22.8,30,700,48),
 ("COMMENT BELOW",22.8,30,780,48),("LONG FOCUS WORLDS",24.5,30,1260,50),("ON THE CHANNEL",24.5,30,1330,50)]
dt=[]
for i,(tx,a,b,y,s) in enumerate(caps):
    p=f"{CAP}/{i}.txt"; open(p,"w").write(tx)
    dt.append(f"drawtext=fontfile={F}:textfile={p}:fontsize={s}:fontcolor=white:x=(w-text_w)/2:y={y}:box=1:boxcolor=black@0.5:boxborderw=18:borderw=0:shadowcolor=black@0.7:shadowx=2:shadowy=2:enable='between(t,{a},{b})'")
fc=(f"[0:v]tpad=stop_mode=clone:stop_duration=12,trim=duration=30,setpts=PTS-STARTPTS,format=gbrp[ch];"
    f"[1:v]format=gbrp[ca];[2:v]format=gray[mk];"
    f"[ca][ch][mk]maskedmerge[m];"
    f"[3:v]format=gbrp[gl];[m]format=gbrp[mm];[mm][gl]blend=all_mode=screen[g];"
    f"[g]vignette=PI/5,noise=alls=7:allf=t,format=yuv420p,"+",".join(dt)+"[v]")
subprocess.run(["ffmpeg","-y","-v","error","-i",W+"/chaos.mp4","-i",W+"/calm.mp4","-i",W+"/mask.mkv","-i",W+"/glow.mkv","-i",W+"/mix.wav",
  "-filter_complex",fc,"-map","[v]","-map","4:a","-af","loudnorm=I=-14:TP=-1.5:LRA=11","-r","30","-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p","-c:a","aac","-b:a","192k","-t","30",W+"/final.mp4"],check=True)
print("ok")
