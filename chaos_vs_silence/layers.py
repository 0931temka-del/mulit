# нарезка слоя хаоса (0-19 с) и слоя тишины (30 с), 1080x1920, 30 к/с
import subprocess, os, json, random
W="/home/user/cvs_work"; C=W+"/clips"; S=W+"/seg"
os.makedirs(S, exist_ok=True)
random.seed(7)
dur={88921:21,23258:18,304045:8,64594:16.8,142641:8.7,19627:16.5}
order=[88921,304045,23258,64594,19627,142641]
cuts=[]; t=0; d=1.4; i=0
while t<19-0.01:
    dd=round(max(0.4,d),2); dd=min(dd,19-t); cuts.append((order[i%6],dd)); t+=dd; d-=0.06; i+=1
segs=[]
for n,(cid,dd) in enumerate(cuts):
    off=round(random.uniform(0.3,max(0.4,dur[cid]-dd-0.4)),2)
    x0=random.choice([300,700,1100,1500,1900]); dx=random.choice([-200,200,300,-300])
    x0=max(0,min(2625-abs(dx),x0))
    xe=f"{x0}+({dx})*t/{dd}"
    f=f"{S}/c{n:02d}.mp4"
    subprocess.run(["ffmpeg","-y","-v","error","-ss",str(off),"-t",str(dd),"-i",f"{C}/{cid}.mp4","-vf",
      f"fps=30,scale=-2:2160,crop=1215:2160:x='{xe}':y=0,scale=1080:1920,eq=contrast=1.12:saturation=1.25,colorbalance=rs=.05:bs=.06,setsar=1",
      "-an","-c:v","libx264","-preset","veryfast","-crf","16","-pix_fmt","yuv420p",f],check=True)
    segs.append(f)
open(S+"/chaos.txt","w").write("".join(f"file '{s}'\n" for s in segs))
subprocess.run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",S+"/chaos.txt","-c","copy",W+"/chaos.mp4"],check=True)
# тишина
plan=[(189189,1.0,6.6),(143419,2.0,6.6),(317408,1.0,6.6),(332531,0.0,12.0)]
fl=[]; ins=[]
for k,(cid,off,dd) in enumerate(plan):
    ins+=["-ss",str(off),"-t",str(dd),"-i",f"{C}/{cid}.mp4"]
    if cid==332531: crop="scale=1080:1920"
    else: crop="scale=-2:1920,crop=1080:1920:x='(iw-1080)/2+((iw-1080)/2)*0.5*sin(t*0.3)':y=0"
    fl.append(f"[{k}:v]fps=30,{crop},eq=saturation=0.85:brightness=0.0,colorbalance=rs=.04:bs=-.03,setsar=1,format=yuv420p[v{k}]")
# xfade 0.6 с
fl.append("[v0][v1]xfade=transition=fade:duration=0.6:offset=6.0[x1]")
fl.append("[x1][v2]xfade=transition=fade:duration=0.6:offset=12.0[x2]")
fl.append("[x2][v3]xfade=transition=fade:duration=0.6:offset=18.0[x3]")
subprocess.run(["ffmpeg","-y","-v","error"]+ins+["-filter_complex",";".join(fl),"-map","[x3]","-t","30","-an","-c:v","libx264","-preset","veryfast","-crf","16","-pix_fmt","yuv420p",W+"/calm.mp4"],check=True)
print("ok", len(cuts),"cuts")
