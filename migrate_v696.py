from pathlib import Path
from io import BytesIO
import base64, zipfile, re, shutil

root=Path('.')

# Materialize the clean v6.9.5 source from the existing repository payload FIRST.
# This removes the browser-side ZIP loader and gives us real canonical files to edit.
payload=root/'.v695-payload'
parts=sorted(payload.glob('part-*'))
if not parts:
    raise SystemExit('v6.9.5 payload parts not found')
b64=''.join(p.read_text().strip() for p in parts)
raw=base64.b64decode(b64)
with zipfile.ZipFile(BytesIO(raw)) as z:
    names=z.namelist()
    prefix=names[0].split('/')[0]+'/' if names and '/' in names[0] else ''
    wanted=[
        'index.html','style.css','src/main.js','game-config.json','manifest.webmanifest',
        'README.md','BGM_LICENSES.md','THIRD_PARTY_ASSETS.md','tracks.json','.gitignore'
    ]
    for rel in wanted:
        name=prefix+rel
        if name not in names:
            continue
        out=root/rel
        out.parent.mkdir(parents=True,exist_ok=True)
        out.write_bytes(z.read(name))

js=root/'src/main.js'
html=root/'index.html'
css=root/'style.css'
wf=root/'.github/workflows/deploy-pages.yml'

s=js.read_text()
if 'Dual Canvas Split canonical runtime' not in s:
    old="""const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
"""
    new="""const canvas = $('#game');
const splitCanvases=[$('#game-p1'),$('#game-p2')];
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const splitRenderers=splitCanvases.map(c=>{
  const r=new THREE.WebGLRenderer({canvas:c,antialias:true,powerPreference:'high-performance'});
  r.setPixelRatio(Math.min(devicePixelRatio,1.5));
  r.outputColorSpace=THREE.SRGBColorSpace;
  return r;
});
"""
    if old not in s: raise SystemExit('renderer init block not found')
    s=s.replace(old,new,1)

    pat=re.compile(r"function screenVectorToWorld\(player,x,y\)\{[\s\S]*?\n\}\n\nconst activePointers")
    rep="""function screenVectorToWorld(player,x,y){
  if(cameraMode==='arena'){
    const cam=chaseCameras[player];
    const right=new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion);
    const up=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion);
    right.y=0;up.y=0;
    if(right.lengthSq()<1e-6)right.set(0,0,1);else right.normalize();
    if(up.lengthSq()<1e-6){
      cam.getWorldDirection(up);up.y=0;
      if(up.lengthSq()<1e-6)up.set(player===0?1:-1,0,0);else up.normalize();
    }else up.normalize();
    const world=right.multiplyScalar(x).add(up.multiplyScalar(-y));
    if(world.lengthSq()>1)world.normalize();
    return new THREE.Vector2(world.x,world.z);
  }
  const {w,h}=getLayoutSize(),portrait=h>=w;
  return portrait?new THREE.Vector2(-y,x):new THREE.Vector2(x,y);
}

const activePointers"""
    s,n=pat.subn(rep,s,1)
    if n!=1: raise SystemExit('input block not found')

    start=s.find('function syncRendererSize(){')
    end=s.find('function setCameraMode(mode){',start)
    if start<0 or end<0: raise SystemExit('camera core block not found')
    block="""function syncRendererSize(){
  const rect=canvas.getBoundingClientRect();
  const cssW=Math.max(1,Math.round(rect.width));
  const cssH=Math.max(1,Math.round(rect.height));
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  const targetW=Math.round(cssW*dpr),targetH=Math.round(cssH*dpr);
  if(canvas.width!==targetW||canvas.height!==targetH){
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW,cssH,false);
  }
}

function syncSplitRendererSize(i){
  const c=splitCanvases[i],r=splitRenderers[i];
  const rect=c.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width)),h=Math.max(1,Math.round(rect.height));
  const dpr=Math.min(window.devicePixelRatio||1,1.5);
  const targetW=Math.round(w*dpr),targetH=Math.round(h*dpr);
  if(c.width!==targetW||c.height!==targetH){
    r.setPixelRatio(dpr);
    r.setSize(w,h,false);
  }
  return {w,h};
}

function updateTopCamera(){
  if(cameraMode!=='top')return;
  const {w,h}=getLayoutSize();
  const aspect=w/Math.max(1,h),portrait=h>=w;
  topCamera.up.set(portrait?1:0,0,portrait?0:-1);
  if(players.length===2&&players[0]?.root&&players[1]?.root){
    const a=players[0].root.position,b=players[1].root.position;
    const mx=(a.x+b.x)*.5,mz=(a.z+b.z)*.5;
    const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
    const screenSpanX=portrait?dz:dx,screenSpanY=portrait?dx:dz;
    const needW=screenSpanX+7,needH=screenSpanY+9;
    let viewH=Math.max(portrait?34:19,needH,needW/Math.max(.25,aspect));
    viewH=Math.min(viewH,portrait?42:27);
    const viewW=viewH*aspect;
    topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
    topCamera.position.set(mx,38,mz+.01);topCamera.lookAt(mx,0,mz);
  }else{
    const viewH=portrait?38:23,viewW=viewH*aspect;
    topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
    topCamera.position.set(0,38,.01);topCamera.lookAt(0,0,0);
  }
  topCamera.updateProjectionMatrix();
}

function updateChaseCamera(i,cam,aspect){
  const me=players[i];if(!me?.root)return;
  const a=me.root.position;
  const forward=new THREE.Vector3(me.aim.x,0,me.aim.y);
  if(forward.lengthSq()<.01)forward.set(i===0?1:-1,0,0);
  forward.normalize();
  const back=8.4,height=9.6;
  cam.position.set(a.x-forward.x*back,height,a.z-forward.z*back);
  cam.up.set(0,1,0);
  cam.aspect=Math.max(.25,aspect);
  cam.fov=70;
  cam.lookAt(a.x,1.0,a.z);
  cam.updateProjectionMatrix();
}

function renderSplitArena(){
  // No viewport/scissor splitting. Each half owns a real CSS-sized canvas.
  for(let i=0;i<2;i++){
    const {w,h}=syncSplitRendererSize(i);
    const cam=chaseCameras[i];
    updateChaseCamera(i,cam,w/Math.max(1,h));
    splitRenderers[i].render(scene,cam);
  }
}
"""
    s=s[:start]+block+s[end:]

    old_resize="""const resizeObserver=new ResizeObserver(()=>{syncRendererSize();updateTopCamera()});
resizeObserver.observe(canvas);
addEventListener('resize',()=>{syncRendererSize();updateTopCamera()});
addEventListener('orientationchange',()=>setTimeout(()=>{syncRendererSize();updateTopCamera()},80));
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{syncRendererSize();updateTopCamera()});
syncRendererSize();updateTopCamera();
"""
    new_resize="""const resizeObserver=new ResizeObserver(()=>{syncRendererSize();syncSplitRendererSize(0);syncSplitRendererSize(1);updateTopCamera()});
resizeObserver.observe(canvas);splitCanvases.forEach(c=>resizeObserver.observe(c));
addEventListener('resize',()=>{syncRendererSize();syncSplitRendererSize(0);syncSplitRendererSize(1);updateTopCamera()});
addEventListener('orientationchange',()=>setTimeout(()=>{syncRendererSize();syncSplitRendererSize(0);syncSplitRendererSize(1);updateTopCamera()},80));
syncRendererSize();syncSplitRendererSize(0);syncSplitRendererSize(1);updateTopCamera();
"""
    if old_resize not in s: raise SystemExit('resize observer block not found')
    s=s.replace(old_resize,new_resize,1)
    s='// Duel Arena v6.9.6 — Dual Canvas Split canonical runtime\n'+s
    js.write_text(s)

