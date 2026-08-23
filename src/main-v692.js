const res = await fetch('./src/main.js?v=690', { cache: 'no-store' });
if (!res.ok) throw new Error(`Failed to load canonical main.js: ${res.status}`);
let src = await res.text();

// v6.9.2: 3D split only. TOP-DOWN source is deliberately left untouched.
const inputPattern = /function screenVectorToWorld\(player,x,y\)\{[\s\S]*?\n\}\n\nconst activePointers/;
const inputReplacement = `function screenVectorToWorld(player,x,y){
  if(cameraMode==='arena'){
    const p=players[player];
    if(!p?.root)return new THREE.Vector2();

    // P2 physically faces the opposite side of the same device.
    // Convert device coordinates to that player's local screen coordinates first.
    if(player===1){x=-x;y=-y}

    // Control is character-relative, not opponent-relative and not world-relative.
    const forward=new THREE.Vector3(
      Math.sin(p.root.rotation.y-Math.PI),0,
      Math.cos(p.root.rotation.y-Math.PI)
    );
    if(forward.lengthSq()<1e-6)forward.set(player===0?1:-1,0,0);else forward.normalize();

    // Correct screen-right for a camera looking along forward with world-up Y.
    const right=new THREE.Vector3(-forward.z,0,forward.x);
    const world=right.multiplyScalar(x).add(forward.multiplyScalar(-y));
    if(world.lengthSq()>1)world.normalize();
    return new THREE.Vector2(world.x,world.z);
  }
  const {w,h}=getLayoutSize(),portrait=h>=w;
  return portrait?new THREE.Vector2(-y,x):new THREE.Vector2(x,y);
}

const activePointers`;
if(!inputPattern.test(src)) throw new Error('v6.9.2: input block not found');
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

  // True chase view: directly behind the fighter, slightly elevated and looking down.
  const back=5.2;
  const height=6.6;
  const lookAhead=3.6;
  const desired=new THREE.Vector3(
    a.x-forward.x*back,
    height,
    a.z-forward.z*back
  );

  // Keep the camera just inside the arena so perimeter walls cannot sit between
  // the camera and the fighter and fill an entire half-screen.
  desired.x=THREE.MathUtils.clamp(desired.x,-ARENA.halfW+1.0,ARENA.halfW-1.0);
  desired.z=THREE.MathUtils.clamp(desired.z,-ARENA.halfH+1.0,ARENA.halfH-1.0);

  const target=new THREE.Vector3(
    a.x+forward.x*lookAhead,
    .65,
    a.z+forward.z*lookAhead
  );

  cam.position.copy(desired);
  cam.aspect=Math.max(.35,aspect);
  cam.fov=60;
  cam.up.set(0,i===1?-1:1,0);
  cam.lookAt(target);
  cam.updateProjectionMatrix();
}
function renderSplitArena`;
if(!cameraPattern.test(src)) throw new Error('v6.9.2: chase camera block not found');
src = src.replace(cameraPattern, cameraReplacement);

const splitPattern = /function renderSplitArena\(\)\{[\s\S]*?\n\}\nfunction setCameraMode/;
const splitReplacement = `function renderSplitArena(){
  // Layout math uses CSS pixels only. DPR/drawing-buffer pixels are used only
  // when setting WebGL viewport/scissor rectangles.
  const rect=canvas.getBoundingClientRect();
  const cssW=Math.max(1,rect.width);
  const cssH=Math.max(2,rect.height);
  const halfAspect=cssW/(cssH*.5);

  const size=new THREE.Vector2();
  renderer.getDrawingBufferSize(size);
  const pixelW=Math.max(1,Math.floor(size.x));
  const pixelH=Math.max(2,Math.floor(size.y));
  const lower=Math.floor(pixelH*.5);
  const upper=pixelH-lower;

  renderer.setScissorTest(true);

  updateChaseCamera(0,chaseCameras[0],halfAspect);
  renderer.setViewport(0,0,pixelW,lower);
  renderer.setScissor(0,0,pixelW,lower);
  _baseRender(scene,chaseCameras[0]);

  updateChaseCamera(1,chaseCameras[1],halfAspect);
  renderer.setViewport(0,lower,pixelW,upper);
  renderer.setScissor(0,lower,pixelW,upper);
  _baseRender(scene,chaseCameras[1]);

  renderer.setScissorTest(false);
  renderer.setViewport(0,0,pixelW,pixelH);
}
function setCameraMode`;
if(!splitPattern.test(src)) throw new Error('v6.9.2: split renderer block not found');
src = src.replace(splitPattern, splitReplacement);

// World-space labels are projected through the shared top camera, so hide them in split mode.
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
