import numpy as np, subprocess
W,H,FPS,T=1080,1920,30,30
def ease(x): x=min(1,max(0,x)); return x*x*(3-2*x)
def Y(t):
    if t<1.5: return 1920
    if t<2.2: return 1920-960*ease((t-1.5)/0.7)
    if t<4: return 960
    if t<19: return 960*(1-ease((t-4)/15))
    return 0
if __name__=="__main__":
    base="/home/user/cvs_work/"
    m=subprocess.Popen(["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","gray","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","ffv1",base+"mask.mkv"],stdin=subprocess.PIPE)
    g=subprocess.Popen(["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}","-r",str(FPS),"-i","-","-c:v","ffv1",base+"glow.mkv"],stdin=subprocess.PIPE)
    rows=np.arange(H,dtype=np.float32)[:,None]
    col=np.array([0.55,0.9,1.0],dtype=np.float32)
    for f in range(FPS*T):
        y=Y(f/FPS)
        mk=np.clip((y-rows)/14+0.5,0,1)
        m.stdin.write((np.repeat(mk,W,1)*255).astype(np.uint8).tobytes())
        d=np.abs(rows-y)
        prof=np.exp(-(d/4.0)**2)*0.8+np.exp(-(d/70.0)**2)*0.3
        if y<=0 or y>=1920: prof=prof*0
        prof=np.clip(prof,0,1)[:,:,None]*col[None,None,:]
        g.stdin.write((np.broadcast_to(prof,(H,W,3))*255).astype(np.uint8).tobytes())
    m.stdin.close(); g.stdin.close(); m.wait(); g.wait()
