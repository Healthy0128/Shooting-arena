import * as THREE from 'three';
import { showBanner, renderMatchResult, hideMatchResult, renderLoadoutSummary } from './ui.js?v=6160';
import { createInputController } from './input.js?v=6151';
import { createHudUI } from './hud-ui.js?v=6170';
import { createCameraController } from './camera.js?v=6170';
import { createArenaController } from './arena.js?v=6120';
import { createPlayerController, defenseLabel } from './player.js?v=6170';
import { createCombatController } from './combat.js?v=6170';
import { createAudioController } from './audio.js?v=6160';
import { createPauseUI } from './pause-ui.js?v=6160';
import { createMatchScheduler } from './match-scheduler.js?v=6150';
import { createFeedbackController } from './feedback.js?v=6160';
import { createFieldWeaponController } from './field-weapons.js?v=6170';
import { CHARACTERS, BODY_SOURCE, BODY_META, WEAPON_SOURCE, COLOR_VALUES, BUILD_LIMIT, PASSIVES, BUILD_COSTS } from './loadout-config.js?v=6120';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1118);
scene.fog = new THREE.Fog(0x0d1118, 36, 62);

scene.add(new THREE.HemisphereLight(0xeaf2ff,0x202534,2.1));
const sun = new THREE.DirectionalLight(0xffffff,2.2);
sun.position.set(7,14,8);
scene.add(sun);

function loadoutValue(card,slot){
  return card?.querySelector(`[data-slot="${slot}"]`)?.value||'';
}

function buildCostFromCard(card){
  if(!card)return 999;
  let total=0;
  for(const slot of ['body','weapon','defense','super','passive']){
    total+=BUILD_COSTS[slot]?.[loadoutValue(card,slot)]||0;
  }
  return total;
}

function saveLoadout(i){
  const card=document.querySelector(`.loadout-card[data-player="${i}"]`);
  if(!card)return;
  const data={};
  card.querySelectorAll('[data-slot]').forEach(el=>data[el.dataset.slot]=el.value);
  try{localStorage.setItem(`duelArena.loadout.${i}`,JSON.stringify(data))}catch{}
}

function restoreLoadout(i){
  const card=document.querySelector(`.loadout-card[data-player="${i}"]`);
  if(!card)return;
  try{
    const raw=localStorage.getItem(`duelArena.loadout.${i}`);
    if(!raw)return;
    const data=JSON.parse(raw);
    card.querySelectorAll('[data-slot]').forEach(el=>{
      if(data[el.dataset.slot] && [...el.options].some(o=>o.value===data[el.dataset.slot])){
        el.value=data[el.dataset.slot];
      }
    });
  }catch{}
}

function randomizeLoadout(i){
  const card=document.querySelector(`.loadout-card[data-player="${i}"]`);
  if(!card)return;
  const sels=[...card.querySelectorAll('[data-slot]')];
  for(let tries=0;tries<200;tries++){
    sels.forEach(sel=>{
      sel.selectedIndex=Math.floor(Math.random()*sel.options.length);
    });
    if(buildCostFromCard(card)<=BUILD_LIMIT)break;
  }
  refreshLoadoutSummary(i);
  saveLoadout(i);
}

