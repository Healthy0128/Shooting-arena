const res = await fetch('./src/main.js?v=695', { cache: 'no-store' });
if (!res.ok) throw new Error(`Failed to load canonical main.js: ${res.status}`);
let src = await res.text();

// v6.9.5: one authoritative split-screen camera path.
const layoutPattern = /function getLayoutSize\(\)\{[\s\S]*?\n\}\nfunction updateTopCamera/;
const layoutReplacement = `function getLayoutSize(){
  const rect=canvas.getBoundingClientRect();
  return {w:Math.max(1,rect.width),h:Math.max(1,rect.height)};
}
function updateTopCamera`;
if(!layoutPattern.test(src)) throw new Error('v6.9.5: getLayoutSize block not found');
src=src.replace(layoutPattern,layoutReplacement);

const resizePattern=/function resize\(\)\{[^\n]*\}/;
const resizeReplacement=`function resize(){
  const {w,h}=getLayoutSize();
  renderer.setSize(Math.round(w),Math.round(h),false);
  updateTopCamera();
}`;
if(!resizePattern.test(src)) throw new Error('v6.9.5: resize block not found');
src=src.replace(resizePattern,resizeReplacement);

const inputPattern=/function screenVectorToWorld\(player,x,y\)\{[\s\S]*?\n\}\n\nconst activePointers/;
const inputReplacement=`function screenVectorToWorld(player,x,y){
  if(cameraMode==='arena'){
    // Screen-relative controls: up on each half always means away from that player.
    const sign=player===0?1:-1;
    const world=new THREE.Vector2(sign*(-y),sign*x);
    if(world.lengthSq()>1)world.normalize();
    return world;
  }
  const {w,h}=getLayoutSize(),portrait=h>=w;
  return portrait?new THREE.Vector2(-y,x):new THREE.Vector2(x,y);
}

const activePointers`;
if(!inputPattern.test(src)) throw new Error('v6.9.5: input block not found');
src=src.replace(inputPattern,inputReplacement);

const cameraPattern=/function updateChaseCamera\(i,cam,aspect\)\{[\s\S]*?\n\}\nfunction renderSplitArena/;
const cameraReplacement=`function updateChaseCamera(i,cam,aspect){
  const me=players[i];if(!me?.root)return;
  // Use the fighter root as the single camera anchor. No model/arena offsets.
  const a=me.root.position;
  const side=i===0?1:-1;
  const target=new THREE.Vector3(a.x,0.9,a.z);
  cam.position.set(a.x-side*8.8,10.8,a.z);
  cam.up.set(0,1,0);
  cam.aspect=Math.max(.35,aspect);
  cam.fov=72;
  cam.lookAt(target);
  cam.updateProjectionMatrix();
}
function renderSplitArena`;
if(!cameraPattern.test(src)) throw new Error('v6.9.5: chase camera block not found');
src=src.replace(cameraPattern,cameraReplacement);

const splitPattern=/function renderSplitArena\(\)\{[\s\S]*?\n\}\nfunction setCameraMode/;
const splitReplacement=`function renderSplitArena(){
  const {w:cssW,h:cssH}=getLayoutSize();
  const buffer=new THREE.Vector2();
  renderer.getDrawingBufferSize(buffer);
  const pixelW=Math.max(1,Math.floor(buffer.x));
  const pixelH=Math.max(2,Math.floor(buffer.y));
  const halfH=Math.floor(pixelH/2);
  const topH=pixelH-halfH;
  const aspect=cssW/Math.max(1,cssH*.5);
  renderer.setScissorTest(true);
  // WebGL viewport origin is bottom-left: P1 bottom, P2 top.
  updateChaseCamera(0,chaseCameras[0],aspect);
  renderer.setViewport(0,0,pixelW,halfH);
  renderer.setScissor(0,0,pixelW,halfH);
  _baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],aspect);
  renderer.setViewport(0,halfH,pixelW,topH);
  renderer.setScissor(0,halfH,pixelW,topH);
  _baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);
  renderer.setViewport(0,0,pixelW,pixelH);
}
function setCameraMode`;
if(!splitPattern.test(src)) throw new Error('v6.9.5: split render block not found');
src=src.replace(splitPattern,splitReplacement);

const blob=new Blob([src],{type:'text/javascript'});
const url=URL.createObjectURL(blob);
try{await import(url)}finally{URL.revokeObjectURL(url)}
