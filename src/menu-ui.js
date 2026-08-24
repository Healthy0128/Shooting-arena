import {
  BUILD_LIMIT,
  LOADOUT_OPTIONS,
  DEFAULT_LOADOUTS,
  DEFENSE_INFO,
  SUPER_INFO,
  PASSIVES
} from './loadout-config.js?v=6104';
import { ARENA_OPTIONS } from './arena-config.js?v=695';

function clamp01(value){
  return Math.max(0,Math.min(1,value));
}

function meter(label,value,text,max){
  const pct=Math.round(clamp01(value/max)*100);
  return `
    <div class="stat-row">
      <span>${label}</span>
      <div class="stat-track"><i style="width:${pct}%"></i></div>
      <b>${text}</b>
    </div>`;
}

function colorHex(value){
  return `#${Number(value||0xffffff).toString(16).padStart(6,'0')}`;
}

export function renderLoadoutSummary(card,cfg,cost,over){
  const summary=card?.querySelector('.loadout-summary');
  if(!summary||!cfg)return;

  const pelletCount=cfg.pellets||1;
  const burstPower=cfg.damage*pelletCount;
  const fireRate=1/Math.max(.01,cfg.fireCd||1);
  const range=(cfg.bulletSpeed||0)*(cfg.bulletLife||0);
  const defense=DEFENSE_INFO[cfg.defense]||{name:String(cfg.defense||'—').toUpperCase(),desc:'効果情報なし'};
  const superInfo=SUPER_INFO[cfg.super]||{name:String(cfg.super||'—').toUpperCase(),desc:'効果情報なし'};
  const passive=PASSIVES[cfg.passive]||{name:String(cfg.passive||'—').toUpperCase(),desc:'効果情報なし'};

  card.style.setProperty('--player-accent',colorHex(cfg.color));
  summary.innerHTML=`
    <div class="loadout-head">
      <div><strong>${cfg.name}</strong><small>${cfg.bodyLabel||''}</small></div>
      <span class="build-pill ${over?'over':''}">COST ${cost}/${BUILD_LIMIT}</span>
    </div>
    <div class="stat-meters">
      ${meter('HP',cfg.hp,String(cfg.hp),160)}
      ${meter('SPEED',cfg.speed,cfg.speed.toFixed(1),7)}
      ${meter('POWER',burstPower,pelletCount>1?`${cfg.damage}×${pelletCount}`:String(cfg.damage),70)}
      ${meter('FIRE',fireRate,`${fireRate.toFixed(1)}/s`,6.5)}
      ${meter('RANGE',range,range.toFixed(1),26)}
    </div>
    <div class="ability-grid">
      <div class="ability-card"><span>DEFENSE</span><b>${defense.name}</b><small>${defense.desc}</small></div>
      <div class="ability-card"><span>SUPER</span><b>${superInfo.name}</b><small>${superInfo.desc}</small></div>
      <div class="ability-card"><span>PASSIVE</span><b>${passive.name}</b><small>${passive.desc}</small></div>
    </div>`;
}

export function initMenuUI(){
  const arenaButtons=document.querySelector('.arena-buttons');

  document.querySelectorAll('.loadout-card').forEach(card=>{
    const player=Number(card.dataset.player);
    const defaults=DEFAULT_LOADOUTS[player]||DEFAULT_LOADOUTS[0];
    card.querySelectorAll('select[data-slot]').forEach(select=>{
      const slot=select.dataset.slot;
      const options=LOADOUT_OPTIONS[slot];
      const entries=Object.entries(options);
      const defaultValue=defaults[slot];
      const defaultIndex=entries.findIndex(([value])=>value===defaultValue);
      if(defaultIndex>0)entries.unshift(entries.splice(defaultIndex,1)[0]);
      const nodes=entries.map(([value,label])=>{
        const option=document.createElement('option');
        option.value=value;
        option.textContent=label;
        return option;
      });
      select.replaceChildren(...nodes);
      if(defaultValue in options)select.value=defaultValue;
    });
  });

  arenaButtons.replaceChildren(...Object.entries(ARENA_OPTIONS).map(([value,label],index)=>{
    const button=document.createElement('button');
    button.dataset.arena=value;
    button.textContent=label;
    if(index===0)button.classList.add('selected');
    return button;
  }));
}
