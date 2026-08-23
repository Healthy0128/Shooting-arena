const res = await fetch('./src/main.js?v=690', { cache: 'no-store' });
if (!res.ok) throw new Error(`Failed to load canonical main.js: ${res.status}`);
let src = await res.text();

const inputPattern = /function screenVectorToWorld\(player,x,y\)\{[\s\S]*?\n\}\n\nconst activePointers/;
const inputReplacement = `function screenVectorToWorld(player,x,y){
  if(cameraMode==='arena'){
    const cam=chaseCameras[player];
    // Convert touch direction from the camera's actual rendered screen axes.
    // P2 already has a 180-degree camera roll, so do NOT flip input again.
    const right=new THREE.Vector3(1,0,0).applyQuaternion(cam.quaternion);
    const screenUp=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion);
    right.y=0;screenUp.y=0;
    if(right.lengthSq()<1e-6)right.set(0,0,player===0?1:-1);else right.normalize();
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

if(!inputPattern.test(src)) throw new Error('v6.9.1: input block not found');
src = src.replace(inputPattern, inputReplacement);

const cameraPattern = /function updateChaseCamera\(i,cam,aspect\)\{[\s\S]*?\n\}\nfunction renderSplitArena/;
const cameraReplacement = `function updateChaseCamera(i,cam,aspect){
  const me=players[i],op=players[1-i];if(!me?.root||!op?.root)return;
  const a=me.root.position,b=op.root.position;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  const ux=dx/len,uz=dz/len,dist=THREE.MathUtils.clamp(len,3,30);

  // Higher chase angle keeps the arena floor visible in a half-height viewport.
  const back=THREE.MathUtils.clamp(4.0+dist*.04,4.2,5.3);
  const height=THREE.MathUtils.clamp(11.5+dist*.05,11.7,13.0);
  const lead=THREE.MathUtils.clamp(dist*.28,2.0,4.8);
  const target=new THREE.Vector3(a.x+ux*lead,.55,a.z+uz*lead);
  const desired=new THREE.Vector3(a.x-ux*back,height,a.z-uz*back);
  desired.x=THREE.MathUtils.clamp(desired.x,-ARENA.halfW-1.2,ARENA.halfW+1.2);
  desired.z=THREE.MathUtils.clamp(desired.z,-ARENA.halfH-1.2,ARENA.halfH+1.2);

  cam.position.lerp(desired,.3);
  cam.aspect=Math.max(.5,aspect);
  cam.fov=THREE.MathUtils.clamp(68+Math.max(0,10-dist)*.18,68,71);
  cam.up.set(0,i===1?-1:1,0);
  cam.lookAt(target);
  cam.updateProjectionMatrix();
}
function renderSplitArena`;

if(!cameraPattern.test(src)) throw new Error('v6.9.1: chase camera block not found');
src = src.replace(cameraPattern, cameraReplacement);

// World-space status used topCamera projection even during split view, so hide it there.
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
