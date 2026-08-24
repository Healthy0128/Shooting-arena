import * as THREE from 'three';
import { ARENA } from './arena-config.js?v=695';
import { createControlMapper } from './controls.js?v=6101';

export function createCameraController({renderer,scene,getPlayers}){
  const topCamera=new THREE.OrthographicCamera(-12,12,18,-18,.1,100);
  topCamera.position.set(0,38,.01);
  topCamera.up.set(1,0,0);
  topCamera.lookAt(0,0,0);

  const chaseCameras=[
    new THREE.PerspectiveCamera(58,1,.1,120),
    new THREE.PerspectiveCamera(58,1,.1,120)
  ];
  const baseRender=renderer.render.bind(renderer);
  let mode='top';
  let initialized=false;

  function getLayoutSize(){
    const root=document.documentElement;
    const vv=globalThis.visualViewport;
    // iOS can report a shorter documentElement.clientHeight than the actual
    // drawable viewport. Use the largest live viewport measurement so the
    // WebGL canvas reaches the physical bottom edge instead of leaving a band.
    const w=Math.max(
      1,
      Math.round(globalThis.innerWidth||0),
      Math.round(root.clientWidth||0),
      Math.round(vv?.width||0)
    );
    const h=Math.max(
      1,
      Math.round(globalThis.innerHeight||0),
      Math.round(root.clientHeight||0),
      Math.round(vv?.height||0)
    );
    return {w,h};
  }

  function isPortrait(){
    const {w,h}=getLayoutSize();
    return h>=w;
  }

  function updateTopCamera(){
    if(mode!=='top')return;
    const players=getPlayers();
    const {w,h}=getLayoutSize(),aspect=w/Math.max(1,h),portrait=h>=w;
    topCamera.up.set(portrait?1:0,0,portrait?0:-1);
    if(players.length===2&&players[0]?.root&&players[1]?.root){
      const a=players[0].root.position,b=players[1].root.position;
      const mx=(a.x+b.x)*.5,mz=(a.z+b.z)*.5;
      const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
      const screenSpanX=portrait?dz:dx,screenSpanY=portrait?dx:dz;
      const needW=screenSpanX+7.0,needH=screenSpanY+9.0;
      let viewH=Math.max(portrait?34:19,needH,needW/Math.max(.25,aspect));
      viewH=Math.min(viewH,portrait?42:27);
      const viewW=viewH*aspect;
      topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
      topCamera.position.set(mx,38,mz+.01);topCamera.lookAt(mx,0,mz);
    }else{
      const viewH=h>=w?38:23,viewW=viewH*aspect;
      topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
      topCamera.position.set(0,38,.01);topCamera.lookAt(0,0,0);
    }
    topCamera.updateProjectionMatrix();
  }

  function updateChaseCamera(i,cam,aspect){
    const players=getPlayers();
    const me=players[i],op=players[1-i];if(!me?.root||!op?.root)return;
    const a=me.root.position,b=op.root.position;
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
    const ux=dx/len,uz=dz/len,dist=THREE.MathUtils.clamp(len,3,28);
    const back=THREE.MathUtils.clamp(6.2+dist*.11,6.6,9.2),height=THREE.MathUtils.clamp(8.0+dist*.09,8.2,10.8);
    // Aim the camera slightly higher so the arena/characters sit a little lower in each split-screen view.
    const target=new THREE.Vector3(a.x*.62+b.x*.38,1.15,a.z*.62+b.z*.38);
    let cx=a.x-ux*back,cz=a.z-uz*back;
    cx=THREE.MathUtils.clamp(cx,-ARENA.halfW+1.1,ARENA.halfW-1.1);cz=THREE.MathUtils.clamp(cz,-ARENA.halfH+1.1,ARENA.halfH-1.1);
    cam.position.lerp(new THREE.Vector3(cx,height,cz),.22);cam.aspect=Math.max(.55,aspect);cam.fov=THREE.MathUtils.clamp(66+Math.max(0,10-dist)*.25,64,72);
    cam.up.set(0,i===1?-1:1,0);cam.lookAt(target);cam.updateProjectionMatrix();
  }

  function getTpsBasis(player){
    const cam=chaseCameras[player];
    const forward3=new THREE.Vector3();
    cam.getWorldDirection(forward3);
    forward3.y=0;
    if(forward3.lengthSq()<1e-6)forward3.set(player===0?1:-1,0,0);
    else forward3.normalize();
    // Ground-plane camera-right = forward × world-up.
    // For forward (0,0,-1), this correctly gives +X as screen-right.
    const right3=new THREE.Vector3(-forward3.z,0,forward3.x).normalize();
    return {
      forward:new THREE.Vector2(forward3.x,forward3.z),
      right:new THREE.Vector2(right3.x,right3.z)
    };
  }

  const controlMapper=createControlMapper({
    getMode:()=>mode,
    getTpsBasis,
    getPortrait:isPortrait
  });

  function screenVectorToWorld(player,x,y){
    return controlMapper.mapStick(player,x,y);
  }

  function renderSplitArena(){
    // setViewport/setScissor take logical CSS-pixel units and apply renderer pixelRatio internally.
    // Using getDrawingBufferSize here would double-apply DPR and shift the split on high-DPI phones.
    const size=new THREE.Vector2();renderer.getSize(size);
    const w=Math.max(1,Math.floor(size.x)),h=Math.max(2,Math.floor(size.y));
    const lower=Math.floor(h/2),upper=h-lower;
    renderer.setScissorTest(true);
    updateChaseCamera(0,chaseCameras[0],w/lower);
    renderer.setViewport(0,0,w,lower);renderer.setScissor(0,0,w,lower);baseRender(scene,chaseCameras[0]);
    updateChaseCamera(1,chaseCameras[1],w/upper);
    renderer.setViewport(0,lower,w,upper);renderer.setScissor(0,lower,w,upper);baseRender(scene,chaseCameras[1]);
    renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
  }

  function setMode(nextMode){
    mode=nextMode==='arena'?'arena':'top';
    document.body.classList.toggle('split-arena',mode==='arena');
    document.querySelectorAll('.camera-buttons button').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
    resize();
  }

  function resize(){
    const {w,h}=getLayoutSize();
    renderer.setSize(w,h,false);
    updateTopCamera();
  }

  function render(){
    updateTopCamera();
    const players=getPlayers();
    if(mode==='arena'&&players.length===2)renderSplitArena();
    else baseRender(scene,topCamera);
  }

  function init(){
    if(initialized)return;
    initialized=true;
    document.querySelector('#camera-mode')?.addEventListener('click',()=>setMode('top'));
    document.querySelector('#camera-tilt-test')?.addEventListener('click',()=>setMode('arena'));
    addEventListener('resize',resize);
    addEventListener('orientationchange',()=>setTimeout(resize,80));
    globalThis.visualViewport?.addEventListener('resize',resize);
    resize();
  }

  return {
    init,
    render,
    screenVectorToWorld,
    getMode:()=>mode,
    getTpsBasis,
    isPortrait,
    getProjectionCamera:()=>topCamera
  };
}
