from pathlib import Path
import re

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'v6.8.2' in html and 'function updateTopBattleCamera' in js:
    print('v6.8.2 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.8.1','Duel Arena v6.8.2')
html=html.replace('<strong>v6.8.1</strong><span>CANVAS COORDINATE FIX</span>','<strong>v6.8.2</strong><span>DYNAMIC BATTLE CAMERA</span>')

pattern=r"function configureTopCamera\(w,h\)\{.*?topCamera\.lookAt\(0,0,0\);topCamera\.updateProjectionMatrix\(\);\n\}"
replacement="""function configureTopCamera(w,h){
  const aspect=w/Math.max(1,h),portrait=h>=w;
  topCamera.up.set(portrait?1:0,0,portrait?0:-1);
  // Base fallback framing. During a match updateTopBattleCamera() replaces
  // this with a player-focused frame, so device resolution never drives zoom.
  const worldW=portrait?A.hh*2+1:A.hw*2+1;
  const worldH=portrait?A.hw*2+1:A.hh*2+1;
  let viewW=worldW,viewH=viewW/Math.max(.2,aspect);
  if(viewH<worldH){viewH=worldH;viewW=viewH*aspect}
  topCamera.left=-viewW/2;topCamera.right=viewW/2;
  topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
  topCamera.position.set(0,34,.01);topCamera.lookAt(0,0,0);topCamera.updateProjectionMatrix();
}
function updateTopBattleCamera(){
  if(cameraMode!=='top'||players.length<2||!players[0]?.root||!players[1]?.root)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const w=Math.max(1,rect.width),h=Math.max(1,rect.height),aspect=w/h,portrait=h>=w;
  const a=players[0].root.position,b=players[1].root.position;
  const mx=(a.x+b.x)*.5,mz=(a.z+b.z)*.5;
  const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
  // Camera axes change in portrait: screen X = world Z, screen Y = world X.
  const spanX=(portrait?dz:dx)+5.0;
  const spanY=(portrait?dx:dz)+6.0;
  let viewW=Math.max(spanX,spanY*aspect);
  let viewH=viewW/Math.max(.2,aspect);
  const minH=portrait?13.5:10.5,maxH=portrait?23.5:17.5;
  viewH=THREE.MathUtils.clamp(viewH,minH,maxH);viewW=viewH*aspect;
  topCamera.left=-viewW/2;topCamera.right=viewW/2;
  topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
  topCamera.up.set(portrait?1:0,0,portrait?0:-1);
  topCamera.position.set(mx,34,mz+.01);topCamera.lookAt(mx,0,mz);topCamera.updateProjectionMatrix();
}"""
js2,n=re.subn(pattern,replacement,js,flags=re.S)
if n!=1:
    raise SystemExit(f'configureTopCamera replace count={n}')
js=js2

# Update the main loop so the top camera follows both fighters every frame.
needle="updateAimGuides();updateSharedCamera(rawDt);"
if needle in js:
    js=js.replace(needle,"updateAimGuides();updateTopBattleCamera();updateSharedCamera(rawDt);",1)
elif 'updateTopBattleCamera();' not in js:
    raise SystemExit('loop camera anchor not found')

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.8.2 dynamic battle camera materialized')
