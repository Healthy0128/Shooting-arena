from pathlib import Path
p=Path('materialize_v674.py')
s=p.read_text(encoding='utf-8')
s=s.replace("updateAimGuides();updateSharedCamera(dt);renderer.render(scene,camera)","updateSharedCamera(dt);updateAimGuides();renderer.render(scene,camera)")
p.write_text(s,encoding='utf-8')
print('v6.7.4 materializer loop hook corrected')
