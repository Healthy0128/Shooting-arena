import { BUILD_LIMIT, LOADOUT_OPTIONS, DEFAULT_LOADOUTS } from './loadout-config.js?v=695';
import { ARENA_OPTIONS } from './arena-config.js?v=695';

export function initMenuUI(){
  const buildLimitValue=document.querySelector('#build-limit-value');
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

  buildLimitValue.textContent=BUILD_LIMIT;
}
