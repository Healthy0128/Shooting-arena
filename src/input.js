export function createInputController({getPlayers,mapStick,shoot,activateSuper}){
  const activePointers=new Map();

  function clearTransientInput(){
    activePointers.clear();
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
      // The knob follows the physical finger. Face-to-face normalization and camera mapping happen after this raw input step.
      knob.style.transform=`translate(calc(-50% + ${screenDx*k}px),calc(-50% + ${screenDy*k}px))`;
      let vx=screenDx/max,vy=screenDy/max;const mag=Math.hypot(vx,vy);
      if(mag>1){vx/=mag;vy/=mag} if(mag<.12){vx=0;vy=0}
      const world=mapStick(player,vx,vy);
      const vec=kind==='move'?players[player].move:players[player].aim;
      vec.copy(world);
      if(kind==='aim'){
        players[player].fireHeld=mag>.35;
        if(players[player].fireHeld)shoot(player);
      }
    }

    zone.addEventListener('pointerdown',e=>{
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

  const keys=new Set();
  addEventListener('keydown',e=>keys.add(e.key.toLowerCase()));
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
    if(x||y)players[player].move.copy(mapStick(player,x,y)).normalize();
    else if(![...activePointers.values()].some(v=>v.player===player&&v.kind==='move'))players[player].move.set(0,0);
  }

  function applyKeyboardAim(player,x,y){
    const players=getPlayers();
    if(!players[player])return;
    players[player].aim.copy(mapStick(player,x,y));
    shoot(player);
  }

  function update(){
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

  return {update};
}
