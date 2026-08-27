import {
  BUILD_LIMIT,
  LOADOUT_OPTIONS,
  DEFAULT_LOADOUTS,
  DEFENSE_INFO,
  SUPER_INFO,
  PASSIVES,
  BODY_META,
  WEAPON_INFO
} from './loadout-config.js?v=6180';
import { ARENA_OPTIONS } from './arena-config.js?v=6350';
import { vibrate } from './feedback.js?v=6160';

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

function detailAttrs(kind,title,text){
  const esc=value=>String(value||'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  return `tabindex="0" role="button" data-detail-kind="${esc(kind)}" data-detail-title="${esc(title)}" data-detail-text="${esc(text)}"`;
}

function ensureDetailModal(){
  let modal=document.querySelector('#detail-modal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='detail-modal';
  modal.className='detail-modal';
  modal.hidden=true;
  modal.innerHTML=`
    <div class="detail-sheet" role="dialog" aria-modal="true" aria-labelledby="detail-title">
      <div class="detail-sheet-top"><span id="detail-kind">詳細</span><button type="button" class="detail-close" aria-label="閉じる">×</button></div>
      <h3 id="detail-title"></h3>
      <p id="detail-text"></p>
      <small>画面の外側をタップして閉じる</small>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('pointerdown',event=>{
    if(event.target===modal||event.target.closest('.detail-close'))modal.hidden=true;
  });
  return modal;
}

function openDetail(target){
  if(!target)return;
  const modal=ensureDetailModal();
  modal.querySelector('#detail-kind').textContent=target.dataset.detailKind||'詳細';
  modal.querySelector('#detail-title').textContent=target.dataset.detailTitle||'';
  modal.querySelector('#detail-text').textContent=target.dataset.detailText||'';
  modal.hidden=false;
}

function installDetailInteraction(){
  const menu=document.querySelector('#menu');
  if(!menu||menu.dataset.detailReady)return;
  menu.dataset.detailReady='1';
  let timer=0;
  let target=null;
  let pointerType='';
  let openedByHold=false;

  const clear=()=>{
    if(timer)clearTimeout(timer);
    timer=0;
  };

  menu.addEventListener('pointerdown',event=>{
    target=event.target.closest('.detail-target');
    if(!target)return;
    pointerType=event.pointerType||'';
    openedByHold=false;
    clear();
    if(pointerType==='touch'||pointerType==='pen'){
      timer=setTimeout(()=>{
        openedByHold=true;
        openDetail(target);
        vibrate(12);
      },520);
    }
  });
  menu.addEventListener('pointerup',event=>{
    clear();
    const current=event.target.closest('.detail-target');
    if(pointerType==='mouse'&&current)openDetail(current);
    target=null;
  });
  menu.addEventListener('pointercancel',clear);
  menu.addEventListener('pointermove',event=>{
    if(!target)return;
    const hit=document.elementFromPoint(event.clientX,event.clientY)?.closest?.('.detail-target');
    if(hit!==target)clear();
  });
  menu.addEventListener('click',event=>{
    if(openedByHold){
      event.preventDefault();
      openedByHold=false;
    }
  },true);
  menu.addEventListener('keydown',event=>{
    const current=event.target.closest?.('.detail-target');
    if(current&&(event.key==='Enter'||event.key===' ')){
      event.preventDefault();
      openDetail(current);
    }
  });
}

export function renderLoadoutSummary(card,cfg,cost,over){
  const summary=card?.querySelector('.loadout-summary');
  if(!summary||!cfg)return;

  const body=BODY_META[cfg.bodyKey]||BODY_META.knight;
  const weapon=WEAPON_INFO[cfg.weaponStyle]||{name:String(cfg.weaponStyle||'—'),role:'',desc:'効果情報なし',longDesc:'効果情報なし'};
  const pelletCount=cfg.pellets||1;
  const bodyDamageMul=body.damageMul||1;
  const burstPower=cfg.damage*pelletCount*bodyDamageMul;
  const fireRate=1/Math.max(.01,cfg.fireCd||1);
  const range=(cfg.bulletSpeed||0)*(cfg.bulletLife||0);
  const incoming=(body.damageTakenMul||1)*(cfg.damageTakenMul||1);
  const superGain=(body.superGainMul||1)*(cfg.superGainMul||1);
  const defense=DEFENSE_INFO[cfg.defense]||{name:String(cfg.defense||'—'),desc:'効果情報なし',longDesc:'効果情報なし'};
  const superInfo=SUPER_INFO[cfg.super]||{name:String(cfg.super||'—'),desc:'効果情報なし',longDesc:'効果情報なし'};
  const passive=PASSIVES[cfg.passive]||{name:String(cfg.passive||'—'),desc:'効果情報なし',longDesc:'効果情報なし'};

  card.style.setProperty('--player-accent',colorHex(cfg.color));
  summary.innerHTML=`
    <div class="loadout-head">
      <div class="detail-target" ${detailAttrs('キャラクター',`${cfg.name}・${body.role}`,body.longDesc||body.desc)}>
        <strong>${cfg.name}</strong>
        <small>${body.label} · 攻撃${Math.round(bodyDamageMul*100)}% · 被ダメ${Math.round(incoming*100)}% · 必殺${Math.round(superGain*100)}%</small>
      </div>
      <span class="build-pill ${over?'over':''}">COST ${cost}/${BUILD_LIMIT}</span>
    </div>
    <div class="stat-meters">
      ${meter('体力',cfg.hp,String(cfg.hp),170)}
      ${meter('速さ',cfg.speed,cfg.speed.toFixed(1),7.8)}
      ${meter('攻撃',burstPower,pelletCount>1?`${Math.round(cfg.damage*bodyDamageMul)}×${pelletCount}`:String(Math.round(cfg.damage*bodyDamageMul)),90)}
      ${meter('連射',fireRate,`${fireRate.toFixed(1)}/秒`,10.5)}
      ${meter('射程',range,range.toFixed(1),30)}
    </div>
    <div class="weapon-profile detail-target" ${detailAttrs('武器',`${weapon.name}・${weapon.role}`,weapon.longDesc||weapon.desc)}>
      <span>武器</span><b>${weapon.name} · ${weapon.role}</b><small>${weapon.desc}</small>
    </div>
    <div class="ability-grid">
      <div class="ability-card detail-target" ${detailAttrs('防御',defense.name,defense.longDesc||defense.desc)}><span>防御</span><b>${defense.name}</b><small>${defense.desc}</small></div>
      <div class="ability-card detail-target" ${detailAttrs('必殺技',superInfo.name,superInfo.longDesc||superInfo.desc)}><span>必殺</span><b>${superInfo.name}</b><small>${superInfo.desc}</small></div>
      <div class="ability-card detail-target" ${detailAttrs('パッシブ',passive.name,passive.longDesc||passive.desc)}><span>パッシブ</span><b>${passive.name}</b><small>${passive.desc}</small></div>
    </div>
    <div class="hold-hint">長押しで詳しい説明</div>`;
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

  const randomArenaButton=document.createElement('button');
  randomArenaButton.dataset.arena='random';
  randomArenaButton.textContent='🎲 ランダム';
  randomArenaButton.className='random-arena';

  const arenaOptionButtons=Object.entries(ARENA_OPTIONS).map(([value,label],index)=>{
    const button=document.createElement('button');
    button.dataset.arena=value;
    button.textContent=label;
    if(index===0)button.classList.add('selected');
    return button;
  });
  arenaButtons.replaceChildren(randomArenaButton,...arenaOptionButtons);

  ensureDetailModal();
  installDetailInteraction();
}
