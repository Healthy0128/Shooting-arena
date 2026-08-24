export function createInputController({getPlayers,screenVectorToWorld,shoot,activateSuper}){
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
      // The knob always follows the finger. Only the gameplay vector is rotated for the face-to-face player.
      knob.style.transform=`translate(calc(-50% + ${screenDx*k}px),calc(-50% + ${screenDy*k}px))`;
      let vx=screenDx/max,vy=screenDy/max;const mag=Math.hypot(vx,vy);
      if(mag>1){vx/=mag;vy/=mag} if(mag<.12){vx=0;vy=0}
      const world=screenVectorToWorld(player,vx,vy);
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

  function update(){
    const players=getPlayers();
    if(!players.length)return;
    const p1=players[0],p2=players[1];
    let x=(keys.has('d')?1:0)-(keys.has('a')?1:0),z=(keys.has('s')?1:0)-(keys.has('w')?1:0);
    if(x||z)p1.move.set(x,z).normalize();else if(![...activePointers.values()].some(v=>v.player===0&&v.kind==='move'))p1.move.set(0,0);
    if(keys.has('f')){p1.aim.set(-1,0);shoot(0)} if(keys.has('g')){p1.aim.set(1,0);shoot(0)} if(keys.has('r'))activateSuper(0);
    x=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);z=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0);
    if(x||z)p2.move.set(x,z).normalize();else if(![...activePointers.values()].some(v=>v.player===1&&v.kind==='move'))p2.move.set(0,0);
    if(keys.has('k')){p2.aim.set(-1,0);shoot(1)} if(keys.has('l')){p2.aim.set(1,0);shoot(1)} if(keys.has('o'))activateSuper(1);
  }

  return {update};
}
