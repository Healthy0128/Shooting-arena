const res = await fetch('./src/main.js?v=690', { cache: 'no-store' });
if (!res.ok) throw new Error(`Failed to load canonical main.js: ${res.status}`);
let src = await res.text();

// v6.9.4: synchronize browser CSS viewport and WebGL drawing buffer first.
const layoutPattern = /function getLayoutSize\(\)\{[\s\S]*?\n\}\nfunction updateTopCamera/;
const layoutReplacement = `function getLayoutSize(){
  const rect=canvas.getBoundingClientRect();
  return {w:Math.max(1,rect.width),h:Math.max(1,rect.height)};
}
function updateTopCamera`;
if(!layoutPattern.test(src)) throw new Error('v6.9.4: getLayoutSize block not found');
src = src.replace(layoutPattern, layoutReplacement);

const resizePattern = /function resize\(\)\{[^\n]*\}/;
const resizeReplacement = `function resize(){
  const rect=canvas.getBoundingClientRect();
  const w=Math.max(1,Math.round(rect.width));
  const h=Math.max(1,Math.round(rect.height));
  renderer.setSize(w,h,false);
  updateTopCamera();
}`;
if(!resizePattern.test(src)) throw new Error('v6.9.4: resize block not found');
src = src.replace(resizePattern, resizeReplacement);

const inputPattern = /function screenVectorToWorld\(player,x,y\)\{[\s\S]*?\n\}\n\nconst activePointers/;
const inputReplacement = `function screenVectorToWorld(player,x,y){
  if(cameraMode==='arena'){
    const cam=chaseCameras[player];
    const right=new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion);
    const screenUp=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion);
    right.y=0;screenUp.y=0;
    if(right.lengthSq()<1e-6)right.set(0,0,1);else right.normalize();
    if(screenUp.lengthSq()<1e-6){
      const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);fwd.y=0;
      if(fwd.lengthSq()<1e-6)fwd.set(player===0?1:-1,0,0);else fwd.normalize();
      screenUp.copy(fwd);
    }else screenUp.normalize();
    const world=right.multiplyScalar(x).add(screenUp.multiplyScalar(-y));
    if(world.lengthSq()>1)world.normalize();
    return new THREE.Vector2(world.x,world.z);
  }
  const {w,h}=getLayoutSize(),portrait=h>=w;
  return portrait?new THREE.Vector2(-y,x):new THREE.Vector2(x,y);
}

const activePointers`;
if(!inputPattern.test(src)) throw new Error('v6.9.4: input block not found');
src = src.replace(inputPattern, inputReplacement);

const cameraPattern = /function updateChaseCamera\(i,cam,aspect\)\{[\s\S]*?\n\}\nfunction renderSplitArena/;
const cameraReplacement = `function updateChaseCamera(i,cam,aspect){
  const me=players[i];if(!me?.root)return;
  const a=me.root.position;
  const forward=new THREE.Vector3(
    Math.sin(me.root.rotation.y-Math.PI),0,
    Math.cos(me.root.rotation.y-Math.PI)
  );
  if(forward.lengthSq()<1e-6)forward.set(i===0?1:-1,0,0);else forward.normalize();

  const back=7.2;
  const height=8.4;
  const desired=new THREE.Vector3(
    a.x-forward.x*back,
    height,
    a.z-forward.z*back
  );
  const target=new THREE.Vector3(a.x,1.0,a.z);

  cam.position.copy(desired);
  cam.aspect=Math.max(.25,aspect);
  cam.fov=66;
  cam.up.set(0,i===1?-1:1,0);
  cam.lookAt(target);
  cam.updateProjectionMatrix();
}
function renderSplitArena`;
if(!cameraPattern.test(src)) throw new Error('v6.9.4: chase camera block not found');
src = src.replace(cameraPattern, cameraReplacement);

const splitPattern = /function renderSplitArena\(\)\{[\s\S]*?\n\}\nfunction setCameraMode/;
const splitReplacement = `const SPLIT_VIEWS=[
  {player:0,x:0,y:0,w:1,h:.5},
  {player:1,x:0,y:.5,w:1,h:.5}
];
function renderSplitArena(){
  const rect=canvas.getBoundingClientRect();
  const cssW=Math.max(1,rect.width);
  const cssH=Math.max(2,rect.height);

  const buffer=new THREE.Vector2();
  renderer.getDrawingBufferSize(buffer);
  const pixelW=Math.max(1,Math.floor(buffer.x));
  const pixelH=Math.max(2,Math.floor(buffer.y));

  renderer.setScissorTest(true);
  for(const view of SPLIT_VIEWS){
    const aspect=(cssW*view.w)/Math.max(1,cssH*view.h);
    const x=Math.round(pixelW*view.x);
    const y=Math.round(pixelH*view.y);
    const w=Math.round(pixelW*view.w);
    const h=Math.round(pixelH*view.h);
    const cam=chaseCameras[view.player];
    updateChaseCamera(view.player,cam,aspect);
    renderer.setViewport(x,y,w,h);
    renderer.setScissor(x,y,w,h);
    _baseRender(scene,cam);
  }
  renderer.setScissorTest(false);
  renderer.setViewport(0,0,pixelW,pixelH);
}
function setCameraMode`;
if(!splitPattern.test(src)) throw new Error('v6.9.4: split render block not found');
src = src.replace(splitPattern, splitReplacement);

src = src.replace(
  "    const el=p.worldStatus;\n    if(!p.alive||!p.root.visible){el.style.display='none';return}",
  "    const el=p.worldStatus;\n    if(cameraMode==='arena'){el.style.display='none';return}\n    if(!p.alive||!p.root.visible){el.style.display='none';return}"
);

const blob = new Blob([src], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
try {
  await import(url);
} finally {
  URL.revokeObjectURL(url);
}
