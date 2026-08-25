const MOVE_THRESHOLD=16;
const HOLD_DELAY=140;
const STICK_RADIUS=44;
const DEAD_ZONE=.12;

export function isMovementGesture(dx,dy,threshold=MOVE_THRESHOLD){
  return Math.hypot(dx,dy)>=threshold;
}

export function createFloatingStickController({canvas,resolvePlayer,resolveFirePlayer,onMove,onMoveEnd,onTap,onFireStart,onFireMove,onFireEnd,onTouchInput}){
  const pointers=new Map();
  const movingPointerByPlayer=new Map();
  const layer=document.createElement('div');
  layer.className='floating-stick-layer';
  layer.setAttribute('aria-hidden','true');
  document.body.appendChild(layer);

  function createVisual(state){
    const base=document.createElement('div');
    base.className=`floating-stick p${state.player+1}`;
    base.innerHTML='<i></i>';
    layer.appendChild(base);
    state.visual=base;
    state.knob=base.querySelector('i');
    positionBase(state);
  }

  function positionBase(state){
    if(!state.visual)return;
    state.visual.style.left=`${state.baseX}px`;
    state.visual.style.top=`${state.baseY}px`;
  }

  function stopTimer(state){
    if(state.holdTimer){
      clearTimeout(state.holdTimer);
      state.holdTimer=0;
    }
  }

  function beginFire(state){
    if(state.mode!=='pending')return;
    state.mode='fire';
    state.firePlayer=resolveFirePlayer?.(state.lastX,state.lastY,state.player)??state.player;
    onFireStart(state.firePlayer,state.lastX,state.lastY);
  }

  function applyMove(state){
    let dx=state.lastX-state.baseX;
    let dy=state.lastY-state.baseY;
    let distance=Math.hypot(dx,dy);
    if(distance>STICK_RADIUS){
      const follow=distance-STICK_RADIUS;
      state.baseX+=dx/distance*follow;
      state.baseY+=dy/distance*follow;
      positionBase(state);
      dx=state.lastX-state.baseX;
      dy=state.lastY-state.baseY;
      distance=STICK_RADIUS;
    }

    let vx=dx/STICK_RADIUS;
    let vy=dy/STICK_RADIUS;
    const magnitude=Math.hypot(vx,vy);
    if(magnitude>1){vx/=magnitude;vy/=magnitude}
    if(magnitude<DEAD_ZONE){vx=0;vy=0}
    state.knob.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
    onMove(state.player,vx,vy);
  }

  function beginMove(state){
    const owner=movingPointerByPlayer.get(state.player);
    if(owner!==undefined&&owner!==state.pointerId)return false;
    stopTimer(state);
    state.mode='move';
    movingPointerByPlayer.set(state.player,state.pointerId);
    createVisual(state);
    return true;
  }

  function finishState(state,cancelled){
    stopTimer(state);
    if(state.mode==='move'){
      if(movingPointerByPlayer.get(state.player)===state.pointerId)movingPointerByPlayer.delete(state.player);
      onMoveEnd(state.player);
    }else if(state.mode==='fire'){
      onFireEnd(state.firePlayer);
    }else if(state.mode==='pending'&&!cancelled){
      const firePlayer=resolveFirePlayer?.(state.lastX,state.lastY,state.player)??state.player;
      onTap(firePlayer,state.lastX,state.lastY);
    }
    state.visual?.remove();
  }

  function endPointer(event,cancelled=false){
    const state=pointers.get(event.pointerId);
    if(!state)return;
    pointers.delete(event.pointerId);
    finishState(state,cancelled);
  }

  canvas?.addEventListener('pointerdown',event=>{
    if(event.pointerType==='mouse')return;
    const player=resolvePlayer(event.clientX,event.clientY);
    if(player===null||player===undefined)return;
    event.preventDefault();
    onTouchInput();
    canvas.setPointerCapture?.(event.pointerId);
    const state={
      pointerId:event.pointerId,
      player,
      mode:'pending',
      startX:event.clientX,
      startY:event.clientY,
      lastX:event.clientX,
      lastY:event.clientY,
      baseX:event.clientX,
      baseY:event.clientY,
      holdTimer:0,
      firePlayer:null,
      visual:null,
      knob:null
    };
    state.holdTimer=setTimeout(()=>beginFire(state),HOLD_DELAY);
    pointers.set(event.pointerId,state);
  });

  canvas?.addEventListener('pointermove',event=>{
    const state=pointers.get(event.pointerId);
    if(!state)return;
    event.preventDefault();
    state.lastX=event.clientX;
    state.lastY=event.clientY;
    if(state.mode==='pending'&&isMovementGesture(state.lastX-state.startX,state.lastY-state.startY))beginMove(state);
    if(state.mode==='move')applyMove(state);
    else if(state.mode==='fire')onFireMove(state.firePlayer,state.lastX,state.lastY);
  });

  canvas?.addEventListener('pointerup',event=>endPointer(event));
  canvas?.addEventListener('pointercancel',event=>endPointer(event,true));
  canvas?.addEventListener('lostpointercapture',event=>endPointer(event,true));

  function clear(){
    [...pointers.values()].forEach(state=>finishState(state,true));
    pointers.clear();
    movingPointerByPlayer.clear();
    layer.replaceChildren();
  }

  function isMoving(player){
    return movingPointerByPlayer.has(player);
  }

  return {clear,isMoving};
}