function buildCustomConfig(i){
  const card=document.querySelector(`.loadout-card[data-player="${i}"]`);
  if(!card)return {...CHARACTERS.ranger,weaponKey:'ranger'};
  const val=s=>card.querySelector(`[data-slot="${s}"]`)?.value;
  const bodyKey=BODY_SOURCE[val('body')]||'ranger';
  const weaponKey=WEAPON_SOURCE[val('weapon')]||'ranger';
  const body=CHARACTERS[bodyKey],weapon=CHARACTERS[weaponKey];
  const meta=BODY_META[val('body')]||BODY_META.knight;
  const passive=val('passive')||'coolant';
  const passiveCfg=PASSIVES[passive]||PASSIVES.coolant;
  return {
    ...body,
    name:`${body.name} / ${weapon.name}`,
    hp:Math.round(body.hp*meta.hpMul),
    speed:Number((body.speed*meta.speedMul*(passive==='sprinter'?1.06:1)).toFixed(2)),
    radius:meta.radius,
    knockbackResist:meta.knockbackResist,
    recoilResist:meta.recoilResist+(passive==='stabilizer'?.35:0),
    dashMul:meta.dashMul,
    bodyWeight:meta.weight,
    bodyLabel:meta.label,
    bodyKey:val('body')||'knight',
    passive,
    passiveName:passiveCfg.name,
    passiveDesc:passiveCfg.desc,
    heatCoolMul:passive==='coolant'?1.25:1,
    damageTakenMul:passive==='armor'?.92:1,
    superGainMul:passive==='charger'?1.18:1,
    coreDuration:passive==='coreHunter'?11:8,
    fireCd:weapon.fireCd,damage:weapon.damage,pellets:weapon.pellets||1,
    bulletSpeed:weapon.bulletSpeed,spread:weapon.spread||0,recovery:weapon.recovery||0,
    weaponModel:weapon.weaponModel,weaponScale:weapon.weaponScale,
    weaponStyle:weapon.weaponStyle,bulletRadius:weapon.bulletRadius,bulletLife:weapon.bulletLife,recoil:weapon.recoil,
    defense:val('defense')||body.defense,
    super:val('super')||body.super,
    color:COLOR_VALUES[val('color')]??body.color,
    weaponKey
  };
}

function refreshLoadoutSummary(i){
  const card=document.querySelector(`.loadout-card[data-player="${i}"]`);
  if(!card)return;
  const cfg=buildCustomConfig(i);
  const cost=buildCostFromCard(card);
  const over=cost>BUILD_LIMIT;

  renderLoadoutSummary(card,cfg,cost,over);
  card.classList.toggle('over-budget',over);
  saveLoadout(i);
  updateStartAvailability();
}

function updateStartAvailability(){
  const start=document.querySelector('#start');
  if(!start)return;
  const cards=[...document.querySelectorAll('.loadout-card')];
  const invalid=cards.some(card=>buildCostFromCard(card)>BUILD_LIMIT);
  start.disabled=invalid;
  start.classList.toggle('disabled',invalid);

  let msg=document.querySelector('#build-warning');
  if(!msg){
    msg=document.createElement('div');
    msg.id='build-warning';
    msg.className='build-warning';
    start.insertAdjacentElement('afterend',msg);
  }
  msg.textContent=invalid?`BUILD LIMIT: ${BUILD_LIMIT} POINTS`:'';
  msg.hidden=!invalid;
}

let arenaSelection='square';
let players=[];
let particles=[];
let running=false, paused=false, matchTime=90, last=performance.now(), hitStop=0, suddenDeath=false, matchGeneration=0;
const cameraController=createCameraController({renderer,scene,getPlayers:()=>players});
const feedbackController=createFeedbackController({cameraShake:(strength,duration)=>cameraController.addShake(strength,duration)});
const arenaController=createArenaController({scene});
const playerController=createPlayerController({scene});
const buildArena=arenaController.build;
const canMoveTo=arenaController.canMoveTo;
const hitObstacle=arenaController.hitObstacle;
const makePlayer=playerController.makePlayer;
const flashPlayer=playerController.flashPlayer;
const defenseTrail=playerController.defenseTrail;
const playPlayerAction=playerController.playPlayerAction;
const getMuzzlePosition=playerController.getMuzzlePosition;
const audioController=createAudioController();
const {
  unlock:unlockAudio,
  tone,
  playBattleBGM,
  playMenuBGM,
  stopAllBGM,
  pauseBGM,
  resumeBGM,
  synthKO,
  playCountdownVoice
}=audioController;
playMenuBGM();

