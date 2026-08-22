from pathlib import Path

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'SPLIT CHASE CAMERA' in html and 'renderSplitArena' in js:
    print('v6.7.8 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.7.7','Duel Arena v6.7.8')
html=html.replace('<strong>v6.7.7</strong><span>ARSENAL & MATCH INTRO</span>','<strong>v6.7.8</strong><span>SPLIT CHASE CAMERA</span>')

anchor="const arenaCamera=new THREE.PerspectiveCamera(43,1,.1,100);\nlet camera=topCamera,cameraMode='top';\nconst cameraTarget=new THREE.Vector3();"
if anchor not in js:
    raise SystemExit('camera anchor not found')
insert="""const arenaCamera=new THREE.PerspectiveCamera(43,1,.1,100);
const chaseCameras=[new THREE.PerspectiveCamera(46,1,.1,100),new THREE.PerspectiveCamera(46,1,.1,100)];
let camera=topCamera,cameraMode='top';
const cameraTarget=new THREE.Vector3();
const _baseRender=renderer.render.bind(renderer);
function updateChaseCamera(i,cam,aspect){
  const me=players[i],op=players[1-i];if(!me?.root||!op?.root)return;
  const a=me.root.position,b=op.root.position;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  const ux=dx/len,uz=dz/len;
  const dist=THREE.MathUtils.clamp(len,2.5,18);
  const back=THREE.MathUtils.clamp(4.8+dist*.12,5.1,7.0);
  const height=THREE.MathUtils.clamp(4.2+dist*.08,4.5,5.8);
  const target=new THREE.Vector3(
    THREE.MathUtils.lerp(a.x,b.x,.42),
    .8,
    THREE.MathUtils.lerp(a.z,b.z,.42)
  );
  const desired=new THREE.Vector3(a.x-ux*back,height,a.z-uz*back);
  cam.position.lerp(desired,.24);
  cam.aspect=aspect;cam.fov=THREE.MathUtils.clamp(48-dist*.18,43,48);cam.updateProjectionMatrix();
  cam.up.set(0,i===1?-1:1,0);
  cam.lookAt(target);
}
function renderSplitArena(){
  const canvas=renderer.domElement,w=canvas.width,h=canvas.height,half=Math.floor(h/2),aspect=w/Math.max(1,half);
  renderer.setScissorTest(true);
  updateChaseCamera(0,chaseCameras[0],aspect);
  renderer.setViewport(0,0,w,half);renderer.setScissor(0,0,w,half);_baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],aspect);
  renderer.setViewport(0,half,w,h-half);renderer.setScissor(0,half,w,h-half);_baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}
renderer.render=(s,c)=>{
  if(cameraMode==='arena'&&players.length===2&&players[0]?.root&&players[1]?.root){renderSplitArena();return;}
  renderer.setScissorTest(false);const canvas=renderer.domElement;renderer.setViewport(0,0,canvas.width,canvas.height);_baseRender(s,c);
};"""
js=js.replace(anchor,insert,1)

# The old shared 3D camera updater is no longer used for rendering, but keeping it is harmless.
# Make the UI label match the new behavior when possible.
js=js.replace("document.querySelector('#camera-tilt-test')?.classList.toggle('selected',cameraMode==='arena');","document.querySelector('#camera-tilt-test')?.classList.toggle('selected',cameraMode==='arena');")

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.7.8 split chase camera materialized')
