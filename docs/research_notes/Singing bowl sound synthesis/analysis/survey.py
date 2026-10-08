"""Quick survey: envelope (dB) timeline, onsets, and global spectral peaks."""
import sys, numpy as np
from scipy.io import wavfile
from scipy.signal import find_peaks
def load(fn):
    sr,x=wavfile.read(fn); x=x.astype(np.float64)
    if x.ndim>1: x=x.mean(1)
    return sr,x
def onsets(x,sr,hop=0.01,win=0.04,jump=8):
    h=int(hop*sr); w=int(win*sr)
    n=(len(x)-w)//h
    e=np.array([np.sum(x[i*h:i*h+w]**2) for i in range(n)])+1e-12
    edb=10*np.log10(e)
    on=[]
    for i in range(5,n):
        if edb[i]-edb[max(0,i-5):i].min()>jump and (not on or (i*hop-on[-1])>0.5):
            on.append(i*hop)
    return on,edb
if __name__=="__main__":
    for fn in sys.argv[1:]:
        sr,x=load(fn)
        on,edb=onsets(x,sr)
        print("=====",fn,"dur %.1fs peak %.1f dBFS"%(len(x)/sr,20*np.log10(np.abs(x).max()+1e-12)))
        # 0.5 s envelope
        step=50
        env=[edb[i:i+step].mean() for i in range(0,len(edb),step)]
        print(" env(0.5s):"," ".join("%d"%v for v in env[:160]))
        print(" onsets(s):",["%.2f"%o for o in on[:80]], "n=",len(on))
        N=1<<int(np.ceil(np.log2(min(len(x),sr*30))))
        seg=x[:min(len(x),sr*30)]*np.hanning(min(len(x),sr*30))
        S=np.abs(np.fft.rfft(seg,N*2)); f=np.fft.rfftfreq(N*2,1/sr)
        Sdb=20*np.log10(S/S.max()+1e-12)
        pk,_=find_peaks(Sdb,height=-45,distance=int(20/(f[1])))
        pk=pk[(f[pk]>60)&(f[pk]<12000)]
        top=pk[np.argsort(Sdb[pk])[::-1][:14]]
        print(" peaks:",", ".join("%.1fHz(%.0f)"%(f[i],Sdb[i]) for i in sorted(top)))
