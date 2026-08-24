import { createFloatingStickController } from './floating-stick.js?v=6200';

export function createInputController({getPlayers,mapStick,screenVectorToWorld,shoot,activateSuper}){
  const activePointers=new Map();
  const mapControl=mapStick||screenVectorToWorld;
  const isTpsMode=()=>document.body.classList.contains('split-arena');
  let inputMode=matchMedia('(pointer:coarse)').matches?'touch':'keyboard';
  let floatingStick={clear(){},isMoving(){return false}};

  function rememberMoveSide(player,horizontalInput){
    if(Math.abs(horizontalInput)>.1)player.lastMoveSide=Math.sign(horizontalInput);
  }

  function gestureClearance(){
    const value=getComputedStyle(document.documentElement).getPropertyValue('--gesture-clearance');
    return Math.max(0,Number.parseFloat(value)||0);
  }

  function syncInputMode(mode=inputMode){
    inputMode=mode;
    document.body.classList.toggle('touch-input',mode==='touch');
    document.body.classList.toggle('keyboard-input',mode==='keyboard');
    const hideSticks=mode==='touch';
    document.querySelectorAll('.stick-zone').forEach(zone=>{
      zone.style.display=hideSticks?'none':'';
    });
  }

  function showTapMarker(x,y,player){
    const marker=document.createElement('div');
    marker.textContent='◎';
    marker.setAttribute('aria-hidden','true');
    Object.assign(marker.style,{
      position:'fixed',
      left:`${x}px`,
      top:`${y}px`,
      transform:`translate(-50%,-50%)${player===1?' rotate(180deg)':''}`,
      zIndex:'19',
      pointerEvents:'none',
      color:'#fff',
      fontSize:'28px',
      fontWeight:'900',
      lineHeight:'1',
      textShadow:'0 0 8px #000,0 0 10px #fff8',
      opacity:'1',
      transition:'transform .18s ease-out,opacity .18s ease-out'
    });
    document.body.appendChild(marker);
    requestAnimationFrame(()=>{
      marker.style.opacity='0';
      marker.style.transform=`translate(-50%,-50%) scale(1.5)${player===1?' rotate(180deg)':''}`;
    });
    setTimeout(()=>marker.remove(),220);
  }

  function clearTransientInput(){
    activePointers.clear();
    floatingStick.clear();
    document.querySelectorAll('.stick-zone i').forEach(knob=>{
      knob.style.transform='translate(-50%,-50%)';
    });
    getPlayers().forEach(player=>{
      player.move?.set(0,0);
      player.fireHeld=false;
    });
  }

  document.querySelectorAll('.stick-zone').forEach(zone=>{
    const knob=zone.querySelector('i'),base=zone.querySelector('.stick');
    const player=Number(zone.dataset.player),kind=zone.dataset.kind;

    function apply(e){
      const players=getPlayers();
      if(!players[player])return;
      const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const screenDx=e.clientX-cx,screenDy=e.clientY-cy;
      const max=r.width*.33,len=Math.hypot(screenDx,screenDy)||1,k=Math.min(1,max/len);
      knob.style.transform=`translate(calc(-50% + ${screenDx*k}px),calc(-50% + ${screenDy*k}px))`;
      let vx=screenDx/max,vy=screenDy/max;const mag=Math.hypot(vx,vy);
      if(mag>1){vx/=mag;vy/=mag} if(mag<.12){vx=0;vy=0}
      const world=mapControl(player,vx,vy);
      const vec=kind==='move'?players[player].move:players[player].aim;
      vec.copy(world);
      if(kind==='aim'){
        if(inputMode==='touch'){
          players[player].fireHeld=false;
        }else if(isTpsMode()){
          players[player].fireHeld=false;
        }else{
          players[player].fireHeld=mag>.35;
          if(players[player].fireHeld)shoot(player);
        }
      }else{
        rememberMoveSide(players[player],vx);
      }
    }

    zone.addEventListener('pointerdown',e=>{
      syncInputMode('touch');
      e.preventDefault();
      zone.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId,{player,kind});
      apply(e);
    });
    zone.addEventListener('pointermove',e=>{
      if(activePointers.has(e.pointerId))apply(e);
    });
    const end=e=>{
      if(!activePointers.has(e.pointerId))return;
      activePointers.delete(e.pointerId);
      knob.style.transform='translate(-50%,-50%)';
      const players=getPlayers();
      if(players[player]){
        if(kind==='move')players[player].move.set(0,0);
        if(kind==='aim')players[player].fireHeld=false;
      }
    };
    zone.addEventListener('pointerup',end);
    zone.addEventListener('pointercancel',end);
    zone.addEventListener('lostpointercapture',end);
  });

  const canvas=document.querySelector('#game');

  function resolveTouchPlayer(clientX,clientY){
    const players=getPlayers();
    if(players.length<2)return null;
    const r=canvas.getBoundingClientRect();
    const localX=clientX-r.left;
    const localY=clientY-r.top;
    if(localX<0||localX>r.width||localY<0||localY>r.height-gestureClearance())return null;
    const half=Math.max(1,r.height/2);
    const player=localY<half?1:0;
    const fighter=players[player];
    return fighter?.alive?player:null;
  }

  function aimAtScreen(player,clientX,clientY,showMarker=false){
    const players=getPlayers();
    const fighter=players[player];
    if(!fighter?.alive)return false;
    const r=canvas.getBoundingClientRect();
    const localX=clientX-r.left;
    const localY=clientY-r.top;
    const half=Math.max(1,r.height/2);

    const ndcX=localX/Math.max(1,r.width)*2-1;
    let ndcY;
    if(isTpsMode()){
      const viewportY=player===1?localY:localY-half;
      ndcY=1-viewportY/half*2;
    }else{
      ndcY=1-localY/Math.max(1,r.height)*2;
    }
    const target=mapControl(player,ndcX,ndcY,'ground');
    if(!target)return false;

    const dx=target.x-fighter.root.position.x;
    const dz=target.z-fighter.root.position.z;
    const len=Math.hypot(dx,dz);
    if(len<.08)return false;
    fighter.aim.set(dx/len,dz/len);
    if(showMarker)showTapMarker(clientX,clientY,player);
    return true;
  }

  floatingStick=createFloatingStickController({
    canvas,
    resolvePlayer:resolveTouchPlayer,
    onTouchInput:()=>syncInputMode('touch'),
    onMove:(player,x,y)=>{
      const fighter=getPlayers()[player];
      if(fighter){
        fighter.move.copy(mapControl(player,x,y));
        rememberMoveSide(fighter,x);
      }
    },
    onMoveEnd:player=>getPlayers()[player]?.move.set(0,0),
    onTap:(player,x,y)=>{
      if(aimAtScreen(player,x,y,true))shoot(player);
    },
    onFireStart:(player,x,y)=>{
      const fighter=getPlayers()[player];
      if(aimAtScreen(player,x,y,true)&&fighter){fighter.fireHeld=true;shoot(player)}
    },
    onFireMove:(player,x,y)=>aimAtScreen(player,x,y),
    onFireEnd:player=>{
      const fighter=getPlayers()[player];
      if(fighter)fighter.fireHeld=false;
    }
  });

  const keys=new Set();
  addEventListener('keydown',e=>{
    syncInputMode('keyboard');
    keys.add(e.key.toLowerCase());
  });
  addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  addEventListener('blur',()=>{
    keys.clear();
    clearTransientInput();
  });
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){
      keys.clear();
      clearTransientInput();
    }
  });

  function applyKeyboardMove(player,x,y){
    const players=getPlayers();
    if(!players[player])return;
    if(x||y){
      players[player].move.copy(mapControl(player,x,y)).normalize();
      rememberMoveSide(players[player],x);
    }
    else if(!floatingStick.isMoving(player)&&![...activePointers.values()].some(v=>v.player===player&&v.kind==='move'))players[player].move.set(0,0);
  }

  function applyKeyboardAim(player,x,y){
    const players=getPlayers();
    if(!players[player])return;
    players[player].aim.copy(mapControl(player,x,y));
    shoot(player);
  }

  function update(){
    syncInputMode();
    const players=getPlayers();
    if(!players.length)return;

    let x=(keys.has('d')?1:0)-(keys.has('a')?1:0);
    let y=(keys.has('s')?1:0)-(keys.has('w')?1:0);
    applyKeyboardMove(0,x,y);
    if(keys.has('f'))applyKeyboardAim(0,-1,0);
    if(keys.has('g'))applyKeyboardAim(0,1,0);
    if(keys.has('r'))activateSuper(0);

    x=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);
    y=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0);
    applyKeyboardMove(1,x,y);
    if(keys.has('k'))applyKeyboardAim(1,-1,0);
    if(keys.has('l'))applyKeyboardAim(1,1,0);
    if(keys.has('o'))activateSuper(1);
  }

  syncInputMode();
  return {update,clear:clearTransientInput};
}
