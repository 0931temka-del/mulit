set -e
F=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
V="scale=1080:1920:flags=lanczos,setsar=1,fps=24,format=yuv420p"
clip(){ ffmpeg -v error -y -i clips/$1.mp4 -t $2 -vf "$V" -af "volume=0.45,aresample=44100,apad" -ar 44100 -ac 2 -shortest -c:v libx264 -crf 17 -c:a aac seg/$3.mp4; }
still(){ ffmpeg -v error -y -loop 1 -framerate 24 -i img/$1.png -f lavfi -i anullsrc=r=44100:cl=stereo -t $2 \
   -vf "scale=1296:2304:flags=lanczos,zoompan=z='1+0.06*on/($2*24)':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=1:s=1080x1920:fps=24,format=yuv420p" \
   -c:v libx264 -crf 17 -c:a aac -shortest seg/$3.mp4; }
clip 01 8.0 a; still 02 3.0 b; clip 03 8.0 c; clip 04 8.0 d; clip 05 8.0 e; still 06 9.0 f
for s in a b c d e f; do echo "file seg/$s.mp4"; done > list.txt
ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy silent_mix.mp4
CAPS="$(eval echo \"$(cat caps.txt)\")"
ffmpeg -v error -y -i silent_mix.mp4 -i narr2.wav -filter_complex "[0:v]$CAPS[v];[1:a]aresample=44100,volume=1.5,apad[n];[0:a][n]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
  -map "[v]" -map "[a]" -t 44 -c:v libx264 -crf 18 -preset medium -c:a aac -b:a 192k -movflags +faststart final.mp4
ffmpeg -v error -y -i final.mp4 -c:v libx264 -crf 24 -c:a aac -b:a 128k -movflags +faststart final_small.mp4
ffprobe -v error -show_entries format=duration:stream=codec_type,width,height -of csv=p=0 final.mp4; du -h final.mp4 final_small.mp4