const matchScheduler=createMatchScheduler({
  getGeneration:()=>matchGeneration,
  isPaused:()=>paused
});

function particleBurst(pos,color=0xffffff,count=9,scale=.08){
  for(let i=0;i<count;i++){
    const mesh=new THREE.Mesh(
      new THREE.SphereGeometry(scale,6,6),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:1})
    );
    mesh.position.copy(pos);
    scene.add(mesh);
    const vel=new THREE.Vector3((Math.random()-.5)*4,Math.random()*2.8,(Math.random()-.5)*4);
    particles.push({mesh,vel,life:.28,max:.28});
  }
}

function matchLater(fn,ms){
  return matchScheduler.later(fn,ms);
}

function damagePop(amount){
  const el=document.createElement('div');
  el.className='damage-pop';
  el.textContent=`-${Math.round(amount)}`;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),480);
}

const fieldWeaponController=createFieldWeaponController({
  scene,
  getPlayers:()=>players,
  canMoveTo,
  showBanner,
  tone,
  particleBurst
});

const combatController=createCombatController({
  scene,
  getPlayers:()=>players,
  isRunning:()=>running&&!paused,
  canMoveTo,
  hitObstacle,
  damageArenaObstacle:arenaController.damageObstacle,
  showBanner,
  tone,
  particleBurst,
  matchLater,
  flashPlayer,
  defenseTrail,
  playPlayerAction,
  getMuzzlePosition,
  damagePop,
  addHitStop:amount=>{hitStop=Math.max(hitStop,amount)},
  cameraShake:feedbackController.shake,
  vibrate:feedbackController.vibrate,
  consumeFieldWeapon:fieldWeaponController.consume,
  onDamage:fieldWeaponController.noteDamage,
  onKO:ko
});
const shoot=combatController.shoot;
const defenseAction=combatController.defenseAction;
const activateSuper=combatController.activateSuper;

const {updateHUD,updateWorldStatus,clearWorldStatus}=createHudUI({
  getPlayers:()=>players,
  projectWorldToScreen:cameraController.projectWorldToScreen,
  defenseLabel
});

const result=$('#result');

function resetPlayer(i){
  playerController.resetPlayer(players[i],i);
}

function ko(victim,attacker){
  const player=players[victim];
  player.alive=false;
  playPlayerAction(player,'death');
  const pos=player.root.position.clone().setY(.9);
  particleBurst(pos.clone(),player.cfg.color,32,.13);
  matchLater(()=>particleBurst(pos.clone().setY(1.05),0xffffff,18,.08),55);
  matchLater(()=>{player.root.visible=false},720);
  players[attacker].score++;
  hitStop=Math.max(hitStop,.11);
  synthKO();
  showBanner(suddenDeath?'FINAL K.O!':'K.O!',suddenDeath?900:700);
  feedbackController.vibrate([55,35,90]);
  updateHUD();

  if(suddenDeath){
    matchLater(()=>finish(attacker),650);
    return;
  }

  if(players[attacker].score>=3)matchLater(()=>finish(attacker),700);
  else matchLater(()=>resetPlayer(victim),1100);
}

function finish(winner){
  matchGeneration++;
  running=false;
  paused=false;
  pauseUI.hide();
  pauseUI.setAvailable(false);
  stopAllBGM();
  fieldWeaponController.reset();
  renderMatchResult(winner,players);
  $('#winner').textContent=`P${winner+1} WIN!`;
  $('#result-score').textContent=`${players[0].score} - ${players[1].score}`;
  result.hidden=false;
}

function removePlayers(){
  playerController.removePlayers(players);
  players=[];
}

function clearProjectiles(){
  combatController.clearProjectiles();
  particles.forEach(p=>{
    scene.remove(p.mesh);
    p.mesh.geometry?.dispose?.();
    p.mesh.material?.dispose?.();
  });
  particles=[];
}

