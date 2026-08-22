from pathlib import Path

js_path=Path('src/main.js')
css_path=Path('style.css')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
css=css_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'v6.7.9' in html and 'screenVectorToWorld' in js and 'v6.7.9 split view fix' in css:
    print('v6.7.9 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.7.8','Duel Arena v6.7.9')
html=html.replace('<strong>v6.7.8</strong><span>SPLIT CHASE CAMERA</span>','<strong>v6.7.9</strong><span>SPLIT VIEW FIX</span>')

old="""function renderSplitArena(){
  const canvas=renderer.domElement,w=canvas.width,h=canvas.height,half=Math.floor(h/2),aspect=w/Math.max(1,half);
  renderer.setScissorTest(true);
  updateChaseCamera(0,chaseCameras[0],aspect);
  renderer.setViewport(0,0,w,half);renderer.setScissor(0,0,w,half);_baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],aspect);
  renderer.setViewport(0,half,w,h-half);renderer.setScissor(0,half,w,h-half);_baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}"""
new="""function renderSplitArena(){
  const canvas=renderer.domElement,w=canvas.width,h=canvas.height;
  const bottomH=Math.round(h*.5),topH=h-bottomH;
  const bottomAspect=w/Math.max(1,bottomH),topAspect=w/Math.max(1,topH);
  renderer.setScissorTest(true);
  updateChaseCamera(0,chaseCameras[0],bottomAspect);
  renderer.setViewport(0,0,w,bottomH);renderer.setScissor(0,0,w,bottomH);_baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],topAspect);
  renderer.setViewport(0,bottomH,w,topH);renderer.setScissor(0,bottomH,w,topH);_baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}"""
if old not in js: raise SystemExit('renderSplitArena anchor not found')
js=js.replace(old,new,1)

old="""function setCameraMode(mode){
  cameraMode=mode==='arena'?'arena':'top';
  camera=cameraMode==='arena'?arenaCamera:topCamera;
  document.querySelector('#camera-mode')?.classList.toggle('selected',cameraMode==='top');
  document.querySelector('#camera-tilt-test')?.classList.toggle('selected',cameraMode==='arena');
}"""
new="""function setCameraMode(mode){
  cameraMode=mode==='arena'?'arena':'top';
  camera=cameraMode==='arena'?arenaCamera:topCamera;
  document.body.classList.toggle('split-arena',cameraMode==='arena');
  document.querySelector('#camera-mode')?.classList.toggle('selected',cameraMode==='top');
  document.querySelector('#camera-tilt-test')?.classList.toggle('selected',cameraMode==='arena');
}"""
if old not in js: raise SystemExit('setCameraMode anchor not found')
js=js.replace(old,new,1)

needle="const ptr=new Map();"
helper="""function screenVectorToWorld(pi,x,y){
  if(cameraMode!=='arena')return new THREE.Vector2(x,y);
  if(pi===1){x=-x;y=-y}
  const cam=chaseCameras[pi];
  const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);fwd.y=0;
  if(fwd.lengthSq()<.0001)fwd.set(pi?-1:1,0,0);else fwd.normalize();
  const right=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
  const wx=right.x*x+fwd.x*(-y),wz=right.z*x+fwd.z*(-y);
  const out=new THREE.Vector2(wx,wz);if(out.lengthSq()>1)out.normalize();return out;
}
const ptr=new Map();"""
if needle not in js: raise SystemExit('ptr anchor not found')
js=js.replace(needle,helper,1)

old="""let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`;if(kind==='aim'&&mag>max*.35)shoot(pi)"""
new="""let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;const world=screenVectorToWorld(pi,x,y);(kind==='move'?players[pi].move:players[pi].aim).copy(world);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`;if(kind==='aim'&&mag>max*.35)shoot(pi)"""
if old not in js: raise SystemExit('stick vector anchor not found')
js=js.replace(old,new,1)

css += """

/* v6.7.9 split view fix — each player owns exactly 50% of the screen */
body.split-arena #game-wrap::after{
  content:"";position:absolute;left:0;right:0;top:50%;height:2px;transform:translateY(-1px);
  background:linear-gradient(90deg,transparent,#ffffff55 14%,#ffffffaa 50%,#ffffff55 86%,transparent);
  pointer-events:none;z-index:8;
}
body.split-arena .stick-zone{
  width:50%;height:50%;max-width:none;max-height:none;
}
body.split-arena .stick-zone.p1{top:50%;bottom:auto}
body.split-arena .stick-zone.p2{top:0;bottom:auto}
body.split-arena .stick-zone.move{left:0;right:auto}
body.split-arena .stick-zone.aim{right:0;left:auto}
body.split-arena .stick-zone.p2.move{left:auto;right:0}
body.split-arena .stick-zone.p2.aim{right:auto;left:0}
body.split-arena .stick{
  width:clamp(76px,22vw,118px);height:clamp(76px,22vw,118px);
}
body.split-arena .stick i{
  width:42%;height:42%;
}
body.split-arena .hud.one{bottom:max(2%,env(safe-area-inset-bottom))}
body.split-arena .hud.two{top:max(2%,env(safe-area-inset-top))}
body.split-arena .super-btn.p1{bottom:7%}
body.split-arena .super-btn.p2{top:7%}
body.split-arena .def-btn.p1{bottom:13%}
body.split-arena .def-btn.p2{top:13%}
body.split-arena #timer{top:50%}
@media (max-width:430px){
  body.split-arena .hud{width:64vw;grid-template-columns:68px 1fr 1fr 72px;padding:7px 9px;font-size:11px}
  body.split-arena .super-btn{width:84px;height:44px}
  body.split-arena .def-btn{width:76px;height:38px}
}
"""

js_path.write_text(js,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.7.9 split view fix materialized')
