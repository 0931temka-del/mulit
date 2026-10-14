set -e
V="scale=1080:1920:flags=lanczos,setsar=1,fps=24,format=yuv420p"
d1=6.0; d2=6.5; d3=6.0; d4=7.0; T=$(echo "$d1+$d2+$d3+$d4" | bc)
ffmpeg -v error -y -i clips/01.mp4 -i clips/02.mp4 -i clips/03.mp4 -i clips/04.mp4 -i music.wav -filter_complex \
"[0:v]trim=0:$d1,setpts=PTS-STARTPTS,$V[v0];[1:v]trim=0:$d2,setpts=PTS-STARTPTS,$V[v1];[2:v]trim=0:$d3,setpts=PTS-STARTPTS,$V[v2];[3:v]trim=0:$d4,setpts=PTS-STARTPTS,$V[v3];\
[0:a]atrim=0:$d1,asetpts=PTS-STARTPTS,aresample=44100,afade=t=out:st=$(echo "$d1-0.2"|bc):d=0.2[a0];[1:a]atrim=0:$d2,asetpts=PTS-STARTPTS,aresample=44100,afade=t=in:d=0.2,afade=t=out:st=$(echo "$d2-0.2"|bc):d=0.2[a1];\
[2:a]atrim=0:$d3,asetpts=PTS-STARTPTS,aresample=44100,afade=t=in:d=0.2,afade=t=out:st=$(echo "$d3-0.2"|bc):d=0.2[a2];[3:a]atrim=0:$d4,asetpts=PTS-STARTPTS,aresample=44100,afade=t=in:d=0.2,afade=t=out:st=$(echo "$d4-1.0"|bc):d=1.0[a3];\
[v0][v1][v2][v3]concat=n=4:v=1:a=0[v];[a0][a1][a2][a3]concat=n=4:v=0:a=1,volume=0.45[sfx];\
[4:a]atrim=0:$T,afade=t=in:d=0.6,afade=t=out:st=$(echo "$T-1.8"|bc):d=1.8,volume=0.85[m];[sfx][m]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
 -map "[v]" -map "[a]" -t $T -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart final.mp4
ffmpeg -v error -y -i final.mp4 -c:v libx264 -crf 24 -c:a aac -b:a 128k -movflags +faststart final_small.mp4
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of csv=p=0 final.mp4; du -h final.mp4 final_small.mp4
