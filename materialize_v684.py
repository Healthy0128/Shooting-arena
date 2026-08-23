from pathlib import Path
import re

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'v6.8.4' in html and 'CAMERA RESET' in html and 'updateSharedCamera(rawDt)' not in js:
    print('v6.8.4 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.8.3','Duel Arena v6.8.4')
html=html.replace('<strong>v6.8.3</strong><span>WIDE CENTER FRAMING</span>','<strong>v6.8.4</strong><span>CAMERA RESET</span>')
html=html.replace('href="./style.css"','href="./style.css?v=684"')
html=html.replace('src="./src/main.js"','src="./src/main.js?v=684"')

js=js.replace("const arenaCamera=new THREE.PerspectiveCamera(43,1,.1,100);\n",'')
js=js.replace("const cameraTarget=new THREE.Vector3();\n",'')
js=js.replace("camera=cameraMode==='arena'?arenaCamera:topCamera;","camera=topCamera;")
js=js.replace(";arenaCamera.aspect=w/Math.max(1,h);arenaCamera.updateProjectionMatrix()","")
js=js.replace("updateTopBattleCamera();updateSharedCamera(rawDt);","updateTopBattleCamera();")

pattern=r"function updateTopBattleCamera\(\)\{.*?\n\}\nfunction renderSplitArena\(\)\{"
replacement="""function updateTopBattleCamera(){
  if(cameraMode!=='top'||players.length<2||!players[0]?.root||!players[1]?.root)return;
  const rect=renderer.domElement.getBoundingClientRect();
  const w=Math.max(1,rect.width),h=Math.max(1,rect.height),aspect=w/h,portrait=h>=w;
  const a=players[0].root.position,b=players[1].root.position;
  const mx=(a.x+b.x)*.5,mz=(a.z+b.z)*.5;
  const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
  const spanScreenX=portrait?dz:dx;
  const spanScreenY=portrait?dx:dz;
  // One authoritative top-down camera: exact midpoint, deliberately wide.
  const marginX=6.0,marginY=8.0;
  const needW=spanScreenX+marginX;
  const needH=spanScreenY+marginY;
  let viewH=Math.max(portrait?26:16,needH,needW/Math.max(.2,aspect));
  viewH=Math.min(viewH,portrait?34:24);
  const viewW=viewH*aspect;
  topCamera.left=-viewW/2;topCamera.right=viewW/2;
  topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
  topCamera.up.set(portrait?1:0,0,portrait?0:-1);
  topCamera.position.set(mx,34,mz+.01);
  topCamera.lookAt(mx,0,mz);
  topCamera.updateProjectionMatrix();
}
function renderSplitArena(){"""
js,n=re.subn(pattern,replacement,js,flags=re.S)
if n!=1:
    raise SystemExit(f'camera replacement count={n}')

# Remove the obsolete shared arena camera function completely.
js,n2=re.subn(r"\nfunction updateSharedCamera\(dt\)\{.*?\n\}\n",'\n',js,count=1,flags=re.S)
if n2!=1:
    print('warning: updateSharedCamera block not removed; call already removed')

old="if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));"
new="if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{}));"
js=js.replace(old,new)

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.8.4 camera reset materialized')
