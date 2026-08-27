const banner=document.querySelector('#banner');
const resultStats=document.querySelector('#match-result-stats');
const resultHighlights=document.querySelector('#result-highlights');
const vsIntro=document.querySelector('#vs-intro');
const respawnCue=document.querySelector('#respawn-cue');
const matchFinish=document.querySelector('#match-finish');
const matchFinishTitle=document.querySelector('#match-finish-title');
const matchFinishName=document.querySelector('#match-finish-name');
const matchFinishScore=document.querySelector('#match-finish-score');
const matchFinishAward=document.querySelector('#match-finish-award');
const matchFinishKicker=document.querySelector('.match-finish-kicker');
const resultWinner=document.querySelector('#winner');
const resultRule=document.querySelector('#result-rule');
const resultScore=document.querySelector('#result-score');
let bannerTimer=null;

export function showBanner(text,ms=650){
  banner.textContent=text;banner.classList.add('show');
  if(bannerTimer)clearTimeout(bannerTimer);
  bannerTimer=setTimeout(()=>{
    banner.classList.remove('show');
    bannerTimer=null;
  },ms);
}

function accuracyOf(p){return p.stats.shots>0?Math.round((p.stats.accuracyHits/p.stats.shots)*100):0}
function statRow(label,a,b,suffix=''){
  return `<div class="result-stat"><span>${Math.round(a)}${suffix}</span><b>${label}</b><span>${Math.round(b)}${suffix}</span></div>`;
}

function scoreText(match){
  return match.ruleKey==='stock'
    ?`${match.stocks[0]} - ${match.stocks[1]} STOCK`
    :`${match.scores[0]} - ${match.scores[1]} KOs`;
}

function buildLabel(player){
  const weapon=(player.cfg.weaponStyle||'rifle').toUpperCase();
  const defense=(player.cfg.defense||'guard').toUpperCase();
  return `${weapon} · ${defense} · ${player.cfg.passiveName||'NONE'}`;
}

function bestPlayer(players,value){
  const a=value(players[0]),b=value(players[1]);
  return a===b?null:(a>b?0:1);
}

function winnerAward(winner,players){
  const accuracy=accuracyOf(players[winner]);
  if(accuracy>=70)return 'SHARPSHOOTER';
  if(players[winner].stats.parries>0)return 'PARRY MASTER';
  if(players[winner].stats.damageDealt>=players[1-winner].stats.damageDealt*1.35)return 'HEAVY HITTER';
  return 'ARENA CHAMPION';
}

export function showVsIntro(players,match,arenaName){
  if(!vsIntro)return;
  document.querySelector('#vs-p1-name').textContent=players[0].cfg.name;
  document.querySelector('#vs-p2-name').textContent=players[1].cfg.name;
  document.querySelector('#vs-p1-build').textContent=buildLabel(players[0]);
  document.querySelector('#vs-p2-build').textContent=buildLabel(players[1]);
  document.querySelector('#vs-rule').textContent=match.ruleName;
  document.querySelector('#vs-stage').textContent=arenaName;
  vsIntro.style.setProperty('--p1-color',`#${players[0].cfg.color.toString(16).padStart(6,'0')}`);
  vsIntro.style.setProperty('--p2-color',`#${players[1].cfg.color.toString(16).padStart(6,'0')}`);
  vsIntro.hidden=false;
  requestAnimationFrame(()=>vsIntro.classList.add('show'));
}

export function hideVsIntro(){
  if(!vsIntro)return;
  vsIntro.classList.remove('show');
  setTimeout(()=>{if(!vsIntro.classList.contains('show'))vsIntro.hidden=true},220);
}

export function showRespawnCue(player){
  if(!respawnCue)return;
  respawnCue.querySelector('strong').textContent=`PLAYER ${player.i+1}`;
  respawnCue.style.setProperty('--respawn-color',`#${player.cfg.color.toString(16).padStart(6,'0')}`);
  respawnCue.classList.toggle('p2',player.i===1);
  respawnCue.hidden=false;
  requestAnimationFrame(()=>respawnCue.classList.add('show'));
}

export function hideRespawnCue(){
  if(!respawnCue)return;
  respawnCue.classList.remove('show');
  setTimeout(()=>{if(!respawnCue.classList.contains('show'))respawnCue.hidden=true},180);
}

export function renderMatchResult(winner,players,match){
  const a=players[0],b=players[1];
  resultWinner.textContent=`P${winner+1} WIN! ${players[winner].cfg.name}`;
  resultRule.textContent=match.suddenDeath?`${match.ruleName}・サドンデス`:match.ruleName;
  resultScore.textContent=scoreText(match);
  const damageLeader=bestPlayer(players,p=>p.stats.damageDealt);
  const aimLeader=bestPlayer(players,p=>accuracyOf(p));
  resultHighlights.innerHTML=`
    <div class="result-award winner"><small>WINNER</small><b>${winnerAward(winner,players)}</b><span>P${winner+1}</span></div>
    <div class="result-award"><small>TOP DAMAGE</small><b>${damageLeader===null?'DRAW':`P${damageLeader+1}`}</b><span>${Math.round(Math.max(a.stats.damageDealt,b.stats.damageDealt))}</span></div>
    <div class="result-award"><small>BEST AIM</small><b>${aimLeader===null?'DRAW':`P${aimLeader+1}`}</b><span>${Math.max(accuracyOf(a),accuracyOf(b))}%</span></div>`;
  resultStats.innerHTML=`
    <div class="result-head"><span>P1</span><b>MATCH STATS</b><span>P2</span></div>
    ${statRow('DAMAGE',a.stats.damageDealt,b.stats.damageDealt)}
    ${statRow('SHOTS',a.stats.shots,b.stats.shots)}
    ${statRow('HITS',a.stats.hits,b.stats.hits)}
    ${statRow('ACCURACY',accuracyOf(a),accuracyOf(b),'%')}
    ${statRow('SUPER',a.stats.supers,b.stats.supers)}
    ${statRow('DEFENSE',a.stats.defenses,b.stats.defenses)}
    ${statRow('CORE',a.stats.cores,b.stats.cores)}
    ${statRow('PARRY',a.stats.parries,b.stats.parries)}`;
}

export function hideMatchResult(){resultStats.replaceChildren();resultHighlights?.replaceChildren()}

export function showMatchFinish(winner,players,match,kicker='FINAL K.O.'){
  if(!matchFinish)return;
  matchFinishKicker.textContent=match.suddenDeath?'SUDDEN DEATH':kicker;
  matchFinishTitle.textContent=`P${winner+1} WIN`;
  matchFinishName.textContent=players[winner].cfg.name;
  matchFinishScore.textContent=scoreText(match);
  matchFinishAward.textContent=winnerAward(winner,players);
  matchFinish.style.setProperty('--winner-color',`#${players[winner].cfg.color.toString(16).padStart(6,'0')}`);
  matchFinish.hidden=false;
  requestAnimationFrame(()=>matchFinish.classList.add('show'));
}

export function hideMatchFinish(){
  if(!matchFinish)return;
  matchFinish.classList.remove('show');
  matchFinish.hidden=true;
}
