from pathlib import Path
import re

js_path=Path('src/main.js')
html_path=Path('index.html')
css_path=Path('style.css')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')
css=css_path.read_text(encoding='utf-8')

# v6.7.2: switchable top-down / Custom-Robo-inspired shared 3D camera.
old="const camera=new THREE.OrthographicCamera(-11.6,11.6,14.2,-14.2,.1,100); camera.position.set(0,34,.01); camera.up.set(0,0,-1); camera.lookAt(0,0,0);"
new="const topCamera=new THREE.OrthographicCamera(-11.6,11.6,14.2,-14.2,.1,100); topCamera.position.set(0,34,.01); topCamera.up.set(0,0,-1); topCamera.lookAt(0,0,0);\nconst arenaCamera=new THREE.PerspectiveCamera(43,1,.1,100);\nlet camera=topCamera,cameraMode='top';\nconst cameraTarget=new THREE.Vector3();"
if old not in js:
    raise SystemExit('camera declaration hook not found')
js=js.replace(old,new,1)

# P2 input is no longer reversed. UI alone remains physically rotated.
js=js.replace("if(pi===1){x=-x;y=-y}","",1)

# Add aim guide system before audio state.
marker="let audio=null, realBgm=null;"
guide=r'''
const aimGuides=[];
function makeAimGuide(i){
  const c=i?0xff8c72:0x74d5ff;
  const mat=new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.72,depthTest:false});
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  const line=new THREE.Line(geo,mat);line.renderOrder=20;line.visible=false;scene.add(line);aimGuides[i]=line;return line;
}
makeAimGuide(0);makeAimGuide(1);
function updateAimGuides(){
  players.forEach((p,i)=>{
    const line=aimGuides[i];if(!line)return;
    const active=running&&p?.alive&&p.aim.lengthSq()>.12;
    line.visible=!!active;if(!active)return;
    const dir=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize();
    const a=p.root.position.clone();a.y=.08;
    const b=a.clone().addScaledVector(dir,4.2);b.y=.08;
    line.geometry.setFromPoints([a,b]);
  });
}
function setCameraMode(mode){
  cameraMode=mode==='arena'?'arena':'top';
  camera=cameraMode==='arena'?arenaCamera:topCamera;
  document.querySelector('#camera-mode')?.classList.toggle('selected',cameraMode==='top');
  document.querySelector('#camera-tilt-test')?.classList.toggle('selected',cameraMode==='arena');
}
function updateSharedCamera(dt){
  if(cameraMode!=='arena'||players.length<2||!players[0]?.root||!players[1]?.root)return;
  const a=players[0].root.position,b=players[1].root.position;
  const mid=new THREE.Vector3((a.x+b.x)/2,0,(a.z+b.z)/2);
  cameraTarget.lerp(mid,1-Math.pow(.001,dt));
  const dist=Math.hypot(a.x-b.x,a.z-b.z);
  const height=THREE.MathUtils.clamp(11.8+dist*.43,12.5,18.2);
  const back=THREE.MathUtils.clamp(8.8+dist*.32,9.5,14.2);
  const desired=new THREE.Vector3(cameraTarget.x,height,cameraTarget.z+back);
  arenaCamera.position.lerp(desired,1-Math.pow(.002,dt));
  arenaCamera.lookAt(cameraTarget.x,.15,cameraTarget.z);
}
'''
if guide not in js:
    js=js.replace(marker,guide+'\n'+marker,1)

# Wire existing menu camera buttons.
anchor="$('#start').onclick=()=>{ac().resume?.();start()};"
wire="$('#camera-mode').onclick=()=>setCameraMode('top');$('#camera-tilt-test').onclick=()=>setCameraMode('arena');setCameraMode('top');\n"
if wire not in js:
    if anchor not in js: raise SystemExit('camera button wire hook not found')
    js=js.replace(anchor,wire+anchor,1)

# Resize both cameras.
old_resize="function resize(){renderer.setSize(innerWidth,innerHeight,false);const portrait=innerHeight>=innerWidth;const aspect=portrait?Math.max(.78,(innerWidth/innerHeight)*1.55):innerWidth/innerHeight;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}camera.left=-hw;camera.right=hw;camera.top=hh;camera.bottom=-hh;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();"
new_resize="function resize(){renderer.setSize(innerWidth,innerHeight,false);const portrait=innerHeight>=innerWidth;const aspect=portrait?Math.max(.78,(innerWidth/innerHeight)*1.55):innerWidth/innerHeight;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}topCamera.left=-hw;topCamera.right=hw;topCamera.top=hh;topCamera.bottom=-hh;topCamera.updateProjectionMatrix();arenaCamera.aspect=innerWidth/Math.max(1,innerHeight);arenaCamera.updateProjectionMatrix()}addEventListener('resize',resize);resize();"
if old_resize not in js: raise SystemExit('resize hook not found')
js=js.replace(old_resize,new_resize,1)

# Camera and guides update every frame; gameplay remains in world X/Z coordinates.
old_loop="function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(hitStop>0)hitStop-=dt;else update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}"
new_loop="function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(hitStop>0)hitStop-=dt;else update(dt);updateSharedCamera(dt);updateAimGuides();renderer.render(scene,camera);requestAnimationFrame(loop)}"
if old_loop not in js: raise SystemExit('loop hook not found')
js=js.replace(old_loop,new_loop,1)

# UI text + version.
html=html.replace('Duel Arena v6.7.1','Duel Arena v6.7.2')
html=html.replace('<strong>v6.7.1</strong><span>DIRECT PUBLIC BUILD</span>','<strong>v6.7.2</strong><span>EXPERIMENTAL 3D CAMERA</span>')
html=html.replace('対面180°','対面UI 180°')
html=html.replace('上側プレイヤーの移動・照準を180°回転','上側はUIだけ180°。移動・照準入力は通常方向')
html=html.replace('TOP-DOWN FAIR','TOP-DOWN')
html=html.replace('3D TILT TEST','3D ARENA')
html=html.replace('対面プレイでは真上視点を推奨','3D ARENA: 2人の中点を追従＋距離で自動ズーム')

# Small visual polish for active camera choice and aim guide explanation.
css += r'''
/* v6.7.2 experimental shared 3D camera */
.camera-buttons button.selected{box-shadow:0 0 0 2px #8edcff88,0 0 18px #55bfff44}
.camera-note{line-height:1.35}
'''

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
print('v6.7.2 materialized')