function buildShortLabel(p){
  const weapon=(p.cfg.weaponStyle||'rifle').toUpperCase();
  const defense=defenseLabel(p.cfg.defense);
  const passive=p.cfg.passiveName||'NONE';
  return `${weapon} · ${defense} · ${passive}`;
}

function showVsIntro(){
  let el=document.querySelector('#vs-intro');
  if(!el){
    el=document.createElement('div');
    el.id='vs-intro';
    el.className='vs-intro';
    document.body.appendChild(el);
  }
  el.innerHTML=`
    <div class="vs-side p1"><small>PLAYER 1</small><strong>${players[0].cfg.name}</strong><span>${buildShortLabel(players[0])}</span></div>
    <div class="vs-mark">VS</div>
    <div class="vs-side p2"><small>PLAYER 2</small><strong>${players[1].cfg.name}</strong><span>${buildShortLabel(players[1])}</span></div>`;
  el.classList.add('show');
  return new Promise(r=>setTimeout(()=>{el.classList.remove('show');r()},1050));
}

async function battleCountdown(generation){
  running=false;
  await showVsIntro();
  if(generation!==matchGeneration)return;
  for(const n of [3,2,1]){
    showBanner(String(n),700);
    playCountdownVoice('count_'+n);
    await new Promise(r=>setTimeout(r,800));
    if(generation!==matchGeneration)return;
  }
  showBanner('GO!',700);
  playCountdownVoice('go');
  await new Promise(r=>setTimeout(r,350));
  if(generation!==matchGeneration)return;
  running=true;
  pauseUI.setAvailable(true);
}

function startBattle(){
  hideMatchResult();
  matchGeneration++;
  matchScheduler.clear();
  paused=false;
  pauseUI.hide();
  pauseUI.setAvailable(false);
  input.clear();
  const generation=matchGeneration;
  suddenDeath=false;
  clearWorldStatus();
  clearPowerCore();
  powerCoreTimer=7;
  powerCoreOneSecondCue=false;
  fieldWeaponController.reset();
  removePlayers();
  clearProjectiles();
  buildArena(arenaSelection);
  players=[makePlayer(0,buildCustomConfig(0)),makePlayer(1,buildCustomConfig(1))];
  matchTime=90;
  running=false;
  result.hidden=true;
  playBattleBGM(arenaSelection==='hex'?'space':'normal');
  $('#menu').hidden=true;
  $('#hud').hidden=false;
  $('#controls').hidden=false;
  updateHUD();
  updateWorldStatus();
  battleCountdown(generation);
}

function fullReset(){
  hideMatchResult();
  matchGeneration++;
  matchScheduler.clear();
  paused=false;
  pauseUI.hide();
  input.clear();
  suddenDeath=false;
  clearPowerCore();
  powerCoreTimer=7;
  powerCoreOneSecondCue=false;
  fieldWeaponController.reset();
  clearProjectiles();
  players.forEach((p,i)=>{
    p.score=0;
    p.super=0;
    p.stats={damageDealt:0,damageTaken:0,shots:0,hits:0,supers:0,defenses:0,cores:0,parries:0};
    resetPlayer(i);
  });
  matchTime=90;
  running=true;
  pauseUI.setAvailable(true);
  result.hidden=true;
  playBattleBGM(arenaSelection==='hex'?'space':'normal');
  updateHUD();
  showBanner('FIGHT!',900);
}

$('#rematch').addEventListener('click',fullReset);
function backToMenu(){
  hideMatchResult();
  matchGeneration++;
  matchScheduler.clear();
  suddenDeath=false;
  clearPowerCore();
  powerCoreTimer=7;
  powerCoreOneSecondCue=false;
  fieldWeaponController.reset();
  running=false;
  paused=false;
  input.clear();
  pauseUI.hide();
  pauseUI.setAvailable(false);
  clearWorldStatus();
  playMenuBGM();
  result.hidden=true;
  $('#hud').hidden=true;
  $('#controls').hidden=true;
  $('#menu').hidden=false;
}