h=html.read_text()
if 'id="game-p2"' not in h:
    h=h.replace('<canvas id="game"></canvas>','<canvas id="game"></canvas>\n    <canvas id="game-p2" class="split-view split-p2" aria-hidden="true"></canvas>\n    <canvas id="game-p1" class="split-view split-p1" aria-hidden="true"></canvas>',1)
h=h.replace('v6.9.5','v6.9.6').replace('CLEAN SPLIT CORE','DUAL CANVAS SPLIT').replace('CANONICAL 50/50 CAMERA','DUAL CANVAS SPLIT')
h=re.sub(r'href="\./style(?:-v694)?\.css\?v=\d+"','href="./style.css?v=696"',h)
h=re.sub(r'src="\./src/main(?:-v695)?\.js\?v=\d+"','src="./src/main.js?v=696"',h)
html.write_text(h)

c=css.read_text()
marker='/* v6.9.6 — dual-canvas split'
if marker not in c:
    c += '''\n/* v6.9.6 — dual-canvas split: CSS owns the exact 50/50 boundary. */\nhtml,body{width:100%;height:100%;margin:0;overflow:hidden;background:#0d1118}\nbody{position:fixed;inset:0;width:100dvw;height:100dvh}\n#game-wrap{position:fixed;inset:0;width:100dvw;height:100dvh;overflow:hidden;background:#0d1118}\n#game{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}\n.split-view{position:fixed;left:0;width:100%;height:50%;display:none;z-index:1;touch-action:none;pointer-events:none;background:#0d1118}\n.split-p2{top:0;transform:rotate(180deg);transform-origin:center center}\n.split-p1{top:50%}\nbody.split-arena #game{visibility:hidden}\nbody.split-arena .split-view{display:block}\nbody.split-arena::before{content:"";position:fixed;left:0;right:0;top:50%;height:1px;background:#ffffff55;z-index:18;pointer-events:none}\n'''
css.write_text(c)

wf.write_text('''name: Deploy Duel Arena to Pages\n\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: pages\n  cancel-in-progress: true\n\njobs:\n  deploy:\n    environment:\n      name: github-pages\n      url: ${{ steps.deployment.outputs.page_url }}\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Validate v6.9.6 dual canvas build\n        run: |\n          set -euo pipefail\n          node --check src/main.js\n          python -m json.tool game-config.json >/dev/null\n          grep -q 'v6.9.6' index.html\n          grep -q 'game-p1' index.html\n          grep -q 'game-p2' index.html\n          grep -q 'splitRenderers' src/main.js\n          grep -q 'No viewport/scissor splitting' src/main.js\n          ! test -e src/main-v694.js\n          ! test -e src/main-v695.js\n          ! test -d .v695-payload\n      - uses: actions/configure-pages@v5\n      - name: Build static site\n        run: |\n          mkdir _site\n          rsync -a --delete --exclude '.git/' --exclude '.github/' --exclude '_site/' ./ _site/\n      - uses: actions/upload-pages-artifact@v3\n        with:\n          path: _site\n      - name: Deploy\n        id: deployment\n        uses: actions/deploy-pages@v4\n''')

for p in ['src/main-v695.js','style-v694.css','.v695-exact-trigger','.v695-pr-trigger','.v695-trigger','.v695-payload']:
    q=root/p
    if q.is_dir(): shutil.rmtree(q)
    elif q.exists(): q.unlink()
for p in ['migrate_v696.py','.v696-trigger','.github/workflows/migrate-v696.yml']:
    q=root/p
    if q.exists(): q.unlink()
print('v6.9.6 migration applied')
