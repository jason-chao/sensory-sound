import sys; from bowlan import *
fn=sys.argv[1]; win=float(sys.argv[2]) if len(sys.argv)>2 else 2.0
sr,x=load(fn)
for t,lev,pk in stft_peaks(x,sr,win=win,hop=win,n=7):
    print("%6.1f %6.1fdB  "%(t,lev)+"  ".join("%7.1f(%3.0f)"%p for p in pk))