$('#back-menu').addEventListener('click',backToMenu);

restoreLoadout(0);
restoreLoadout(1);

$$('.loadout-card select').forEach(sel=>sel.addEventListener('change',()=>{
  const i=Number(sel.closest('.loadout-card').dataset.player);
  refreshLoadoutSummary(i);
}));

$$('.random-build').forEach(btn=>btn.addEventListener('click',()=>{
  randomizeLoadout(Number(btn.dataset.player));
}));

refreshLoadoutSummary(0);
refreshLoadoutSummary(1);

$('.arena-buttons').addEventListener('click',e=>{
  const button=e.target.closest('button[data-arena]');
  if(!button)return;
  arenaSelection=button.dataset.arena;
  $$('.arena-buttons button').forEach(x=>x.classList.toggle('selected',x===button));
});

$('#start').addEventListener('click',()=>{
  const cards=[...document.querySelectorAll('.loadout-card')];
  if(cards.some(card=>buildCostFromCard(card)>BUILD_LIMIT)){
    showBanner('BUILD OVER LIMIT!',500);
    tone(110,.1,'square',.03,-40);
    return;
  }
  unlockAudio();
  startBattle();
});

$$('.def-btn').forEach(button=>button.addEventListener('pointerdown',e=>{
  e.preventDefault();
  defenseAction(Number(button.dataset.player));
}));
$$('.super-btn').forEach(button=>button.addEventListener('pointerdown',e=>{
  e.preventDefault();
  activateSuper(Number(button.dataset.player));
}));

const input=createInputController({
  getPlayers:()=>players,
  screenVectorToWorld:cameraController.screenVectorToWorld,
  shoot,
  activateSuper
});

function canPauseBattle(){
  return running&&!paused&&players.length===2&&$('#menu').hidden&&result.hidden;
}

function pauseBattle(){
  if(!canPauseBattle())return false;
  paused=true;
  input.clear();
  pauseBGM();
  return true;
}

function resumeBattle(){
  if(!paused)return;
  paused=false;
  pauseUI.hide();
  pauseUI.setAvailable(running);
  resumeBGM();
  last=performance.now();
}

const pauseUI=createPauseUI({
  canPause:canPauseBattle,
  onPause:pauseBattle,
  onResume:resumeBattle,
  onRestart:fullReset,
  onBackToMenu:backToMenu
});

document.addEventListener('visibilitychange',()=>{
  if(document.hidden&&pauseBattle())pauseUI.show();
});

let powerCore=null;
let powerCoreTimer=7;
let powerCoreWarning=null;
let powerCoreOneSecondCue=false;

function clearPowerCoreWarning(){
  if(powerCoreWarning){
    scene.remove(powerCoreWarning);
    powerCoreWarning.geometry?.dispose?.();
    powerCoreWarning.material?.dispose?.();
    powerCoreWarning=null;
  }
}

function ensurePowerCoreWarning(){
  if(powerCoreWarning)return;
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(.72,1.12,48),
    new THREE.MeshBasicMaterial({
      color:0xffd75a,
      transparent:true,
      opacity:.15,
      side:THREE.DoubleSide,
      depthWrite:false
    })
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.set(0,.035,0);
  scene.add(ring);
  powerCoreWarning=ring;
}

function clearPowerCore(){
  clearPowerCoreWarning();
  if(powerCore){
    scene.remove(powerCore.mesh);
    powerCore.mesh.geometry?.dispose?.();
    powerCore.mesh.material?.dispose?.();
    powerCore=null;
  }
}

