#!/usr/bin/env bash
# Download the analysed recordings (NOT committed: audio stays outside the repo)
# and convert them to mono 32-bit float WAV in ./wav, which is where the
# analysis scripts look (they are run from a sibling directory: ../wav/<name>.wav).
# Usage: mkdir -p /some/scratch/bowls && cd /some/scratch/bowls && bash fetch_recordings.sh
#        mkdir an && cp <analysis dir>/*.py an/ && cd an && python3 analyze_struck.py
set -euo pipefail
UA="research-script/0.1"
get() { [ -f "$2" ] || curl -sL -A "$UA" -o "$2" "$1"; }
C=https://upload.wikimedia.org/wikipedia/commons
get $C/e/e1/Tibetan_Singing_Bowl_hit_11inch.flac        Tibetan_Singing_Bowl_hit_11inch.flac
get $C/8/87/Tibetan_Singing_Bowl_hit_4.5inch.flac       Tibetan_Singing_Bowl_hit_4.5inch.flac
get $C/a/a4/Tibetan_Singing_Bowl_4.5inch.flac           Tibetan_Singing_Bowl_4.5inch.flac
get $C/2/25/SingingBowl1.ogg                            SingingBowl1.ogg
get $C/6/64/SingingBowl2.ogg                            SingingBowl2.ogg
get $C/e/e5/Singing_bowl.ogg                            Singing_bowl.ogg
get $C/1/17/Small_tibetan_singing_bowl.ogg              Small_tibetan_singing_bowl.ogg
get $C/7/70/The_sound_of_a_singing_bowl.wav             The_sound_of_a_singing_bowl.wav
get $C/3/34/Cuencos_tibetanos_al_ser_percutidos.wav     Cuencos_tibetanos_al_ser_percutidos.wav   # 179 MB
get $C/6/64/Japanese_rin_played_as_friction_idiophone.ogg Japanese_rin_played_as_friction_idiophone.ogg
get $C/e/e6/Japanese_rin_played_as_struck_idiophone.ogg Japanese_rin_played_as_struck_idiophone.ogg
get $C/5/5a/Binaural_Cuencos_de_Cuarzo.ogg              Binaural_Cuencos_de_Cuarzo.ogg
# Freesound HQ previews (128-192 kbit/s MP3; the originals need a login)
F=https://cdn.freesound.org/previews
for id in 411487_2154914 415141_2154914 531269_11717915 530846_11717915 530847_11717915 \
          530848_11717915 194434_829962 129219_649468 460416_8735331; do
  n=${id%%_*}; get "$F/${n:0:3}/${id}-hq.mp3" "fs_$n.mp3"
done
mkdir -p wav
for f in *.wav *.ogg *.flac fs_*.mp3; do
  [ -f "$f" ] || continue
  ffmpeg -v error -y -i "$f" -ac 1 -c:a pcm_f32le "wav/${f%.*}.wav"
done
