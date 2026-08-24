import { BUILD_LIMIT, LOADOUT_OPTIONS, DEFAULT_LOADOUTS } from './loadout-config.js?v=695';
import { ARENA_OPTIONS } from './arena-config.js?v=695';

const banner=document.querySelector('#banner');
const resultStats=document.querySelector('#match-result-stats');
const buildLimitValue=document.querySelector('#build-limit-value');
const arenaButtons=document.querySelector('.arena-buttons');
let bannerTimer=null;

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

buildLimitValue.textContent=BUILD_LIMIT;

export function showBanner(text,ms=650){
  banner.textContent=text;banner.classList.add('show');
  if(bannerTimer)clearTimeout(bannerTimer);
  bannerTimer=setTimeout(()=>{
    banner.classList.remove('show');
    bannerTimer=null;
  },ms);
}

function accuracyOf(p){return p.stats.shots>0?Math.round((p.stats.hits/p.stats.shots)*100):0}
function statRow(label,a,b,suffix=''){
  return `<div class="result-stat"><span>${Math.round(a)}${suffix}</span><b>${label}</b><span>${Math.round(b)}${suffix}</span></div>`;
}

export function renderMatchResult(_winner,players){
  const a=players[0],b=players[1];
  resultStats.innerHTML=`
    <div class="result-head"><span>P1</span><b>MATCH STATS</b><span>P2</span></div>
    ${statRow('DAMAGE',a.stats.damageDealt,b.stats.damageDealt)}
    ${statRow('HITS',a.stats.hits,b.stats.hits)}
    ${statRow('ACCURACY',accuracyOf(a),accuracyOf(b),'%')}
    ${statRow('SUPER',a.stats.supers,b.stats.supers)}
    ${statRow('DEFENSE',a.stats.defenses,b.stats.defenses)}
    ${statRow('CORE',a.stats.cores,b.stats.cores)}
    ${statRow('PARRY',a.stats.parries,b.stats.parries)}`;
}

export function hideMatchResult(){resultStats.replaceChildren()}
