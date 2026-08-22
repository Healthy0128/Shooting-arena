from pathlib import Path
from urllib.request import Request, urlopen

OUT=Path('assets/audio/bgm')
OUT.mkdir(parents=True,exist_ok=True)
TRACKS={
 '01_empacotatron_loop.ogg':['https://opengameart.org/sites/default/files/empacotatron_loop.ogg'],
 '02_trance_boss_battle.ogg':['https://opengameart.org/sites/default/files/trance_boss_battle_bpm150.ogg','https://opengameart.org/sites/default/files/trance_boss_battle_bpm150_0.ogg'],
 '03_space_boss_battle.ogg':['https://opengameart.org/sites/default/files/space_boss_battle_bpm175.ogg','https://opengameart.org/sites/default/files/space_boss_battle_bpm175_0.ogg']
}
for name,urls in TRACKS.items():
    target=OUT/name
    last=None
    for url in urls:
        try:
            req=Request(url,headers={'User-Agent':'Mozilla/5.0 DuelArena/1.0'})
            with urlopen(req,timeout=60) as r, open(target,'wb') as f:
                while True:
                    chunk=r.read(1024*1024)
                    if not chunk: break
                    f.write(chunk)
            print(name,target.stat().st_size)
            last=None
            break
        except Exception as e:
            last=e
    if last:
        print('BGM download failed:',name,last)
