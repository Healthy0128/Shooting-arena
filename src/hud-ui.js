export function createHudUI({getPlayers,getCamera,defenseLabel}){
  const $=s=>document.querySelector(s);

  function ensureWorldStatus(p){
    if(p.worldStatus)return;
    const el=document.createElement('div');
    el.className=`world-status p${p.i+1}`;
    el.innerHTML=`
      <div class="world-hp-track"><div class="world-hp-fill"></div></div>
      <div class="world-heat-track"><div class="world-heat-fill"></div></div>
      <div class="world-def-state"></div>
    `;
    document.body.appendChild(el);
    p.worldStatus=el;
  }

  function updateWorldStatus(){
    const players=getPlayers();
    const camera=getCamera();
    players.forEach(p=>{
      ensureWorldStatus(p);
      const el=p.worldStatus;
      if(!p.alive||!p.root.visible){el.style.display='none';return}
      el.style.display='block';

      const q=p.root.position.clone();
      q.y=2.35;
      q.project(camera);

      el.style.left=`${(q.x*.5+.5)*100}%`;
      el.style.top=`${(-q.y*.5+.5)*100}%`;

      const hp=el.querySelector('.world-hp-fill');
      const heat=el.querySelector('.world-heat-fill');
      hp.style.width=`${Math.max(0,Math.min(100,p.hp/p.maxHp*100))}%`;
      heat.style.width=`${Math.max(0,Math.min(100,p.heat||0))}%`;
      heat.classList.toggle('warm',(p.heat||0)>=60);
      heat.classList.toggle('overheated',!!p.overheated);
      el.classList.toggle('is-overheated',!!p.overheated);
      el.classList.toggle('is-recovering',(p.recovery||0)>0);
      el.classList.toggle('is-powered',(p.powerBuff||0)>0);
      const defState=el.querySelector('.world-def-state');
      if(p.cfg.defense==='guard'){
        defState.textContent=p.guarding?`GUARD ${Math.ceil(p.guard)}`:(p.defenseCd>0?`BREAK ${p.defenseCd.toFixed(1)}s`:`GUARD ${Math.ceil(p.guard)}`);
      }else if(p.cfg.defense==='barrier'){
        defState.textContent=p.barrier>0?`BARRIER ${Math.ceil(p.barrier)}`:(p.defenseCd>0?`${p.defenseCd.toFixed(1)}s`:'BARRIER');
      }else if(p.cfg.defense==='parry'){
        defState.textContent=p.parryChain?`PARRY x${p.parryChain}`:(p.defenseCd>0?`${p.defenseCd.toFixed(1)}s`:'PARRY');
      }else{
        defState.textContent=p.defenseCd>0?`${defenseLabel(p.cfg.defense)} ${p.defenseCd.toFixed(1)}s`:defenseLabel(p.cfg.defense);
      }
    });
  }

  function clearWorldStatus(){
    getPlayers().forEach(p=>{
      p.worldStatus?.remove();
      p.worldStatus=null;
    });
  }

  function updateHUD(){
    getPlayers().forEach((p,i)=>{
      $(`#p${i+1}-name`).textContent=p.cfg.name;
      $(`#p${i+1}-hp`).style.width=`${(p.hp/p.maxHp)*100}%`;
      $(`#p${i+1}-super`).style.width=`${p.super}%`;
      $(`#p${i+1}-score`).textContent=[0,1,2].map(n=>n<p.score?'●':'○').join(' ');
      $(`.super-btn[data-player="${i}"]`).classList.toggle('ready',p.super>=100);
      const db=$(`.def-btn[data-player="${i}"]`);
      if(db){
        db.textContent=defenseLabel(p.cfg.defense);
        db.classList.toggle('active',p.guarding||p.barrier>0||p.parryActive>0);
        db.classList.toggle('cooling',p.defenseCd>0&&!p.guarding);
      }
    });
  }

  return {updateHUD,updateWorldStatus,clearWorldStatus};
}
