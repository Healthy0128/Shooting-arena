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
  const tapRaycaster=new THREE.Raycaster();
  const groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  let mode='top';
  let initialized=false;
  let shakeUntil=0;
  let shakeStrength=0;
  let measuredInsets={top:0,right:0,bottom:0,left:0};

  function isIOSDevice(){
    return /iPad|iPhone|iPod/.test(navigator.userAgent)||(
      navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1
    );
  }

  function isStandaloneApp(){
    return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches;
  }

  function safeAreaInsets(){
    const probe=document.createElement('div');
    probe.style.cssText='position:fixed;inset:0;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);pointer-events:none;visibility:hidden';
    document.body.appendChild(probe);
    const style=getComputedStyle(probe);
    const insets={
      top:Number.parseFloat(style.paddingTop)||0,
      right:Number.parseFloat(style.paddingRight)||0,
      bottom:Number.parseFloat(style.paddingBottom)||0,
      left:Number.parseFloat(style.paddingLeft)||0
    };
    probe.remove();
    return insets;
  }

  function updateSafeAreas(){
    const insets=safeAreaInsets();
    measuredInsets=insets;
    const ios=isIOSDevice();
    const clearance=ios?Math.max(58,insets.bottom+28):insets.bottom;
    document.documentElement.style.setProperty('--gesture-clearance',`${clearance}px`);
    document.documentElement.style.setProperty('--ui-safe-top',`${insets.top}px`);
    document.documentElement.style.setProperty('--ui-safe-right',`${insets.right}px`);
    document.documentElement.style.setProperty('--ui-safe-left',`${insets.left}px`);
  }

  function standaloneScreenSize(layoutW,layoutH){
    if(!isStandaloneApp()||!globalThis.screen)return {w:0,h:0};
    const screenW=Number(globalThis.screen.width)||0;
    const screenH=Number(globalThis.screen.height)||0;
    const short=Math.min(screenW,screenH),long=Math.max(screenW,screenH);
    const portrait=layoutH>=layoutW;
    const w=portrait?short:long,h=portrait?long:short;
    const plausible=w>=layoutW*.9&&w<=layoutW*1.25&&h>=layoutH*.9&&h<=layoutH*1.25;
    return plausible?{w,h}:{w:0,h:0};
  }

  function getLayoutSize(){
    const canvas=renderer.domElement;
    const rect=canvas?.getBoundingClientRect?.();
    const root=document.documentElement;
    const vv=globalThis.visualViewport;
    const rectW=Math.round(rect?.width||0);
    const rectH=Math.round(rect?.height||0);
    const baseW=Math.max(1,rectW,Math.round(globalThis.innerWidth||0),Math.round(root.clientWidth||0),Math.round(vv?.width||0));
    const baseH=Math.max(1,rectH,Math.round(globalThis.innerHeight||0),Math.round(root.clientHeight||0),Math.round((vv?.height||0)+(vv?.offsetTop||0)));
    const standalone=standaloneScreenSize(baseW,baseH);
    const w=Math.max(
      1,
      baseW,
      standalone.w
    );
    const h=Math.max(
      1,
      baseH,
      standalone.h
    );
    return {w,h};
  }

  function isPortrait(){
    const {w,h}=getLayoutSize();
    return h>=w;
  }

  function safeFrameScale(w,h){
    const vertical=(measuredInsets.top+measuredInsets.bottom)/Math.max(1,h);
    const horizontal=(measuredInsets.left+measuredInsets.right)/Math.max(1,w);
    return 1+THREE.MathUtils.clamp(Math.max(vertical,horizontal)*.75,0,.14);
  }

  function safeTopCameraCenter(mx,mz,viewW,viewH,w,h,portrait){
    const screenUp=portrait?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,-1);
    const screenRight=portrait?new THREE.Vector3(0,0,1):new THREE.Vector3(1,0,0);
    const vertical=viewH*(measuredInsets.top-measuredInsets.bottom)/(2*Math.max(1,h));
    const horizontal=viewW*(measuredInsets.right-measuredInsets.left)/(2*Math.max(1,w));
    return new THREE.Vector3(mx,0,mz).addScaledVector(screenUp,vertical).addScaledVector(screenRight,horizontal);
  }

  function safeSelfWeight(outerInset,viewportHeight){
    return .62+THREE.MathUtils.clamp(outerInset/Math.max(1,viewportHeight)*1.45,0,.13);
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
      viewH=Math.min(viewH,portrait?42:27)*safeFrameScale(w,h);
      const viewW=viewH*aspect;
      const center=safeTopCameraCenter(mx,mz,viewW,viewH,w,h,portrait);
      topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
      topCamera.position.set(center.x,38,center.z+.01);topCamera.lookAt(center.x,0,center.z);
    }else{
      const viewH=(h>=w?38:23)*safeFrameScale(w,h),viewW=viewH*aspect;
      const center=safeTopCameraCenter(0,0,viewW,viewH,w,h,portrait);
      topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
      topCamera.position.set(center.x,38,center.z+.01);topCamera.lookAt(center.x,0,center.z);
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
    const {w,h}=getLayoutSize(),viewportH=Math.max(1,h/2);
    const outerInset=i===1?measuredInsets.top:measuredInsets.bottom;
    const selfWeight=safeSelfWeight(outerInset,viewportH),opponentWeight=1-selfWeight;
    const target=new THREE.Vector3(a.x*selfWeight+b.x*opponentWeight,1.15,a.z*selfWeight+b.z*opponentWeight);
    let cx=a.x-ux*back,cz=a.z-uz*back;
    cx=THREE.MathUtils.clamp(cx,-ARENA.halfW+1.1,ARENA.halfW-1.1);cz=THREE.MathUtils.clamp(cz,-ARENA.halfH+1.1,ARENA.halfH-1.1);
    const safeRatio=Math.max(outerInset/viewportH,(measuredInsets.left+measuredInsets.right)/Math.max(1,w));
    const baseFov=THREE.MathUtils.clamp(66+Math.max(0,10-dist)*.25,64,72);
    cam.position.lerp(new THREE.Vector3(cx,height,cz),.22);cam.aspect=Math.max(.55,aspect);cam.fov=THREE.MathUtils.clamp(baseFov*(1+safeRatio*.45),64,78);
    cam.up.set(0,i===1?-1:1,0);cam.lookAt(target);cam.updateProjectionMatrix();
    cam.projectionMatrix.elements[8]+=(measuredInsets.right-measuredInsets.left)/Math.max(1,w);
    cam.projectionMatrix.elements[9]+=(i===1?outerInset:-outerInset)/viewportH;
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  }

  function getTpsBasis(player){
    const cam=chaseCameras[player];
    const forward3=new THREE.Vector3();
    cam.getWorldDirection(forward3);
    forward3.y=0;
    if(forward3.lengthSq()<1e-6)forward3.set(player===0?1:-1,0,0);
    else forward3.normalize();
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

  function screenPointToGround(player,ndcX,ndcY){
    let camera;
    if(mode==='arena'){
      if(player!==0&&player!==1)return null;
      camera=chaseCameras[player];
    }else{
      updateTopCamera();
      camera=topCamera;
    }
    tapRaycaster.setFromCamera(new THREE.Vector2(ndcX,ndcY),camera);
    const hit=new THREE.Vector3();
    if(!tapRaycaster.ray.intersectPlane(groundPlane,hit))return null;
    return {x:hit.x,z:hit.z};
  }

  function screenVectorToWorld(player,x,y,projection='vector'){
    if(projection==='ground')return screenPointToGround(player,x,y);
    return controlMapper.mapStick(player,x,y);
  }

  function projectWorldToScreen(player,worldPosition){
    const {w,h}=getLayoutSize();
    let camera=topCamera;
    let viewportTop=0;
    let viewportHeight=h;
    if(mode==='arena'){
      if(player!==0&&player!==1)return null;
      camera=chaseCameras[player];
      viewportHeight=h/2;
      viewportTop=player===0?h/2:0;
    }else updateTopCamera();

    const q=worldPosition.clone().project(camera);
    return {
      x:(q.x*.5+.5)*w,
      y:viewportTop+(-q.y*.5+.5)*viewportHeight,
      visible:q.z>=-1&&q.z<=1&&q.x>=-1.15&&q.x<=1.15&&q.y>=-1.2&&q.y<=1.2
    };
  }

  function addShake(strength=2,duration=90){
    shakeStrength=Math.max(shakeStrength,strength);
    shakeUntil=Math.max(shakeUntil,performance.now()+duration);
  }

  function updateShake(){
    const canvas=renderer.domElement;
    if(!canvas)return;
    const remaining=shakeUntil-performance.now();
    if(remaining<=0){
      shakeStrength=0;
      canvas.style.transform='';
      return;
    }
    const x=(Math.random()-.5)*shakeStrength;
    const y=(Math.random()-.5)*shakeStrength;
    canvas.style.transform=`translate(${x}px,${y}px)`;
  }

  function renderSplitArena(){
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
    updateSafeAreas();
    document.documentElement.style.setProperty('--app-width',`${w}px`);
    document.documentElement.style.setProperty('--app-height',`${h}px`);
    renderer.setSize(w,h,false);
    updateTopCamera();
  }

  function render(){
    updateTopCamera();
    const players=getPlayers();
    if(mode==='arena'&&players.length===2)renderSplitArena();
    else baseRender(scene,topCamera);
    updateShake();
  }

  function init(){
    if(initialized)return;
    initialized=true;
    document.documentElement.classList.toggle('ios-device',isIOSDevice());
    document.documentElement.classList.toggle('standalone-app',isStandaloneApp());
    const canvas=renderer.domElement;
    if(canvas){
      canvas.style.position='fixed';
      canvas.style.inset='auto';
      canvas.style.left='0';
      canvas.style.top='0';
      canvas.style.width='var(--app-width,100vw)';
      canvas.style.height='var(--app-height,100dvh)';
    }
    document.querySelector('#camera-mode')?.addEventListener('click',()=>setMode('top'));
    document.querySelector('#camera-tilt-test')?.addEventListener('click',()=>setMode('arena'));
    addEventListener('resize',resize);
    addEventListener('orientationchange',()=>setTimeout(resize,80));
    globalThis.visualViewport?.addEventListener('resize',resize);
    resize();
    requestAnimationFrame(resize);
  }

  return {
    init,
    render,
    screenVectorToWorld,
    getMode:()=>mode,
    getTpsBasis,
    isPortrait,
    projectWorldToScreen,
    addShake
  };
}