function spawnPowerCore(){
  clearPowerCoreWarning();
  clearPowerCore();
  const mesh=new THREE.Mesh(
    new THREE.OctahedronGeometry(.48,0),
    new THREE.MeshStandardMaterial({
      color:0xffdf63,
      emissive:0xff8f2f,
      emissiveIntensity:1.35,
      metalness:.18,
      roughness:.28
    })
  );
  mesh.position.set(0,.72,0);
  scene.add(mesh);
  powerCore={mesh,t:0};
  showBanner('POWER CORE!',500);
  tone(640,.12,'sine',.035,170);
}

function updatePowerCore(dt){
  powerCoreTimer-=dt;

  if(!powerCore&&powerCoreTimer>1)powerCoreOneSecondCue=false;
  if(!powerCore&&powerCoreTimer<=1&&powerCoreTimer>0&&!powerCoreOneSecondCue){
    powerCoreOneSecondCue=true;
    showBanner('CORE IN 1!',260);
    tone(520,.06,'square',.022,120);
  }

  if(!powerCore&&powerCoreTimer<=3&&powerCoreTimer>0){
    ensurePowerCoreWarning();
    const urgency=THREE.MathUtils.clamp(1-powerCoreTimer/3,0,1);
    const pulse=.5+.5*Math.sin(performance.now()*.006*(1+urgency*2.4));
    powerCoreWarning.material.opacity=.12+.5*urgency+.18*pulse;
    const scale=.95+urgency*.16+.035*pulse;
    powerCoreWarning.scale.setScalar(scale);
    if(powerCoreTimer<=1)powerCoreWarning.material.color.setHex(0xff8a3d);
    else powerCoreWarning.material.color.setHex(0xffd75a);
  }else if(powerCoreWarning){
    clearPowerCoreWarning();
  }

  if(!powerCore&&powerCoreTimer<=0)spawnPowerCore();
  if(!powerCore)return;

  powerCore.t+=dt;
  powerCore.mesh.rotation.y+=dt*2.8;
  powerCore.mesh.rotation.x+=dt*1.15;
  powerCore.mesh.position.y=.72+Math.sin(powerCore.t*4)*.08;

  for(const p of players){
    if(!p.alive)continue;
    const dx=p.root.position.x-powerCore.mesh.position.x;
    const dz=p.root.position.z-powerCore.mesh.position.z;
    if(dx*dx+dz*dz<1.05*1.05){
      p.powerBuff=p.cfg.coreDuration||8;
      p.stats.cores++;
      p.super=Math.min(100,p.super+25);
      const corePos=powerCore.mesh.position.clone();
      particleBurst(corePos.clone(),0xffd75a,30,.11);
      matchLater(()=>particleBurst(corePos.clone().setY(.9),0xffffff,18,.08),55);
      tone(780,.13,'sine',.045,250);
      matchLater(()=>tone(1040,.08,'square',.028,-120),55);
      showBanner(`P${p.i+1} POWER UP!`,620);
      hitStop=Math.max(hitStop,.06);
      feedbackController.vibrate([18,20,35,18,20]);
      clearPowerCore();
      powerCoreTimer=12;
      break;
    }
  }
}

