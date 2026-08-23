from pathlib import Path
import re

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'v6.8.3' in html and 'WIDE CENTER FRAMING' in html:
    print('v6.8.3 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.8.2','Duel Arena v6.8.3')
html=html.replace('<strong>v6.8.2</strong><span>DYNAMIC BATTLE CAMERA</span>','<strong>v6.8.3</strong><span>WIDE CENTER FRAMING</span>')

pattern=r"function updateTopBattleCamera\(\)\{.*?topCamera\.position\.set\(mx,34,mz\+\.01\);topCamera\.lookAt\(mx,0,mz\);topCamera\.updateProjectionMatrix\(\);\n\}"
replacement="""function updateTopBattleCamera(){
  if(cameraMode!=='top'||players.length<2||!players[0]?.root||!players[1]?.root)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const w=Math.max(1,rect.width),h=Math.max(1,rect.height),aspect=w/h,portrait=h>=w;
  const a=players[0].root.position,b=players[1].root.position;
  const rawMx=(a.x+b.x)*.5,rawMz=(a.z+b.z)*.5;
  // Keep the battle midpoint near the visual center while softly biasing toward
  // the arena center so one fighter does not get pinned under the HUD.
  const mx=THREE.MathUtils.lerp(rawMx,0,.12),mz=THREE.MathUtils.lerp(rawMz,0,.12);
  const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
  const screenSpanX=portrait?dz:dx;
  const screenSpanY=portrait?dx:dz;
  // Reserve substantial HUD/control margins. Fighters should live in roughly
  // the middle half of the screen, not at the top/bottom edges.
  const safeX=portrait?.72:.78;
  const safeY=portrait?.50:.66;
  const needW=(screenSpanX+4.6)/safeX;
  const needH=(screenSpanY+5.8)/safeY;
  let viewH=Math.max(needH,needW/Math.max(.2,aspect));
  const minH=portrait?21.5:13.5,maxH=portrait?30:21;
  viewH=THREE.MathUtils.clamp(viewH,minH,maxH);
  let viewW=viewH*aspect;
  // Never crop horizontally when the phone is especially narrow.
  if(viewW<needW){viewW=needW;viewH=viewW/Math.max(.2,aspect)}
  topCamera.left=-viewW/2;topCamera.right=viewW/2;
  topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
  topCamera.up.set(portrait?1:0,0,portrait?0:-1);
  topCamera.position.lerp(new THREE.Vector3(mx,34,mz+.01),.18);
  topCamera.lookAt(topCamera.position.x,0,topCamera.position.z-.01);
  topCamera.updateProjectionMatrix();
}"""
js2,n=re.subn(pattern,replacement,js,flags=re.S)
if n!=1:
    raise SystemExit(f'updateTopBattleCamera replace count={n}')
js=js2

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.8.3 wide center framing materialized')
