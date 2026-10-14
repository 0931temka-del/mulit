set -e
cd "$(dirname "$0")/.."
D=5; FPS=24; N=$((D*FPS))
mv_(){ # img out zoom-expr x-expr y-expr
  ffmpeg -v error -y -loop 1 -framerate $FPS -i styles_out/gemini/$1.png -t $D \
   -vf "scale=2880:1620:flags=lanczos,zoompan=z='$3':x='$4':y='$5':d=1:s=1920x1080:fps=$FPS,format=yuv420p" \
   -c:v libx264 -crf 17 demo_kenburns/$2.mp4; }
mv_ clay a "1.0+0.18*on/$N" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)"                                   # медленное приближение к дому
mv_ toon b "1.22-0.20*on/$N" "iw/2-(iw/zoom/2)" "ih/2-(ih/zoom/2)"                                  # отъезд
mv_ diorama c "1.18" "(iw-iw/zoom)*on/$N" "ih/2-(ih/zoom/2)"                                        # панорама слева направо
mv_ lego d "1.0+0.22*on/$N" "iw*0.30-(iw/zoom*0.30)" "ih*0.55-(ih/zoom*0.55)"                       # въезд на героя слева
X=0.6
ffmpeg -v error -y -i demo_kenburns/a.mp4 -i demo_kenburns/b.mp4 -i demo_kenburns/c.mp4 -i demo_kenburns/d.mp4 -filter_complex \
"[0][1]xfade=transition=fade:duration=$X:offset=$(echo "$D-$X"|bc)[x1];[x1][2]xfade=transition=fade:duration=$X:offset=$(echo "2*($D-$X)"|bc)[x2];[x2][3]xfade=transition=fade:duration=$X:offset=$(echo "3*($D-$X)"|bc),drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:textfile=demo_kenburns/cap.txt:fontsize=34:fontcolor=white:borderw=3:bordercolor=black@0.8:x=(w-text_w)/2:y=h-90:enable='between(t,0,3.5)'[v]" \
 -map "[v]" -r $FPS -c:v libx264 -crf 18 -pix_fmt yuv420p demo_kenburns/demo.mp4
ffprobe -v error -show_entries format=duration:stream=width,height -of csv=p=0 demo_kenburns/demo.mp4
