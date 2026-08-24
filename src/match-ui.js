const banner=document.querySelector('#banner');
const resultStats=document.querySelector('#match-result-stats');
const matchFinish=document.querySelector('#match-finish');
const matchFinishTitle=document.querySelector('#match-finish-title');
const matchFinishScore=document.querySelector('#match-finish-score');
let bannerTimer=null;

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

export function showMatchFinish(winner,players,suddenDeath=false){
  if(!matchFinish)return;
  matchFinishTitle.textContent=suddenDeath?'SUDDEN DEATH WIN':`P${winner+1} WIN`;
  matchFinishScore.textContent=`${players[0].score} - ${players[1].score}`;
  matchFinish.hidden=false;
  requestAnimationFrame(()=>matchFinish.classList.add('show'));
}

export function hideMatchFinish(){
  if(!matchFinish)return;
  matchFinish.classList.remove('show');
  matchFinish.hidden=true;
}
