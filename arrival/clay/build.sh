set -e
V="scale=1080:1920:flags=lanczos,setsar=1,fps=24,format=yuv420p"
clip(){ ffmpeg -v error -y -i $1 -t $2 -vf "$V" -af "aresample=44100,apad" -ar 44100 -ac 2 -shortest -c:v libx264 -crf 17 -c:a aac seg/$3.mp4; }
still(){ # img dur out zoom-expr x y
  ffmpeg -v error -y -loop 1 -framerate 24 -i $1 -f lavfi -i anullsrc=r=44100:cl=stereo -t $2 \
   -vf "scale=1296:2304:flags=lanczos,zoompan=z='$4':x='$5':y='$6':d=1:s=1080x1920:fps=24,format=yuv420p" -c:v libx264 -crf 17 -c:a aac -shortest seg/$3.mp4; }
N35=$((35*24/10))
clip clipA.mp4 6 a
still img2.png 3.5 b "1.0+0.12*on/$N35" "iw/2-(iw/zoom/2)" "ih*0.55-(ih/zoom*0.55)"
still img3.png 3.5 c "1.12-0.10*on/$N35" "iw/2-(iw/zoom/2)" "ih*0.5-(ih/zoom*0.5)"
still img4.png 3.5 d "1.0+0.14*on/$N35" "iw*0.45-(iw/zoom*0.45)" "ih*0.5-(ih/zoom*0.5)"
clip clipD.mp4 7 e
for s in a b c d e; do echo "file seg/$s.mp4"; done > list.txt
ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy silent_mix.mp4
T=$(ffprobe -v error -show_entries format=duration -of csv=p=0 silent_mix.mp4)
ffmpeg -v error -y -i silent_mix.mp4 -i ../music.wav -filter_complex "[0:a]volume=0.5[sfx];[1:a]atrim=0:$T,afade=t=in:d=0.6,afade=t=out:st=$(echo "$T-1.8"|bc):d=1.8,volume=0.85[m];[sfx][m]amix=inputs=2:normalize=0,alimiter=limit=0.95[a]" \
 -map 0:v -map "[a]" -t $T -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart final.mp4
ffmpeg -v error -y -i final.mp4 -c:v libx264 -crf 24 -c:a aac -b:a 128k -movflags +faststart final_small.mp4
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of csv=p=0 final.mp4; du -h final.mp4 final_small.mp4