function update(dt){
  if(!running||paused)return;
  matchScheduler.update(dt);
  input.update();
  updatePowerCore(dt);
  matchTime=Math.max(0,matchTime-dt);
  if(matchTime<=0){
    const a=players[0].score,b=players[1].score;
    if(!suddenDeath){
      if(a!==b){
        finish(a>b?0:1);
      }else{
        suddenDeath=true;
        matchTime=30;
        playBattleBGM('sudden');
        showBanner('SUDDEN DEATH! NEXT K.O WINS',1200);
        tone(210,.12,'square',.035,260);
      }
    }else{
      matchTime=30;
      showBanner('KEEP FIGHTING!',500);
    }
  }

  players.forEach(p=>{
    p.fireCd=Math.max(0,p.fireCd-dt);
    p.recovery=Math.max(0,(p.recovery||0)-dt);
    p.invuln=Math.max(0,p.invuln-dt);
    p.powerBuff=Math.max(0,(p.powerBuff||0)-dt);
    p.defenseCd=Math.max(0,(p.defenseCd||0)-dt);
    p.parryActive=Math.max(0,(p.parryActive||0)-dt);
    if(p.cfg.defense==='guard'&&!p.guarding)p.guard=Math.min(100,p.guard+18*dt);
    p.heat=Math.max(0,(p.heat||0)-24*(p.cfg.heatCoolMul||1)*dt);
    if(p.overheated&&p.heat<=35){
      p.overheated=false;
      showBanner(`P${p.i+1} READY`,260);
      tone(520,.06,'sine',.02,120);
    }
    const inBush=p.alive&&arenaController.isInBush(p.root.position);
    playerController.updatePlayerVisuals(p,dt,inBush);
    if(!p.alive)return;
    if(p.fireHeld&&p.aim.lengthSq()>.12)shoot(p.i);

    const move=p.move.clone();
    if(move.lengthSq()>1)move.normalize();
    const recoveryMoveMul=p.recovery>0?.58:1;
    const guardMoveMul=p.guarding?.42:1;
    const next=p.root.position.clone();
    next.x+=move.x*p.cfg.speed*recoveryMoveMul*guardMoveMul*dt;
    next.z+=move.y*p.cfg.speed*recoveryMoveMul*guardMoveMul*dt;
    if(canMoveTo(next,p.radius)){
      p.root.position.copy(next);
    }else{
      const nextX=p.root.position.clone();
      nextX.x=next.x;
      if(canMoveTo(nextX,p.radius))p.root.position.x=nextX.x;
      const nextZ=p.root.position.clone();
      nextZ.z=next.z;
      if(canMoveTo(nextZ,p.radius))p.root.position.z=nextZ.z;
    }
    if(p.aim.lengthSq()>.12)p.root.rotation.y=Math.atan2(p.aim.x,p.aim.y)+Math.PI;
  });

  if(players.length===2&&players[0].alive&&players[1].alive){
    const a=players[0],b=players[1];
    const dx=b.root.position.x-a.root.position.x;
    const dz=b.root.position.z-a.root.position.z;
    const minDist=a.radius+b.radius;
    const d2=dx*dx+dz*dz;
    if(d2>0.0001&&d2<minDist*minDist){
      const d=Math.sqrt(d2);
      const push=(minDist-d)*.5;
      const nx=dx/d,nz=dz/d;
      const pa=a.root.position.clone();
      pa.x-=nx*push;
      pa.z-=nz*push;
      const pb=b.root.position.clone();
      pb.x+=nx*push;
      pb.z+=nz*push;
      if(canMoveTo(pa,a.radius))a.root.position.copy(pa);
      if(canMoveTo(pb,b.radius))b.root.position.copy(pb);
    }
  }

  fieldWeaponController.update(dt);
  combatController.updateProjectiles(dt);

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.life-=dt;
    p.mesh.position.addScaledVector(p.vel,dt);
    p.vel.y-=6*dt;
    if(p.mesh.material?.opacity!==undefined)p.mesh.material.opacity=Math.max(0,p.life/p.max);
    if(p.life<=0){
      scene.remove(p.mesh);
      p.mesh.geometry?.dispose?.();
      p.mesh.material?.dispose?.();
      particles.splice(i,1);
    }
  }

  updateHUD();
  updateWorldStatus();
  $('#timer').textContent=Math.ceil(matchTime);
}

function loop(now){
  const dt=Math.min(.033,(now-last)/1000);
  last=now;
  if(!paused){
    if(hitStop>0)hitStop=Math.max(0,hitStop-dt);
    else update(dt);
  }
  cameraController.render();
  requestAnimationFrame(loop);
}

cameraController.init();
buildArena('square');
requestAnimationFrame(loop);
if('serviceWorker' in navigator){
  addEventListener('load',()=>navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{}));
}
