import numpy as np, wave, subprocess
from mask import Y
SR=44100; T=30; N=SR*T
rng=np.random.default_rng(3)
t=np.arange(N)/SR
def fil(x,lo=None,hi=None):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR)
    if lo: X[f<lo]=0
    if hi: X[f>hi]=0
    return np.fft.irfft(X,len(x))
def norm(x): return x/(np.abs(x).max()+1e-9)
# огибающая границы
Yt=np.array([Y(s/SR) for s in range(0,N,441)]); Yt=np.interp(np.arange(N),np.arange(0,N,441),Yt)
chaos_g=np.clip(Yt/960,0,1); chaos_g[t<1.5]=1
calm_g=np.clip(1-chaos_g*0.9,0,1); calm_g[t<1.5]=0
# хаос
rum=norm(fil(rng.standard_normal(N),60,500))*0.5
rum*=0.7+0.3*np.sin(2*np.pi*0.35*t)
hiss=norm(fil(rng.standard_normal(N),2000,6000))*0.12*(0.5+0.5*np.sin(2*np.pi*0.9*t)**2)
ch=rum+hiss
# пинги, чаще со временем
tt=0.4
while tt<19:
    f0=rng.choice([880,1175,1320,1760]); L=int(0.25*SR); i=int(tt*SR)
    e=np.exp(-np.arange(L)/(0.06*SR)); s=np.sin(2*np.pi*f0*np.arange(L)/SR)*e*0.35
    ch[i:i+L]+=s[:max(0,min(L,N-i))]
    tt+=max(0.25,1.2-0.05*tt)*rng.uniform(0.6,1.4)
# пульс 120 -> 60 уд/мин
tb=0.2
while tb<19:
    i=int(tb*SR); L=int(0.18*SR)
    e=np.exp(-np.arange(L)/(0.05*SR)); s=np.sin(2*np.pi*55*np.arange(L)/SR)*e*0.7
    ch[i:i+L]+=s[:max(0,min(L,N-i))]
    bpm=120-60*min(1,max(0,(tb-4)/15)); tb+=60/bpm
ch*=chaos_g
# тишина: дождь + пад
rain=norm(fil(rng.standard_normal(N),800,9000))*0.35*(0.8+0.2*np.sin(2*np.pi*0.1*t))
pad=sum(np.sin(2*np.pi*f*t+p)*a for f,p,a in [(110,0,.5),(164.8,1,.35),(220,2,.3),(277.2,3,.2)])
pad=pad*(0.6+0.4*np.sin(2*np.pi*0.08*t))*0.12
cl=(rain+pad)*calm_g
drone=np.sin(2*np.pi*55*t)*0.05+np.sin(2*np.pi*82.4*t)*0.03
cl=cl+drone*(0.5+0.5*chaos_g)
# удар и райзер
fx=np.zeros(N)
i=int(1.5*SR); L=int(1.4*SR)
fx[i:i+L]+=np.sin(2*np.pi*(70*np.exp(-np.arange(L)/(0.4*SR))+35)*np.arange(L)/SR)*np.exp(-np.arange(L)/(0.5*SR))*0.9
fx[i:i+int(.3*SR)]+=norm(rng.standard_normal(int(.3*SR)))*np.exp(-np.arange(int(.3*SR))/(0.08*SR))*0.5
a,b=int(0.5*SR),int(1.5*SR)
r=norm(fil(rng.standard_normal(b-a),500,8000))*np.linspace(0,1,b-a)**2*0.4
fx[a:b]+=r
bed=ch*0.9+cl+fx
# голос
def load(p):
    w=wave.open(p); d=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
    if w.getframerate()!=SR:
        d=np.interp(np.arange(0,len(d),w.getframerate()/SR),np.arange(len(d)),d)
    return d
V="/home/user/cvs_work/audio/"
voice=np.zeros(N)
for k,st in [("t_v1",0.2),("t_v2",3.4),("t_v3",10.0),("t_v4",19.0),("t_v5",22.8)]:
    d=load(V+k+".wav"); i=int(st*SR); voice[i:i+len(d)]+=d[:N-i]
voice=voice/np.abs(voice).max()*0.9
env=np.convolve(np.abs(voice),np.ones(2205)/2205,'same'); env=np.convolve(env,np.ones(8820)/8820,'same')
duck=1-0.45*np.clip(env*12,0,1)
mix=bed*duck*0.8+voice*1.0
# лёгкая стерео-ширина
L_=mix+0.04*np.roll(mix,300); R_=mix+0.04*np.roll(mix,-300)
st=np.stack([L_,R_],1); st=st/np.abs(st).max()*0.9
st[-SR//2:]*=np.linspace(1,0,SR//2)[:,None]
w=wave.open("/home/user/cvs_work/mix.wav","wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes()); w.close()
print("ok")
