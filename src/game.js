import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { ARENA, SPAWN_X } from './arena-config.js?v=695';
import { showBanner, renderMatchResult, hideMatchResult } from './ui.js?v=695';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const canvas = $('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1118);
scene.fog = new THREE.Fog(0x0d1118, 36, 62);

const topCamera=new THREE.OrthographicCamera(-12,12,18,-18,.1,100);
topCamera.position.set(0,38,.01);topCamera.up.set(1,0,0);topCamera.lookAt(0,0,0);
const chaseCameras=[new THREE.PerspectiveCamera(58,1,.1,120),new THREE.PerspectiveCamera(58,1,.1,120)];
let camera=topCamera;
let cameraMode='top';
const _baseRender=renderer.render.bind(renderer);

scene.add(new THREE.HemisphereLight(0xeaf2ff,0x202534,2.1));
const sun = new THREE.DirectionalLight(0xffffff,2.2);
sun.position.set(7,14,8);
scene.add(sun);

let arenaRoot = new THREE.Group();
scene.add(arenaRoot);
let obstacles=[];
let bushes=[];

const GLB_BASE_ADV = './assets/models/characters/';

const WEAPON_BASE = './assets/models/weapons/';

const PROP_BASE = './assets/models/stage/';
const PROPS={
  wall:PROP_BASE+'Wall.gltf', wallDecorated:PROP_BASE+'Wall_Decorated.gltf',
  pillarA:PROP_BASE+'Pillar_A.gltf', pillarB:PROP_BASE+'Pillar_B.gltf',
  ammo:PROP_BASE+'Ammo_Box.gltf', boxA:PROP_BASE+'Box_A.gltf', boxB:PROP_BASE+'Box_B.gltf', boxC:PROP_BASE+'Box_C.gltf',
  barrelA:PROP_BASE+'Barrel_A.gltf', barrelB:PROP_BASE+'Barrel_B.gltf', barrelC:PROP_BASE+'Barrel_C.gltf',
  floor:PROP_BASE+'Floor.gltf', floorDirt:PROP_BASE+'Floor_Dirt.gltf',
  locker:PROP_BASE+'Locker.gltf', workbench:PROP_BASE+'Workbench.gltf', pallet:PROP_BASE+'Pallet_Large.gltf'
};

const STAGE_THEMES={
  square:{bg:0x0d1520,fog:0x0d1520,floor:0x34445b,edge:0x1a2535,accent:0x59b8ff,accentSoft:0xa7dcff,rim:0x55708d,glow:0x7fd7ff,floorProp:PROPS.floor},
  pillars:{bg:0x15161f,fog:0x15161f,floor:0x4a4549,edge:0x2a262b,accent:0xe5ba68,accentSoft:0xf8deb2,rim:0x75685f,glow:0xffd27a,floorProp:PROPS.floor},
  ring:{bg:0x191117,fog:0x191117,floor:0x433542,edge:0x251a25,accent:0xff6f96,accentSoft:0xffc1d5,rim:0x7d5067,glow:0xff97b6,floorProp:PROPS.floor},
  cross:{bg:0x101922,fog:0x101922,floor:0x31404d,edge:0x18222b,accent:0x4fd6d6,accentSoft:0xc6ffff,rim:0x608e95,glow:0x8affff,floorProp:PROPS.floor},
  hex:{bg:0x120f1f,fog:0x120f1f,floor:0x2f2948,edge:0x1b1630,accent:0x9f74ff,accentSoft:0xd8c3ff,rim:0x6f62ad,glow:0xbc97ff,floorProp:PROPS.floor},
  fort:{bg:0x181613,fog:0x181613,floor:0x5a4e44,edge:0x312820,accent:0xd6b789,accentSoft:0xf4e1c3,rim:0x8b7152,glow:0xffd9a0,floorProp:PROPS.floorDirt},
  bush:{bg:0x0e1812,fog:0x0e1812,floor:0x39523d,edge:0x223126,accent:0x72d98c,accentSoft:0xd6ffe1,rim:0x568061,glow:0x9effb0,floorProp:PROPS.floorDirt},
  crates:{bg:0x171412,fog:0x171412,floor:0x4d443d,edge:0x28231f,accent:0xffa85e,accentSoft:0xffddbc,rim:0x866c55,glow:0xffc178,floorProp:PROPS.floor}
};

function getArenaTheme(type){
  return STAGE_THEMES[type]||STAGE_THEMES.square;
}



const CHARACTERS = {
  ranger:{recovery:.08,defense:'roll',weaponStyle:'rifle',bulletRadius:.14,bulletLife:1.75,recoil:.10,name:'RANGER', hp:100, speed:4.8, fireCd:.22, damage:20, bulletSpeed:13, spread:0, color:0x35a7ff, super:'rapid', model:GLB_BASE_ADV+'Knight.glb', weaponModel:WEAPON_BASE+'sword_A.gltf', weaponScale:.85},
  crusher:{recovery:.34,defense:'guard',weaponStyle:'scatter',bulletRadius:.12,bulletLife:1.15,recoil:.22,name:'CRUSHER', hp:135, speed:4.0, fireCd:.62, damage:13, pellets:5, bulletSpeed:11.5, spread:.26, color:0xff8a3d, super:'blast', model:GLB_BASE_ADV+'Barbarian.glb', weaponModel:WEAPON_BASE+'axe_A.gltf', weaponScale:.9},
  dash:{recovery:.035,defense:'step',weaponStyle:'rapid',bulletRadius:.10,bulletLife:1.45,recoil:.06,name:'DASH', hp:82, speed:6.2, fireCd:.17, damage:13, bulletSpeed:14.5, spread:.03, color:0x9c6cff, super:'dash', model:GLB_BASE_ADV+'Rogue_Hooded.glb', weaponModel:WEAPON_BASE+'dagger_A.gltf', weaponScale:.9},
  mage:{recovery:.18,defense:'barrier',weaponStyle:'arcane',bulletRadius:.20,bulletLife:2.0,recoil:.08,name:'MAGE', hp:88, speed:4.6, fireCd:.34, damage:24, bulletSpeed:10.5, spread:.02, color:0x5be0d0, super:'nova', model:GLB_BASE_ADV+'Mage.glb', weaponModel:WEAPON_BASE+'staff_A.gltf', weaponScale:.78},
  rogue:{recovery:.07,defense:'evade',weaponStyle:'bladegun',bulletRadius:.13,bulletLife:1.55,recoil:.09,name:'ROGUE', hp:92, speed:5.7, fireCd:.19, damage:15, bulletSpeed:14, spread:.06, color:0xffd45a, super:'fan', model:GLB_BASE_ADV+'Rogue.glb', weaponModel:WEAPON_BASE+'sword_B.gltf', weaponScale:.8},
  skeleton:{recovery:.42,defense:'parry',weaponStyle:'cannon',bulletRadius:.24,bulletLife:1.70,recoil:.28,name:'BONES', hp:112, speed:4.35, fireCd:.42, damage:28, bulletSpeed:11.8, spread:.01, color:0xded6c1, super:'boneStorm', model:GLB_BASE_ADV+'Skeleton_Warrior.glb', weaponModel:WEAPON_BASE+'axe_B.gltf', weaponScale:.9}
};
const BODY_SOURCE={knight:'ranger',barbarian:'crusher',rogueHood:'dash',mage:'mage',rogue:'rogue',skeleton:'skeleton'};
const BODY_META={
  knight:{label:'BALANCED',weight:'medium',hpMul:1.00,speedMul:1.00,radius:.58,knockbackResist:.12,recoilResist:.10,dashMul:1.00},
  barbarian:{label:'HEAVY',weight:'heavy',hpMul:1.16,speedMul:.88,radius:.66,knockbackResist:.34,recoilResist:.28,dashMul:.84},
  rogueHood:{label:'LIGHT',weight:'light',hpMul:.88,speedMul:1.16,radius:.52,knockbackResist:-.10,recoilResist:-.06,dashMul:1.16},
  mage:{label:'TECH',weight:'medium',hpMul:.94,speedMul:.98,radius:.56,knockbackResist:.04,recoilResist:.06,dashMul:1.00},
  rogue:{label:'AGILE',weight:'light',hpMul:.92,speedMul:1.10,radius:.53,knockbackResist:-.06,recoilResist:-.02,dashMul:1.10},
  skeleton:{label:'ARMORED',weight:'heavy',hpMul:1.10,speedMul:.92,radius:.62,knockbackResist:.24,recoilResist:.18,dashMul:.90}
};

const WEAPON_SOURCE={rifle:'ranger',scatter:'crusher',rapid:'dash',arcane:'mage',bladegun:'rogue',cannon:'skeleton'};
const COLOR_VALUES={cyan:0x35a7ff,orange:0xff8a3d,violet:0x9c6cff,mint:0x5be0d0,gold:0xffd45a,bone:0xded6c1,pink:0xff6fae,lime:0xa7ef62};
const BUILD_LIMIT=10;

const PASSIVES={
  coolant:{
    name:'COOLANT',
    cost:1,
    desc:'HEAT cooling +25%'
  },
  stabilizer:{
    name:'STABILIZER',
    cost:1,
    desc:'Weapon recoil -35%'
  },
  sprinter:{
    name:'SPRINTER',
    cost:1,
    desc:'Move speed +6%'
  },
  armor:{
    name:'ARMOR PLATE',
    cost:2,
    desc:'Damage taken -8%'
  },
  charger:{
    name:'CHARGER',
    cost:2,
    desc:'SUPER gain +18%'
  },
  coreHunter:{
    name:'CORE HUNTER',
    cost:1,
    desc:'POWER duration +3s'
  }
};


const BUILD_COSTS={
  body:{knight:2,barbarian:3,rogueHood:2,mage:2,rogue:2,skeleton:3},
  weapon:{rifle:2,scatter:3,rapid:3,arcane:3,bladegun:2,cannon:4},
  defense:{roll:2,guard:3,step:2,barrier:3,evade:3,parry:4},
  super:{rapid:2,blast:2,dash:2,nova:3,fan:2,boneStorm:3},
  passive:{coolant:1,stabilizer:1,sprinter:1,armor:2,charger:2,coreHunter:1}
};

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
  const summary=card.querySelector('.loadout-summary');
  const cost=buildCostFromCard(card);
  const over=cost>BUILD_LIMIT;

  if(summary)summary.innerHTML=`
    <strong>${cfg.name}</strong><br>
    <span>${defenseLabel(cfg.defense)} / ${cfg.super.toUpperCase()}</span><br>
    <small>HP ${cfg.hp} · SPD ${cfg.speed} · DMG ${cfg.damage}</small><br>
    <small class="body-meta">${cfg.bodyLabel} · HIT ${cfg.radius.toFixed(2)} · KB RES ${Math.round((cfg.knockbackResist||0)*100)}%</small><br>
    <small class="passive-meta">PASSIVE: <b>${cfg.passiveName}</b> · ${cfg.passiveDesc}</small>
    <div class="build-cost ${over?'over':''}">COST <b>${cost}</b> / ${BUILD_LIMIT}</div>
  `;

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


const gltfLoader = new GLTFLoader();
const assetCache = new Map();
const propCache = new Map();
let arenaBuildId=0;

async function loadCharacterAsset(url){
  if(assetCache.has(url)) return assetCache.get(url);
  const promise = new Promise((resolve,reject)=>{
    gltfLoader.load(url, resolve, undefined, reject);
  });
  assetCache.set(url,promise);
  return promise;
}


async function loadProp(url){
  if(propCache.has(url)) return propCache.get(url);
  const promise=new Promise((resolve,reject)=>gltfLoader.load(url,resolve,undefined,reject));
  propCache.set(url,promise);return promise;
}
async function attachPropVisual(url, holder, opts={}, buildId=arenaBuildId){
  try{
    const gltf=await loadProp(url);
    if(buildId!==arenaBuildId || !holder.parent)return;
    const model=gltf.scene.clone(true);
    const s=opts.scale??1;
    if(Array.isArray(s)) model.scale.set(s[0],s[1],s[2]); else model.scale.setScalar(s);
    model.rotation.y=opts.rotY||0;
    model.position.set(opts.ox||0,opts.oy||0,opts.oz||0);
    model.traverse(n=>{if(n.isMesh){n.castShadow=false;n.receiveShadow=false}});
    holder.add(model);
    if(opts.fallback)opts.fallback.visible=false;
  }catch(err){console.warn('Stage prop fallback:',url,err)}
}

function findClip(clips, patterns){
  return clips.find(c=>patterns.some(p=>c.name.toLowerCase().includes(p))) || clips[0] || null;
}

async function attachWeaponModel(player){
  const url=player.cfg.weaponModel;
  if(!url)return;
  try{
    const gltf=await loadCharacterAsset(url);
    if(!player.root.parent)return;
    const model=gltf.scene.clone(true);
    model.scale.setScalar(player.cfg.weaponScale||.8);
    model.rotation.set(Math.PI/2,0,Math.PI);
    model.position.set(0,0,-.48);
    model.traverse(n=>{
      if(n.isMesh){n.castShadow=false;n.receiveShadow=false}
    });
    player.weaponPrimitive.visible=false;
    player.weaponPivot.add(model);
    player.weaponReal=model;
  }catch(err){
    console.warn('Weapon fallback:',url,err);
  }
}

async function attachRealModel(player){
  const cfg=player.cfg;
  try{
    const assetStatus=$('#asset-status');if(assetStatus)assetStatus.textContent='Loading CC0 character models…';
    const gltf=await loadCharacterAsset(cfg.model);
    if(!player.root.parent) return;
    const model=cloneSkeleton(gltf.scene);
    model.scale.setScalar(.72);
    model.rotation.y=Math.PI;
    model.position.y=.03;
    model.traverse(n=>{
      if(n.isMesh){
        n.castShadow=false;
        n.receiveShadow=false;
      }
    });
    player.primitive.visible=false;
    player.modelHost.add(model);
    const mixer=new THREE.AnimationMixer(model);
    const idle=findClip(gltf.animations,['idle']);
    const walk=findClip(gltf.animations,['walk','run']);
    if(idle){const a=mixer.clipAction(idle);a.play();player.idleAction=a}
    if(walk){const a=mixer.clipAction(walk);a.play();a.enabled=false;player.walkAction=a}
    player.mixer=mixer;
    player.realModel=true;
    if(assetStatus)assetStatus.textContent='KayKit CC0 characters enabled · weapons load independently';
  }catch(err){
    console.warn('GLB fallback:',cfg.model,err);
    const assetStatus=$('#asset-status');if(assetStatus)assetStatus.textContent='Some models could not load — fallback models are active.';
  }
}


let arenaSelection='square';
let players=[];
let bullets=[];
let particles=[];
let running=false, matchTime=90, last=performance.now(), hitStop=0, suddenDeath=false, matchGeneration=0;

function clearGroup(g){
  // Cached GLTF clones share geometry/material resources. Removing a stage must
  // not dispose those shared resources or later stage/model loads can render broken.
  while(g.children.length)g.remove(g.children[g.children.length-1]);
}

function makeFallbackBox(w,h,d,color=0x65748c){
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.78}));
}
function addRealBox(x,z,w,d,h=1.35,opts={}){
  const holder=new THREE.Group();holder.position.set(x,0,z);arenaRoot.add(holder);
  const fallback=makeFallbackBox(w,h,d,opts.color||0x66758e);fallback.position.y=h/2;holder.add(fallback);
  const collider={x,z,hw:w/2,hd:d/2,mesh:holder,destructible:!!opts.destructible,hp:opts.hp??0};
  obstacles.push(collider);
  const url=opts.url||PROPS.wall;
  // KayKit assets are modular: scale visible mesh toward collider size while collision remains simple/fast.
  attachPropVisual(url,holder,{scale:opts.scale||[Math.max(.55,w/2),Math.max(.55,h/1.4),Math.max(.55,d/2)],rotY:opts.rotY||0,oy:opts.oy||0,fallback},arenaBuildId);
  return collider;
}
function addRealPillar(x,z,r=.8,h=1.8,variant='A'){
  const holder=new THREE.Group();holder.position.set(x,0,z);arenaRoot.add(holder);
  const fallback=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),new THREE.MeshStandardMaterial({color:0x71819a,roughness:.75}));
  fallback.position.y=h/2;holder.add(fallback);
  obstacles.push({x,z,hw:r,hd:r,circle:true,r,mesh:holder});
  attachPropVisual(variant==='B'?PROPS.pillarB:PROPS.pillarA,holder,{scale:Math.max(.7,r*1.35),fallback},arenaBuildId);
}
function addBush(x,z,r=1.25){
  const group=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:0x3f8c56,roughness:1,transparent:true,opacity:.76,depthWrite:false});
  for(let i=0;i<9;i++){
    const m=new THREE.Mesh(new THREE.ConeGeometry(.46,1.05,7),mat.clone());const a=i/9*Math.PI*2;
    m.position.set(Math.cos(a)*r*.45,.52,Math.sin(a)*r*.45);m.rotation.y=a;group.add(m);
  }
  group.position.set(x,0,z);arenaRoot.add(group);bushes.push({x,z,r,group});
  // Add real props to give the bush cluster physical visual richness without making it solid.
  const deco=new THREE.Group();deco.position.set(x,0,z);arenaRoot.add(deco);
  attachPropVisual(PROPS.pallet,deco,{scale:.42,rotY:Math.PI/2},arenaBuildId);
}
function addWallRun(x,z,length,vertical=false,decorated=false){
  const seg=2.2,count=Math.max(1,Math.round(length/seg));
  for(let i=0;i<count;i++){
    const offset=(i-(count-1)/2)*seg;
    addRealBox(x+(vertical?0:offset),z+(vertical?offset:0),vertical?.72:2.0,vertical?2.0:.72,1.25,{url:decorated?PROPS.wallDecorated:PROPS.wall,scale:1,rotY:vertical?Math.PI/2:0});
  }
}
function addCrate(x,z,hp=48,variant=0){
  const urls=[PROPS.ammo,PROPS.boxA,PROPS.boxB,PROPS.boxC];
  return addRealBox(x,z,1.35,1.35,1.05,{destructible:true,hp,url:urls[variant%urls.length],scale:.88,color:0xb17b45});
}
function addBarrel(x,z,variant=0){
  const holder=new THREE.Group();holder.position.set(x,0,z);arenaRoot.add(holder);
  const fallback=new THREE.Mesh(new THREE.CylinderGeometry(.62,.62,1.15,16),new THREE.MeshStandardMaterial({color:0x6f7e98,roughness:.75}));fallback.position.y=.58;holder.add(fallback);
  obstacles.push({x,z,hw:.62,hd:.62,circle:true,r:.62,mesh:holder});
  const urls=[PROPS.barrelA,PROPS.barrelB,PROPS.barrelC];attachPropVisual(urls[variant%3],holder,{scale:.9,fallback},arenaBuildId);
}

function applyArenaTheme(theme){
  scene.background.setHex(theme.bg);
  scene.fog.color.setHex(theme.fog);
  scene.fog.near=34;
  scene.fog.far=66;
}

function addPaintStripe(parent,x,z,w,h,color,rot=0,y=.015,opacity=.92){
  const m=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false})
  );
  m.rotation.x=-Math.PI/2;
  m.rotation.z=rot;
  m.position.set(x,y,z);
  parent.add(m);
  return m;
}

function addStageGlow(parent,x,z,r,color,height=.02,opacity=.48){
  const ring=new THREE.Mesh(
    new THREE.CircleGeometry(r,28),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false})
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.set(x,height,z);
  parent.add(ring);
  return ring;
}

function addArenaPerimeter(theme){
  const group=new THREE.Group();arenaRoot.add(group);
  const wallMat=new THREE.MeshStandardMaterial({color:theme.edge,roughness:.9,metalness:.08});
  const beamMat=new THREE.MeshStandardMaterial({color:theme.rim,roughness:.45,metalness:.35,emissive:theme.accent,emissiveIntensity:.18});
  const sideX=ARENA.halfW+.7, sideZ=ARENA.halfH+.7;

  const north=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2+1.6,.8,1.15),wallMat);north.position.set(0,.34,-sideZ);group.add(north);
  const south=north.clone();south.position.set(0,.34,sideZ);group.add(south);
  const west=new THREE.Mesh(new THREE.BoxGeometry(1.15,.8,ARENA.halfH*2+1.6),wallMat);west.position.set(-sideX,.34,0);group.add(west);
  const east=west.clone();east.position.set(sideX,.34,0);group.add(east);

  const innerLine=new THREE.MeshStandardMaterial({color:theme.accentSoft,roughness:.2,metalness:.0,emissive:theme.accent,emissiveIntensity:.4});
  const stripN=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2,.12,.12),innerLine);stripN.position.set(0,.77,-ARENA.halfH-.1);group.add(stripN);
  const stripS=stripN.clone();stripS.position.set(0,.77,ARENA.halfH+.1);group.add(stripS);
  const stripW=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,ARENA.halfH*2),innerLine);stripW.position.set(-ARENA.halfW-.1,.77,0);group.add(stripW);
  const stripE=stripW.clone();stripE.position.set(ARENA.halfW+.1,.77,0);group.add(stripE);

  [[-sideX,-sideZ],[-sideX,sideZ],[sideX,-sideZ],[sideX,sideZ]].forEach(([x,z],i)=>{
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.42,.52,2.2,10),beamMat);
    col.position.set(x,1.1,z);group.add(col);
    const orb=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),new THREE.MeshStandardMaterial({color:theme.accentSoft,emissive:theme.glow,emissiveIntensity:.8,roughness:.15}));
    orb.position.set(x,2.35,z);group.add(orb);
    const glow=new THREE.PointLight(theme.glow,.55,8,2);
    glow.position.set(x,2.5,z);group.add(glow);
  });
}

function addArenaAccentLights(theme,type){
  const group=new THREE.Group();arenaRoot.add(group);
  const xs=[-9.5,9.5], zs=[-5.5,5.5];
  xs.forEach(x=>zs.forEach(z=>{
    const p=new THREE.PointLight(theme.glow,type==='hex'?0.85:0.55,10,2);
    p.position.set(x,3.8,z);group.add(p);
  }));
  const down=new THREE.SpotLight(theme.accentSoft,.4,50,Math.PI/4,.5,2);
  down.position.set(0,17,0);down.target.position.set(0,0,0);group.add(down);group.add(down.target);
}

function addArenaScenery(type,theme){
  if(type==='square' || type==='cross' || type==='crates' || type==='fort'){
    [[-13.2,-7.5,PROPS.locker,Math.PI/2,.55], [13.2,7.5,PROPS.workbench,-Math.PI/2,.55], [-12.8,7.4,PROPS.pallet,0,.45], [12.8,-7.4,PROPS.pallet,Math.PI,.45]].forEach(([x,z,url,rot,scale])=>{
      const holder=new THREE.Group();holder.position.set(x,0,z);arenaRoot.add(holder);
      attachPropVisual(url,holder,{scale,rotY:rot},arenaBuildId);
    });
  }
  if(type==='hex'){
    for(let i=0;i<6;i++){
      const a=Math.PI*2*i/6 + Math.PI/6;
      const x=Math.sin(a)*11.2,z=Math.cos(a)*6.9;
      const pole=new THREE.Mesh(
        new THREE.CylinderGeometry(.18,.22,2.8,8),
        new THREE.MeshStandardMaterial({color:0x5b4d89,roughness:.35,metalness:.5,emissive:theme.accent,emissiveIntensity:.25})
      );
      pole.position.set(x,1.3,z);arenaRoot.add(pole);
      const cap=new THREE.Mesh(
        new THREE.IcosahedronGeometry(.38,0),
        new THREE.MeshStandardMaterial({color:0xe9deff,emissive:theme.glow,emissiveIntensity:.75,roughness:.18})
      );
      cap.position.set(x,2.95,z);arenaRoot.add(cap);
    }
  }
  if(type==='bush'){
    [[-11,-6.3],[11,6.3],[-11,6.3],[11,-6.3],[0,-7.1],[0,7.1]].forEach(([x,z],i)=>addBush(x,z,i<4?1.1:1.4));
  }
  if(type==='pillars' || type==='ring'){
    [[-12,0],[12,0],[0,-7.2],[0,7.2]].forEach(([x,z],i)=>{
      const pad=new THREE.Mesh(
        new THREE.CylinderGeometry(.85,.95,.24,18),
        new THREE.MeshStandardMaterial({color:0x5b5158,roughness:.9,emissive:theme.accent,emissiveIntensity:.08})
      );
      pad.position.set(x,.12,z);arenaRoot.add(pad);
      addStageGlow(arenaRoot,x,z,1.08,theme.accent,.02,.26);
    });
  }
}

function addCenterPattern(type,holder,theme){
  if(type==='ring'){
    const r1=new THREE.Mesh(new THREE.RingGeometry(2.8,3.4,48),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
    r1.rotation.x=-Math.PI/2;r1.position.y=.02;holder.add(r1);
    const r2=new THREE.Mesh(new THREE.RingGeometry(5.0,5.35,56),new THREE.MeshBasicMaterial({color:theme.accentSoft,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}));
    r2.rotation.x=-Math.PI/2;r2.position.y=.021;holder.add(r2);
  }else if(type==='cross'){
    addPaintStripe(holder,0,0,1.0,10.6,theme.accent,0,.02,.9);
    addPaintStripe(holder,0,0,18.2,1.0,theme.accent,0,.02,.9);
  }else if(type==='hex'){
    const hex=new THREE.Mesh(new THREE.CircleGeometry(3.1,6),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));
    hex.rotation.x=-Math.PI/2;hex.rotation.z=Math.PI/6;hex.position.y=.02;holder.add(hex);
    const hex2=new THREE.Mesh(new THREE.RingGeometry(4.1,4.45,6),new THREE.MeshBasicMaterial({color:theme.accentSoft,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));
    hex2.rotation.x=-Math.PI/2;hex2.rotation.z=Math.PI/6;hex2.position.y=.021;holder.add(hex2);
  }else if(type==='fort'){
    addPaintStripe(holder,0,0,8.6,.95,theme.accent,0,.02,.82);
    addPaintStripe(holder,-5.6,-3.75,2.8,.72,theme.accentSoft,0,.02,.58);
    addPaintStripe(holder,5.6,3.75,2.8,.72,theme.accentSoft,0,.02,.58);
  }else if(type==='bush'){
    addStageGlow(holder,0,0,3.2,theme.accent,.02,.18);
    addStageGlow(holder,-5.4,0,1.3,theme.accentSoft,.021,.15);
    addStageGlow(holder,5.4,0,1.3,theme.accentSoft,.021,.15);
  }else if(type==='pillars'){
    addPaintStripe(holder,0,-3.2,14.4,.74,theme.accent,0,.02,.72);
    addPaintStripe(holder,0,3.2,14.4,.74,theme.accent,0,.02,.72);
  }else if(type==='crates'){
    addPaintStripe(holder,0,0,8.0,.92,theme.accent,Math.PI/4,.02,.75);
    addPaintStripe(holder,0,0,8.0,.92,theme.accent,-Math.PI/4,.02,.75);
  }else{
    addPaintStripe(holder,0,0,9.0,.9,theme.accent,0,.02,.84);
    addPaintStripe(holder,0,0,.9,6.6,theme.accent,0,.02,.84);
  }
}

function addFloorVisual(type){
  const theme=getArenaTheme(type);
  applyArenaTheme(theme);
  const holder=new THREE.Group();holder.position.y=-.28;arenaRoot.add(holder);

  const base=new THREE.Mesh(
    new THREE.BoxGeometry(ARENA.halfW*2+3.8,.9,ARENA.halfH*2+3.8),
    new THREE.MeshStandardMaterial({color:theme.edge,roughness:.96})
  );
  base.position.y=-.45;holder.add(base);

  const fallback=new THREE.Mesh(
    new THREE.BoxGeometry(ARENA.halfW*2,.45,ARENA.halfH*2),
    new THREE.MeshStandardMaterial({color:theme.floor,roughness:.88,metalness:.08})
  );
  fallback.position.y=-.05;holder.add(fallback);

  const rim=new THREE.Mesh(
    new THREE.BoxGeometry(ARENA.halfW*2+.35,.12,ARENA.halfH*2+.35),
    new THREE.MeshStandardMaterial({color:theme.rim,roughness:.45,metalness:.22,emissive:theme.accent,emissiveIntensity:.1})
  );
  rim.position.y=.18;holder.add(rim);

  attachPropVisual(theme.floorProp||PROPS.floor,holder,{scale:[ARENA.halfW,1,ARENA.halfH],fallback},arenaBuildId);

  const gridGroup=new THREE.Group();holder.add(gridGroup);
  for(let x=-12;x<=12;x+=4){
    if(x===0) continue;
    addPaintStripe(gridGroup,x,0,.18,ARENA.halfH*2-1.2,theme.accentSoft,0,.015,.18);
  }
  for(let z=-8;z<=8;z+=4){
    if(z===0) continue;
    addPaintStripe(gridGroup,0,z,ARENA.halfW*2-1.2,.18,theme.accentSoft,0,.015,.18);
  }

  addPaintStripe(holder,0,-ARENA.halfH+.95,ARENA.halfW*2-2.2,.22,theme.accent,0,.02,.4);
  addPaintStripe(holder,0,ARENA.halfH-.95,ARENA.halfW*2-2.2,.22,theme.accent,0,.02,.4);
  addPaintStripe(holder,-ARENA.halfW+.95,0,.22,ARENA.halfH*2-2.2,theme.accent,0,.02,.4);
  addPaintStripe(holder,ARENA.halfW-.95,0,.22,ARENA.halfH*2-2.2,theme.accent,0,.02,.4);

  addCenterPattern(type,holder,theme);

  if(type==='bush' || type==='fort'){
    [[-6.5,-2.4,2.2],[6.2,2.6,1.8],[-8.4,4.5,1.4],[8.2,-4.7,1.6]].forEach(([x,z,r])=>{
      addStageGlow(holder,x,z,r,theme.accentSoft,.018,.08);
    });
  }
}

function buildArena(type){
  arenaBuildId++;clearGroup(arenaRoot);obstacles=[];bushes=[];
  const theme=getArenaTheme(type);
  addFloorVisual(type);
  addArenaPerimeter(theme);
  addArenaAccentLights(theme,type);
  addArenaScenery(type,theme);

  if(type==='square'){
    [[-5,-3],[5,3],[5,-3],[-5,3]].forEach(([x,z],i)=>addCrate(x,z,60,i));
    addWallRun(-9,0,4.5,true);addWallRun(9,0,4.5,true);
  }else if(type==='pillars'){
    [[-5,-3],[5,-3],[-5,3],[5,3]].forEach(([x,z],i)=>addRealPillar(x,z,.9,2.0,i%2?'B':'A'));
    addBarrel(0,-3.2,0);addBarrel(0,3.2,1);
  }else if(type==='ring'){
    const rr=4.2;for(let i=0;i<8;i++){const a=i*Math.PI/4;addBarrel(Math.sin(a)*rr,Math.cos(a)*rr,i)}
    addWallRun(-10,0,4.5,true,true);addWallRun(10,0,4.5,true,true);
  }else if(type==='cross'){
    addWallRun(0,0,7.0,true);addWallRun(0,0,7.0,false);
    addCrate(-7,-4,48,1);addCrate(7,4,48,2);addCrate(7,-4,48,3);addCrate(-7,4,48,0);
  }else if(type==='hex'){
    const rr=5.4;for(let i=0;i<6;i++){const a=Math.PI*2*i/6;addRealPillar(Math.sin(a)*rr,Math.cos(a)*rr,.8,1.8,i%2?'B':'A')}
    addCrate(0,0,75,0);
  }else if(type==='fort'){
    addWallRun(-7,4.3,5.0,false,true);addWallRun(7,-4.3,5.0,false,true);
    addWallRun(-9,2.4,4.0,true);addWallRun(9,-2.4,4.0,true);
    addWallRun(-2.5,0,3.0,true);addWallRun(2.5,0,3.0,true);
    addCrate(-10,-4.6,48,1);addCrate(10,4.6,48,2);
  }else if(type==='bush'){
    addWallRun(-7,0,4.0,true);addWallRun(7,0,4.0,true);
    [[-3.4,-3],[3.4,3],[-3.4,3],[3.4,-3],[0,0],[-9,4.5],[9,-4.5]].forEach(([x,z])=>addBush(x,z,1.35));
  }else if(type==='crates'){
    const spots=[[-5,-3],[5,3],[5,-3],[-5,3],[0,0],[-9,0],[9,0],[0,-5],[0,5],[-10,-5],[10,5]];
    spots.forEach(([x,z],i)=>addCrate(x,z,i===4?85:52,i));
  }
}

function makePlayer(i,keyOrCfg){
  const cfg=typeof keyOrCfg==='string'?CHARACTERS[keyOrCfg]:keyOrCfg;
  const key=cfg.weaponKey||keyOrCfg;
  const root=new THREE.Group();

  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.72,24),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;root.add(shadow);

  const primitive=new THREE.Group();
  root.add(primitive);
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.72,5,10),new THREE.MeshStandardMaterial({color:cfg.color,roughness:.58}));
  body.position.y=.88;primitive.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),new THREE.MeshStandardMaterial({color:0xf1c6a5,roughness:.8}));
  head.position.y=1.66;primitive.add(head);

  const modelHost=new THREE.Group();
  root.add(modelHost);

  const weaponPivot=new THREE.Group();weaponPivot.position.y=1.05;root.add(weaponPivot);
  const gunLen=key==='crusher'?1.0:key==='skeleton'?1.4:1.25;
  const gunColor=key==='mage'?0x5be0d0:key==='skeleton'?0x8f826c:0x202735;
  const gun=new THREE.Mesh(new THREE.BoxGeometry(key==='crusher'?.38:.26,.24,gunLen),new THREE.MeshStandardMaterial({color:gunColor,metalness:.25,roughness:.45}));
  gun.position.z=-gunLen*.5;weaponPivot.add(gun);

  const x=i===0?-SPAWN_X:SPAWN_X;
  root.position.set(x,0,0);root.rotation.y=i===0?-Math.PI/2:Math.PI/2;
  const bodyScale=cfg.bodyWeight==='heavy'?1.08:cfg.bodyWeight==='light'?.94:1;
  primitive.scale.setScalar(bodyScale);
  modelHost.scale.setScalar(bodyScale);
  scene.add(root);

  const defenseFx=new THREE.Group();root.add(defenseFx);

  const guardShield=new THREE.Mesh(
    new THREE.PlaneGeometry(1.25,1.45),
    new THREE.MeshBasicMaterial({color:0x83d8ff,transparent:true,opacity:.0,side:THREE.DoubleSide,depthWrite:false})
  );
  guardShield.position.set(0,1.0,-.72);defenseFx.add(guardShield);

  const barrierShell=new THREE.Mesh(
    new THREE.SphereGeometry(.95,16,12),
    new THREE.MeshBasicMaterial({color:0x69dbff,transparent:true,opacity:0,wireframe:true,depthWrite:false})
  );
  barrierShell.position.y=.95;defenseFx.add(barrierShell);

  const parryRing=new THREE.Mesh(
    new THREE.RingGeometry(.72,1.02,40),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})
  );
  parryRing.rotation.x=-Math.PI/2;parryRing.position.y=.06;defenseFx.add(parryRing);

  const player={i,key,cfg,root,primitive,modelHost,weaponPivot,weaponPrimitive:gun,weaponReal:null,hp:cfg.hp,maxHp:cfg.hp,score:0,alive:true,invuln:0,fireCd:0,recovery:0,super:0,heat:0,overheated:false,fireHeld:false,powerBuff:0,
    defenseCd:0,guard:100,guarding:false,barrier:0,parryActive:0,parryChain:0,defenseFx,guardShield,barrierShell,parryRing,flashTime:0,dashFx:0,
    stats:{damageDealt:0,damageTaken:0,shots:0,hits:0,supers:0,defenses:0,cores:0,parries:0},
    move:new THREE.Vector2(),aim:new THREE.Vector2(i===0?1:-1,0),radius:cfg.radius||.58,mixer:null,realModel:false};
  attachRealModel(player);attachWeaponModel(player);
  return player;
}


const weaponBulletMats={
  rifle:new THREE.MeshBasicMaterial({color:0x8fd7ff}),
  scatter:new THREE.MeshBasicMaterial({color:0xffbf66}),
  rapid:new THREE.MeshBasicMaterial({color:0xb8ff7a}),
  arcane:new THREE.MeshBasicMaterial({color:0xb780ff}),
  bladegun:new THREE.MeshBasicMaterial({color:0xff7fb5}),
  cannon:new THREE.MeshBasicMaterial({color:0xff6a54})
};

function projectileGeometryFor(style,radius){
  if(style==='arcane')return new THREE.IcosahedronGeometry(radius,1);
  if(style==='cannon')return new THREE.SphereGeometry(radius,12,8);
  if(style==='scatter')return new THREE.SphereGeometry(radius,8,6);
  if(style==='rapid')return new THREE.CapsuleGeometry(radius*.6,radius*1.4,3,6);
  return new THREE.SphereGeometry(radius,10,7);
}

function muzzleFlash(p){
  const flash=new THREE.Mesh(
    new THREE.SphereGeometry(.12,6,4),
    new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false})
  );
  const dir=new THREE.Vector3(p.aim.x,0,p.aim.y);
  if(dir.lengthSq()<.01)dir.set(0,0,p.i===0?-1:1);
  dir.normalize();
  flash.position.copy(p.root.position).addScaledVector(dir,.9);
  flash.position.y=.86;
  scene.add(flash);
  matchLater(()=>{
    scene.remove(flash);flash.geometry.dispose();flash.material.dispose();
  },45);
}

function weaponShotSound(style){
  if(style==='scatter'){
    tone(92,.065,'square',.03,35);matchLater(()=>tone(138,.04,'square',.018,-25),24);
  }else if(style==='rapid'){
    tone(245,.028,'square',.016,95);
  }else if(style==='arcane'){
    tone(410,.07,'sine',.028,180);matchLater(()=>tone(620,.045,'sine',.016,-100),30);
  }else if(style==='bladegun'){
    tone(215,.04,'triangle',.02,120);
  }else if(style==='cannon'){
    tone(68,.11,'sawtooth',.04,22);matchLater(()=>tone(105,.065,'square',.022,-35),36);
  }else{
    tone(180,.04,'square',.02,85);
  }
}

function applyShotRecoil(p){
  let recoil=p.cfg.recoil||0;
  recoil*=THREE.MathUtils.clamp(1-(p.cfg.recoilResist||0),.55,1.15);
  if(recoil<=0)return;
  const dir=new THREE.Vector3(p.aim.x,0,p.aim.y);
  if(dir.lengthSq()<.01)return;
  dir.normalize().multiplyScalar(-recoil);
  const q=p.root.position.clone().add(dir);
  if(canMoveTo(q,p.radius))p.root.position.copy(q);
}

function disposeBullet(q){
  scene.remove(q.mesh);
  q.mesh.geometry?.dispose?.();
  q.mesh.material?.dispose?.();
}

const bulletMats=[
  new THREE.MeshBasicMaterial({color:0x74d5ff}),
  new THREE.MeshBasicMaterial({color:0xff7b92})
];

let audioCtx=null;
function ac(){
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended') audioCtx.resume();
  return audioCtx;
}
function tone(freq,dur=.06,type='square',gain=.025,slide=0){
  try{
    const c=ac(),o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);
    if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),c.currentTime+dur);
    g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
    o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+dur);
  }catch{}
}
function synthHit(){tone(85,.07,'sawtooth',.04,-30)}
function synthKO(){tone(150,.16,'sawtooth',.055,-100);setTimeout(()=>tone(72,.22,'square',.04,-20),90)}

const bgmFiles={
  normal:'./assets/audio/bgm/01_empacotatron_loop.ogg',
  sudden:'./assets/audio/bgm/02_trance_boss_battle.ogg',
  space:'./assets/audio/bgm/03_space_boss_battle.ogg'
};
let realBGM=null,realBGMMode=null;
function playRealBGM(mode='normal'){
  const src=bgmFiles[mode]||bgmFiles.normal;
  if(realBGMMode===mode&&realBGM&&!realBGM.paused)return;
  if(realBGM){realBGM.pause();realBGM=null}
  const a=new Audio(src);
  a.loop=true;a.volume=.28;a.preload='auto';
  a.addEventListener('error',()=>{ if(running) startBGM(); },{once:true});
  a.play().then(()=>{ stopBGM(); realBGM=a; realBGMMode=mode; }).catch(()=>{ if(running) startBGM(); });
}
function stopRealBGM(){
  if(realBGM){realBGM.pause();realBGM.currentTime=0;realBGM=null}
  realBGMMode=null;
}

let bgmTimer=null,bgmStep=0;
const BGM_NOTES=[110,138.59,164.81,138.59,123.47,155.56,185,155.56];
function startBGM(){
  if(bgmTimer)return;
  bgmStep=0;
  bgmTimer=setInterval(()=>{
    if(!running)return;
    const f=BGM_NOTES[bgmStep++%BGM_NOTES.length];
    tone(f,.16,'triangle',.008,0);
    if(bgmStep%4===1)tone(f/2,.11,'sine',.006,0);
  },240);
}
function stopBGM(){if(bgmTimer){clearInterval(bgmTimer);bgmTimer=null}}


function particleBurst(pos,color=0xffffff,count=9,scale=.08){
  for(let i=0;i<count;i++){
    const m=new THREE.Mesh(new THREE.SphereGeometry(scale,6,6),new THREE.MeshBasicMaterial({color,transparent:true,opacity:1}));
    m.position.copy(pos);
    scene.add(m);
    const v=new THREE.Vector3((Math.random()-.5)*4,Math.random()*2.8,(Math.random()-.5)*4);
    particles.push({mesh:m,vel:v,life:.28,max:.28});
  }
}

function spawnBullet(owner,dir,damage,speed){
  const p=players[owner];
  const style=p?.cfg.weaponStyle||'rifle';
  const radius=p?.cfg.bulletRadius||.16;
  const geo=projectileGeometryFor(style,radius);
  const mat=(weaponBulletMats[style]||bulletMats[owner]||weaponBulletMats.rifle).clone();
  if(p?.powerBuff>0)mat.color.offsetHSL(0,.05,.16);

  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(p.root.position);mesh.position.y=.82;
  const forward=dir.clone().normalize();
  mesh.position.addScaledVector(forward,.82);
  scene.add(mesh);

  bullets.push({mesh,vel:forward.multiplyScalar(speed),owner,life:p?.cfg.bulletLife||1.45,radius,damage,style});
}
function shoot(i){
  const p=players[i];
  if(!running||!p?.alive||p.fireCd>0||p.recovery>0||p.overheated||p.guarding||p.aim.lengthSq()<.12)return;
  p.fireCd=p.cfg.fireCd;
  p.recovery=p.cfg.recovery||0;
  p.stats.shots++;
  p.heat=Math.min(100,(p.heat||0)+(p.cfg.pellets>1?28:p.cfg.fireCd<.2?11:p.cfg.fireCd>.6?38:18));
  if(p.heat>=100&&!p.overheated){
    p.overheated=true;
    showBanner(`P${i+1} OVERHEAT!`,420);
    tone(120,.11,'sawtooth',.03,-45);
    if(navigator.vibrate)navigator.vibrate([20,30,20]);
  }
  const base=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize();
  const count=p.cfg.pellets||1;
  for(let n=0;n<count;n++){
    const ang=count===1?(Math.random()-.5)*(p.cfg.spread||0):THREE.MathUtils.lerp(-p.cfg.spread,p.cfg.spread,n/(count-1));
    const dir=base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),ang);
    spawnBullet(i,dir,p.cfg.damage*(p.powerBuff>0?1.18:1),p.cfg.bulletSpeed);
  }
  muzzleFlash(p);
  applyShotRecoil(p);
  weaponShotSound(p.cfg.weaponStyle||'rifle');
  if(navigator.vibrate) navigator.vibrate(p.cfg.weaponStyle==='cannon'?18:p.cfg.weaponStyle==='scatter'?12:8);
}




function defenseTrail(p,color=p.cfg.color){
  const ghost=new THREE.Mesh(
    new THREE.RingGeometry(.38,.62,28),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false})
  );
  ghost.rotation.x=-Math.PI/2;
  ghost.position.copy(p.root.position);ghost.position.y=.08;
  scene.add(ghost);

  const born=performance.now();
  function fade(){
    const t=(performance.now()-born)/220;
    if(t>=1){scene.remove(ghost);ghost.geometry.dispose();ghost.material.dispose();return}
    ghost.scale.setScalar(1+t*.8);
    ghost.material.opacity=.55*(1-t);
    requestAnimationFrame(fade);
  }
  requestAnimationFrame(fade);
}

function flashPlayer(p,duration=.09){
  p.flashTime=Math.max(p.flashTime||0,duration);
}

function updateDefenseFx(p,dt){
  if(!p.guardShield)return;

  p.flashTime=Math.max(0,(p.flashTime||0)-dt);

  const guardOn=p.guarding&&p.alive;
  p.guardShield.material.opacity=guardOn?.42:0;
  p.guardShield.visible=guardOn;
  if(guardOn){
    p.guardShield.scale.setScalar(.98+.04*Math.sin(performance.now()*.012));
  }

  const barrierOn=p.barrier>0&&p.alive;
  p.barrierShell.material.opacity=barrierOn?.22:0;
  p.barrierShell.visible=barrierOn;
  if(barrierOn){
    p.barrierShell.rotation.y+=dt*1.8;
    p.barrierShell.scale.setScalar(.98+.04*Math.sin(performance.now()*.01));
  }

  const parryOn=p.parryActive>0&&p.alive;
  p.parryRing.material.opacity=parryOn?.85:0;
  p.parryRing.visible=parryOn;
  if(parryOn){
    p.parryRing.rotation.z+=dt*7;
    const s=1+.18*Math.sin(performance.now()*.03);
    p.parryRing.scale.setScalar(s);
  }

  if(p.flashTime>0){
    p.primitive.visible=Math.floor(p.flashTime*70)%2===0;
    if(p.realModel)p.modelHost.visible=Math.floor(p.flashTime*70)%2===0;
  }else{
    p.primitive.visible=!p.realModel;
    if(p.realModel)p.modelHost.visible=true;
  }
}

function defenseLabel(type){
  return ({
    roll:'ROLL',guard:'GUARD',step:'STEP',
    barrier:'BARRIER',evade:'EVADE',parry:'PARRY'
  })[type]||'DEF';
}

function defenseAction(i){
  const p=players[i];
  if(!running||!p?.alive)return;

  const type=p.cfg.defense;
  p.stats.defenses++;

  if(type==='guard'){
    if(p.guard<=0||p.defenseCd>0)return;
    p.guarding=!p.guarding;
    showBanner(p.guarding?`P${i+1} GUARD`:`P${i+1} RELEASE`,240);
    tone(p.guarding?170:240,.045,'square',.022,p.guarding?-20:60);
    return;
  }

  if(p.defenseCd>0)return;

  let dir;
  if(p.move.lengthSq()>.05)dir=new THREE.Vector3(p.move.x,0,p.move.y);
  else dir=new THREE.Vector3(p.aim.x,0,p.aim.y);
  if(dir.lengthSq()<.01)dir.set(0,0,i===0?-1:1);
  dir.normalize();

  if(type==='roll'){
    p.defenseCd=2.4;
    p.invuln=Math.max(p.invuln,.26);
    for(let k=0;k<7;k++){
      const q=p.root.position.clone().addScaledVector(dir,.34*(p.cfg.dashMul||1));
      if(canMoveTo(q,p.radius))p.root.position.copy(q);
    }
    defenseTrail(p);
    particleBurst(p.root.position.clone().setY(.45),p.cfg.color,10,.07);
    tone(280,.05,'triangle',.025,120);
    showBanner(`P${i+1} ROLL!`,260);

  }else if(type==='step'){
    p.defenseCd=1.7;
    p.invuln=Math.max(p.invuln,.17);
    for(let k=0;k<9;k++){
      const q=p.root.position.clone().addScaledVector(dir,.38*(p.cfg.dashMul||1));
      if(canMoveTo(q,p.radius))p.root.position.copy(q);
    }
    defenseTrail(p);
    particleBurst(p.root.position.clone().setY(.35),p.cfg.color,8,.06);
    tone(350,.045,'triangle',.022,160);
    showBanner(`P${i+1} STEP!`,240);

  }else if(type==='evade'){
    p.defenseCd=3.2;
    p.invuln=Math.max(p.invuln,.38);
    if(p.move.lengthSq()<=.05){
      dir.set(-p.aim.y,0,p.aim.x).normalize();
    }
    for(let k=0;k<8;k++){
      const q=p.root.position.clone().addScaledVector(dir,.36*(p.cfg.dashMul||1));
      if(canMoveTo(q,p.radius))p.root.position.copy(q);
    }
    defenseTrail(p);
    particleBurst(p.root.position.clone().setY(.4),p.cfg.color,12,.075);
    tone(320,.06,'triangle',.028,180);
    showBanner(`P${i+1} EVADE!`,260);

  }else if(type==='barrier'){
    p.defenseCd=6;
    p.barrier=55;
    particleBurst(p.root.position.clone().setY(.9),0x8fefff,18,.08);
    tone(520,.09,'sine',.03,-120);
    showBanner(`P${i+1} BARRIER!`,320);

  }else if(type==='parry'){
    p.defenseCd=.85;
    p.parryActive=.18;
    tone(720,.035,'square',.018,-90);
    showBanner(`P${i+1} PARRY`,220);
  }
}

function sourceFrontDot(p,sourcePos){
  const forward=new THREE.Vector3(
    Math.sin(p.root.rotation.y-Math.PI),0,
    Math.cos(p.root.rotation.y-Math.PI)
  ).normalize();
  const to=sourcePos.clone().sub(p.root.position);
  to.y=0;
  if(to.lengthSq()<.0001)return 1;
  to.normalize();
  return forward.dot(to);
}

function parryBullet(victim,b){
  const p=players[victim];
  p.parryActive=0;
  p.parryChain++;
  p.stats.parries++;
  p.defenseCd=0; // successful parry can chain immediately
  hitStop=Math.max(hitStop,.085);

  b.owner=victim;
  b.vel.multiplyScalar(-1.18);
  b.damage*=1.12;

  flashPlayer(p,.08);
  particleBurst(p.root.position.clone().setY(.9),0xffffff,22,.09);
  tone(940,.065,'square',.045,-280);
  showBanner(`PARRY! x${p.parryChain}`,320);
  if(navigator.vibrate)navigator.vibrate([12,18,12]);
}

function matchLater(fn,ms){
  const gen=matchGeneration;
  return setTimeout(()=>{
    if(gen!==matchGeneration)return;
    fn();
  },ms);
}


function superPulse(p,color=0xffffff,scale=1){
  const ring=new THREE.Mesh(
    new THREE.RingGeometry(.65*scale,1.0*scale,48),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false})
  );
  ring.rotation.x=-Math.PI/2;
  ring.position.copy(p.root.position);ring.position.y=.06;
  scene.add(ring);
  const born=performance.now();
  const life=360;
  function tick(){
    const t=(performance.now()-born)/life;
    if(t>=1){
      scene.remove(ring);ring.geometry.dispose();ring.material.dispose();return;
    }
    ring.scale.setScalar(1+t*1.8);
    ring.material.opacity=.9*(1-t);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function superFlash(p,color=0xffffff){
  flashPlayer(p,.16);
  particleBurst(p.root.position.clone().setY(.9),color,28,.11);
  hitStop=Math.max(hitStop,.045);
}

function superShot(owner,dir,damage,speed,style,radius=.18,life=1.4){
  const p=players[owner];
  const geo=projectileGeometryFor(style,radius);
  const mat=(weaponBulletMats[style]||weaponBulletMats.rifle).clone();
  mat.color.offsetHSL(0,.12,.12);
  const mesh=new THREE.Mesh(geo,mat);
  mesh.position.copy(p.root.position);mesh.position.y=.9;
  const forward=dir.clone().normalize();
  mesh.position.addScaledVector(forward,.9);
  scene.add(mesh);
  bullets.push({mesh,vel:forward.multiplyScalar(speed),owner,life,radius,damage,style});
}

function activateSuper(i){
  const p=players[i];
  if(!running||!p?.alive||p.super<100)return;

  p.super=0;
  p.stats.supers++;
  p.fireHeld=false;
  p.heat=Math.max(0,p.heat-35);
  p.overheated=false;

  const type=p.cfg.super;

  if(type==='rapid'){
    // OVERDRIVE: short burst of forced rapid fire.
    superPulse(p,0x8fd7ff,1.0);
    superFlash(p,0x8fd7ff);
    showBanner(`P${i+1} OVERDRIVE!`,520);
    tone(360,.08,'square',.035,280);

    const baseDamage=Math.max(8,p.cfg.damage*.78);
    for(let k=0;k<12;k++){
      matchLater(()=>{
        if(!running||!p.alive)return;
        const dir=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize();
        superShot(i,dir,baseDamage,16.5,'rapid',.11,1.4);
        muzzleFlash(p);
        tone(285,.025,'square',.014,80);
      },k*62);
    }

  }else if(type==='blast'){
    // BLAST RING: 360-degree close control.
    superPulse(p,0xffb05a,1.25);
    superFlash(p,0xffb05a);
    showBanner(`P${i+1} BLAST RING!`,520);
    tone(105,.12,'sawtooth',.045,80);

    for(let k=0;k<18;k++){
      const a=(Math.PI*2*k)/18;
      superShot(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),17,11.2,'scatter',.14,1.15);
    }

  }else if(type==='dash'){
    // PHANTOM DASH: high-speed invulnerable charge.
    const dir=new THREE.Vector3(p.aim.x,0,p.aim.y);
    if(dir.lengthSq()<.01)dir.set(0,0,i===0?-1:1);
    dir.normalize();

    superPulse(p,0xa98cff,1.05);
    showBanner(`P${i+1} PHANTOM DASH!`,520);
    tone(250,.08,'triangle',.035,420);
    p.invuln=Math.max(p.invuln,.65);

    for(let k=0;k<13;k++){
      matchLater(()=>{
        if(!running||!p.alive)return;
        defenseTrail(p,0xa98cff);
        const step=p.root.position.clone().addScaledVector(dir,.48*(p.cfg.dashMul||1));
        if(canMoveTo(step,p.radius))p.root.position.copy(step);
      },k*22);
    }
    matchLater(()=>particleBurst(p.root.position.clone().setY(.6),0xa98cff,22,.09),260);

  }else if(type==='nova'){
    // NOVA: large radial magic burst + heal.
    superPulse(p,0x5be0d0,1.35);
    superFlash(p,0x5be0d0);
    showBanner(`P${i+1} NOVA!`,520);
    tone(460,.12,'sine',.04,360);
    p.hp=Math.min(p.maxHp,p.hp+24);

    for(let k=0;k<20;k++){
      const a=Math.PI*2*k/20;
      superShot(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),19,9.6,'arcane',.21,2.0);
    }

  }else if(type==='fan'){
    // BLADE FAN: broad forward burst.
    const base=new THREE.Vector3(p.aim.x,0,p.aim.y);
    if(base.lengthSq()<.01)base.set(0,0,i===0?-1:1);
    base.normalize();

    superPulse(p,0xff7fb5,1.0);
    superFlash(p,0xff7fb5);
    showBanner(`P${i+1} BLADE FAN!`,520);
    tone(290,.07,'triangle',.035,240);

    for(let k=-5;k<=5;k++){
      superShot(i,base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),k*.105),18,15.5,'bladegun',.14,1.5);
    }

  }else if(type==='boneStorm'){
    // STORM: two delayed radial waves, enabling timing pressure.
    superPulse(p,0xff6a54,1.25);
    superFlash(p,0xff6a54);
    showBanner(`P${i+1} STORM!`,520);
    tone(120,.1,'square',.04,210);

    for(let wave=0;wave<2;wave++){
      matchLater(()=>{
        if(!running||!p.alive)return;
        superPulse(p,wave===0?0xff6a54:0xffffff,1.0+wave*.18);
        for(let k=0;k<16;k++){
          const a=Math.PI*2*k/16 + wave*.095;
          superShot(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),20,10.5,'cannon',.19,1.75);
        }
        tone(wave===0?125:165,.07,'square',.03,90);
      },wave*220);
    }
  }

  if(navigator.vibrate)navigator.vibrate([20,18,35]);
}
function canMoveTo(pos,r){
  if(Math.abs(pos.x)>ARENA.halfW-r||Math.abs(pos.z)>ARENA.halfH-r)return false;
  return !obstacles.some(o=>{
    if(o.circle){
      const dx=pos.x-o.x,dz=pos.z-o.z; return dx*dx+dz*dz<(o.r+r)*(o.r+r);
    }
    return Math.abs(pos.x-o.x)<o.hw+r&&Math.abs(pos.z-o.z)<o.hd+r;
  });
}

const result=$('#result');

function resetPlayer(i){
  const p=players[i];p.hp=p.maxHp;p.alive=true;p.invuln=1.15;p.heat=0;p.overheated=false;p.recovery=0;p.fireHeld=false;p.powerBuff=0;
  p.defenseCd=0;p.guard=100;p.guarding=false;p.barrier=0;p.parryActive=0;p.parryChain=0;p.flashTime=0;
  if(p.guardShield)p.guardShield.visible=false;
  if(p.barrierShell)p.barrierShell.visible=false;
  if(p.parryRing)p.parryRing.visible=false;
  p.fireCd=.18;p.root.visible=true;
  p.root.position.set(i===0?-SPAWN_X:SPAWN_X,0,0);p.move.set(0,0);p.aim.set(i===0?1:-1,0);
}
function damagePop(amount){
  const el=document.createElement('div');
  el.className='damage-pop';el.textContent=`-${Math.round(amount)}`;
  document.body.appendChild(el);setTimeout(()=>el.remove(),480);
}
function hitObstacle(pos,r=.15){
  return obstacles.find(o=>{
    if(o.circle){const dx=pos.x-o.x,dz=pos.z-o.z;return dx*dx+dz*dz<(o.r+r)*(o.r+r)}
    return Math.abs(pos.x-o.x)<o.hw+r&&Math.abs(pos.z-o.z)<o.hd+r;
  }) || null;
}
function damageObstacle(o,amount,pos){
  if(!o?.destructible)return false;
  o.hp-=amount;
  particleBurst(pos.clone().setY(.55),0xd6a05d,7,.065);
  if(o.hp<=0){
    arenaRoot.remove(o.mesh);
    obstacles=obstacles.filter(x=>x!==o);
    particleBurst(pos.clone().setY(.6),0xc58b4a,18,.09);
    tone(70,.12,'sawtooth',.035,-25);
  }
  return true;
}

function damage(victim,amount,attacker){
  const p=players[victim];
  if(!p.alive||p.invuln>0)return;

  if(p.cfg.defense==='barrier'&&p.barrier>0){
    const absorbed=Math.min(p.barrier,amount);
    p.barrier-=absorbed;
    amount-=absorbed;
    hitStop=Math.max(hitStop,.03);
    particleBurst(p.root.position.clone().setY(.9),0x8fefff,8,.06);
    tone(470,.045,'sine',.022,-80);
    if(amount<=0)return;
  }

  if(p.cfg.defense==='guard'&&p.guarding&&p.guard>0){
    const source=players[attacker]?.root.position;
    if(source&&sourceFrontDot(p,source)>.05){
      p.guard=Math.max(0,p.guard-amount*1.25);
      amount*=.22;
      hitStop=Math.max(hitStop,.04);
      tone(170,.05,'square',.028,-60);

      if(p.guard<=0){
        p.guarding=false;
        p.defenseCd=1;
        showBanner(`P${victim+1} GUARD BREAK!`,480);
        flashPlayer(p,.18);
        particleBurst(p.root.position.clone().setY(.8),0xff8a55,18,.1);
      }
    }
  }

  amount*=p.cfg.damageTakenMul||1;
  const finalDamage=amount;
  p.stats.damageTaken+=finalDamage;
  if(players[attacker]){
    players[attacker].stats.damageDealt+=finalDamage;
    players[attacker].stats.hits++;
  }
  p.hp=Math.max(0,p.hp-finalDamage);damagePop(finalDamage);
  players[attacker].super=Math.min(100,players[attacker].super+finalDamage*.9*(players[attacker].cfg.superGainMul||1));
  p.super=Math.min(100,p.super+finalDamage*.35*(p.cfg.superGainMul||1));

  flashPlayer(p,.11);

  const src=players[attacker]?.root.position;
  if(src){
    const away=p.root.position.clone().sub(src);away.y=0;
    if(away.lengthSq()>.001){
      away.normalize();
      const baseKnock=THREE.MathUtils.clamp(.18+amount*.008,.22,.48);
      const resist=THREE.MathUtils.clamp(p.cfg.knockbackResist||0,-.15,.45);
      const knock=baseKnock*(1-resist);
      const q=p.root.position.clone().addScaledVector(away,knock);
      if(canMoveTo(q,p.radius))p.root.position.copy(q);
    }
  }

  hitStop=Math.max(hitStop,.045);synthHit();
  particleBurst(p.root.position.clone().setY(.9),0xffffff,10,.075);
  if(navigator.vibrate)navigator.vibrate(18);
  if(p.hp<=0)ko(victim,attacker);
}
function ko(victim,attacker){
  const p=players[victim];p.alive=false;
  const pos=p.root.position.clone().setY(.9);
  particleBurst(pos.clone(),p.cfg.color,32,.13);
  matchLater(()=>particleBurst(pos.clone().setY(1.05),0xffffff,18,.08),55);
  p.root.visible=false;players[attacker].score++;
  hitStop=Math.max(hitStop,.11);
  synthKO();showBanner(suddenDeath?'FINAL K.O!':'K.O!',suddenDeath?900:700);
  if(navigator.vibrate)navigator.vibrate([55,35,90]);
  updateHUD();

  if(suddenDeath){
    matchLater(()=>finish(attacker),650);
    return;
  }

  if(players[attacker].score>=3)matchLater(()=>finish(attacker),700);
  else matchLater(()=>resetPlayer(victim),1100);
}

function finish(w){
  matchGeneration++;
  running=false;stopBGM();stopRealBGM();
  renderMatchResult(w,players);
  $('#winner').textContent=`P${w+1} WIN!`;
  $('#result-score').textContent=`${players[0].score} - ${players[1].score}`;
  result.hidden=false;
}
function removePlayers(){
  players.forEach(p=>scene.remove(p.root));players=[];
}
function clearProjectiles(){
  bullets.forEach(disposeBullet);bullets=[];
  particles.forEach(p=>{scene.remove(p.mesh);p.mesh.geometry?.dispose?.();p.mesh.material?.dispose?.()});particles=[];
}

const COUNTDOWN_BASE='./assets/audio/voice/';
function playCountdownVoice(name){
  const a=new Audio(COUNTDOWN_BASE+name+'.ogg');a.volume=.9;
  a.play().catch(()=>tone(name==='go'?700:440,.1,'square',.03,name==='go'?200:0));
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
    el=document.createElement('div');el.id='vs-intro';el.className='vs-intro';document.body.appendChild(el);
  }
  el.innerHTML=`
    <div class="vs-side p1"><small>PLAYER 1</small><strong>${players[0].cfg.name}</strong><span>${buildShortLabel(players[0])}</span></div>
    <div class="vs-mark">VS</div>
    <div class="vs-side p2"><small>PLAYER 2</small><strong>${players[1].cfg.name}</strong><span>${buildShortLabel(players[1])}</span></div>`;
  el.classList.add('show');
  return new Promise(r=>setTimeout(()=>{el.classList.remove('show');r()},1050));
}

async function battleCountdown(){
  running=false;
  await showVsIntro();
  for(const n of [3,2,1]){
    showBanner(String(n),700);playCountdownVoice('count_'+n);
    await new Promise(r=>setTimeout(r,800));
  }
  showBanner('GO!',700);playCountdownVoice('go');
  await new Promise(r=>setTimeout(r,350));
  running=true;
}

function startBattle(){
  hideMatchResult();
  matchGeneration++;
  suddenDeath=false;
  clearWorldStatus();clearPowerCore();powerCoreTimer=7;powerCoreOneSecondCue=false;removePlayers();clearProjectiles();buildArena(arenaSelection);
  players=[makePlayer(0,buildCustomConfig(0)),makePlayer(1,buildCustomConfig(1))];
  matchTime=90;running=false;result.hidden=true;playRealBGM(arenaSelection==='hex'?'space':'normal');
  $('#menu').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;
  updateHUD();updateWorldStatus();battleCountdown();
}
function fullReset(){
  hideMatchResult();
  matchGeneration++;
  suddenDeath=false;
  clearPowerCore();powerCoreTimer=7;powerCoreOneSecondCue=false;
  clearProjectiles();
  players.forEach((p,i)=>{p.score=0;p.super=0;p.stats={damageDealt:0,damageTaken:0,shots:0,hits:0,supers:0,defenses:0,cores:0,parries:0};resetPlayer(i)});
  matchTime=90;running=true;result.hidden=true;playRealBGM(arenaSelection==='hex'?'space':'normal');updateHUD();showBanner('FIGHT!',900);
}
$('#rematch').addEventListener('click',fullReset);
$('#back-menu').addEventListener('click',()=>{
  hideMatchResult();
  matchGeneration++;
  suddenDeath=false;
  clearPowerCore();powerCoreTimer=7;powerCoreOneSecondCue=false;
  running=false;stopBGM();stopRealBGM();result.hidden=true;$('#hud').hidden=true;$('#controls').hidden=true;$('#menu').hidden=false;
});

restoreLoadout(0);restoreLoadout(1);

$$('.loadout-card select').forEach(sel=>sel.addEventListener('change',()=>{
  const i=Number(sel.closest('.loadout-card').dataset.player);
  refreshLoadoutSummary(i);
}));

$$('.random-build').forEach(btn=>btn.addEventListener('click',()=>{
  randomizeLoadout(Number(btn.dataset.player));
}));

refreshLoadoutSummary(0);refreshLoadoutSummary(1);

$('.arena-buttons').addEventListener('click',e=>{
  const b=e.target.closest('button[data-arena]');if(!b)return;
  arenaSelection=b.dataset.arena;$$('.arena-buttons button').forEach(x=>x.classList.toggle('selected',x===b));
});
$('#start').addEventListener('click',()=>{
  const cards=[...document.querySelectorAll('.loadout-card')];
  if(cards.some(card=>buildCostFromCard(card)>BUILD_LIMIT)){
    showBanner('BUILD OVER LIMIT!',500);
    tone(110,.1,'square',.03,-40);
    return;
  }
  ac();
  startBattle();
});
$$('.def-btn').forEach(b=>b.addEventListener('pointerdown',e=>{
  e.preventDefault();
  defenseAction(Number(b.dataset.player));
}));
$$('.super-btn').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();activateSuper(Number(b.dataset.player))}));


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
  players.forEach(p=>{
    p.worldStatus?.remove();
    p.worldStatus=null;
  });
}

function updateHUD(){
  players.forEach((p,i)=>{
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

function screenVectorToWorld(player,x,y){
  if(cameraMode==='arena'){
    const cam=chaseCameras[player];
    const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);fwd.y=0;
    if(fwd.lengthSq()<1e-6)fwd.set(player===0?1:-1,0,0);else fwd.normalize();
    const right=new THREE.Vector3(fwd.z,0,-fwd.x);
    if(player===1){x=-x;y=-y}
    const world=right.multiplyScalar(x).add(fwd.multiplyScalar(-y));
    return new THREE.Vector2(world.x,world.z);
  }
  const {w,h}=getLayoutSize(),portrait=h>=w;
  return portrait?new THREE.Vector2(-y,x):new THREE.Vector2(x,y);
}

const activePointers=new Map();
$$('.stick-zone').forEach(zone=>{
  const knob=zone.querySelector('i'),base=zone.querySelector('.stick');
  const player=Number(zone.dataset.player),kind=zone.dataset.kind;
  function apply(e){
    if(!players[player])return;
    const r=base.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    const screenDx=e.clientX-cx,screenDy=e.clientY-cy;
    const max=r.width*.33,len=Math.hypot(screenDx,screenDy)||1,k=Math.min(1,max/len);
    // The knob always follows the finger. Only the gameplay vector is rotated for the face-to-face player.
    knob.style.transform=`translate(calc(-50% + ${screenDx*k}px),calc(-50% + ${screenDy*k}px))`;
    let vx=screenDx/max,vy=screenDy/max;const mag=Math.hypot(vx,vy);
    if(mag>1){vx/=mag;vy/=mag} if(mag<.12){vx=0;vy=0}
    const world=screenVectorToWorld(player,vx,vy);const vec=kind==='move'?players[player].move:players[player].aim;vec.copy(world);
    if(kind==='aim'){
      players[player].fireHeld=mag>.35;
      if(players[player].fireHeld)shoot(player);
    }
  }
  zone.addEventListener('pointerdown',e=>{e.preventDefault();zone.setPointerCapture(e.pointerId);activePointers.set(e.pointerId,{player,kind});apply(e)});
  zone.addEventListener('pointermove',e=>{if(activePointers.has(e.pointerId))apply(e)});
  const end=e=>{
    if(!activePointers.has(e.pointerId))return;
    activePointers.delete(e.pointerId);knob.style.transform='translate(-50%,-50%)';
    if(players[player]){
      if(kind==='move')players[player].move.set(0,0);
      if(kind==='aim')players[player].fireHeld=false;
    }
  };
  zone.addEventListener('pointerup',end);zone.addEventListener('pointercancel',end);
});

const keys=new Set();
addEventListener('keydown',e=>keys.add(e.key.toLowerCase()));
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function keyboardInput(){
  if(!players.length)return;
  const p1=players[0],p2=players[1];
  let x=(keys.has('d')?1:0)-(keys.has('a')?1:0),z=(keys.has('s')?1:0)-(keys.has('w')?1:0);
  if(x||z)p1.move.set(x,z).normalize();else if(![...activePointers.values()].some(v=>v.player===0&&v.kind==='move'))p1.move.set(0,0);
  if(keys.has('f')){p1.aim.set(-1,0);shoot(0)} if(keys.has('g')){p1.aim.set(1,0);shoot(0)} if(keys.has('r'))activateSuper(0);
  x=(keys.has('arrowright')?1:0)-(keys.has('arrowleft')?1:0);z=(keys.has('arrowdown')?1:0)-(keys.has('arrowup')?1:0);
  if(x||z)p2.move.set(x,z).normalize();else if(![...activePointers.values()].some(v=>v.player===1&&v.kind==='move'))p2.move.set(0,0);
  if(keys.has('k')){p2.aim.set(-1,0);shoot(1)} if(keys.has('l')){p2.aim.set(1,0);shoot(1)} if(keys.has('o'))activateSuper(1);
}


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
    const s=.95+urgency*.16+.035*pulse;
    powerCoreWarning.scale.setScalar(s);

    if(powerCoreTimer<=1){
      powerCoreWarning.material.color.setHex(0xff8a3d);
    }else{
      powerCoreWarning.material.color.setHex(0xffd75a);
    }
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
      if(navigator.vibrate)navigator.vibrate([18,20,35,18,20]);
      clearPowerCore();
      powerCoreTimer=12;
      break;
    }
  }
}

function update(dt){
  if(!running)return;
  keyboardInput();
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
        playRealBGM('sudden');
        showBanner('SUDDEN DEATH! NEXT K.O WINS',1200);
        tone(210,.12,'square',.035,260);
      }
    }else{
      // If nobody scores in the 30-second sudden-death window, keep the duel alive.
      matchTime=30;
      showBanner('KEEP FIGHTING!',500);
    }
  }
  players.forEach(p=>{
    p.fireCd=Math.max(0,p.fireCd-dt);p.recovery=Math.max(0,(p.recovery||0)-dt);p.invuln=Math.max(0,p.invuln-dt);p.powerBuff=Math.max(0,(p.powerBuff||0)-dt);
    p.defenseCd=Math.max(0,(p.defenseCd||0)-dt);
    p.parryActive=Math.max(0,(p.parryActive||0)-dt);
    if(p.cfg.defense==='guard'&&!p.guarding)p.guard=Math.min(100,p.guard+18*dt);
    p.heat=Math.max(0,(p.heat||0)-24*(p.cfg.heatCoolMul||1)*dt);
    if(p.overheated&&p.heat<=35){
      p.overheated=false;
      showBanner(`P${p.i+1} READY`,260);
      tone(520,.06,'sine',.02,120);
    }
    if(!p.alive)return;
    if(p.fireHeld&&p.aim.lengthSq()>.12)shoot(p.i);
    const m=p.move.clone();if(m.lengthSq()>1)m.normalize();
    const recoveryMoveMul=p.recovery>0?.58:1;
    const guardMoveMul=p.guarding?.42:1;
    const next=p.root.position.clone();next.x+=m.x*p.cfg.speed*recoveryMoveMul*guardMoveMul*dt;next.z+=m.y*p.cfg.speed*recoveryMoveMul*guardMoveMul*dt;
    if(canMoveTo(next,p.radius))p.root.position.copy(next);else{
      const nx=p.root.position.clone();nx.x=next.x;if(canMoveTo(nx,p.radius))p.root.position.x=nx.x;
      const nz=p.root.position.clone();nz.z=next.z;if(canMoveTo(nz,p.radius))p.root.position.z=nz.z;
    }
    if(p.aim.lengthSq()>.12)p.root.rotation.y=Math.atan2(p.aim.x,p.aim.y)+Math.PI;
    updateDefenseFx(p,dt);
    if(p.mixer){
      const moving=p.move.lengthSq()>.08;
      if(p.walkAction){p.walkAction.enabled=moving;p.walkAction.setEffectiveWeight(moving?1:0)}
      if(p.idleAction){p.idleAction.enabled=!moving;p.idleAction.setEffectiveWeight(moving?0:1)}
      p.mixer.update(dt);
    }
    p.root.visible=p.invuln>0?Math.floor(p.invuln*12)%2===0:true;
    const inBush=bushes.some(b=>{const dx=p.root.position.x-b.x,dz=p.root.position.z-b.z;return dx*dx+dz*dz<b.r*b.r});
    if(p.realModel)p.modelHost.scale.setScalar(inBush?0.96:1);

  });

  // Keep both fighters from occupying the exact same space.
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
      const pa=a.root.position.clone();pa.x-=nx*push;pa.z-=nz*push;
      const pb=b.root.position.clone();pb.x+=nx*push;pb.z+=nz*push;
      if(canMoveTo(pa,a.radius))a.root.position.copy(pa);
      if(canMoveTo(pb,b.radius))b.root.position.copy(pb);
    }
  }

  for(let i=bullets.length-1;i>=0;i--){
    const q=bullets[i];q.life-=dt;q.mesh.position.addScaledVector(q.vel,dt);
    if(q.style==='arcane'){
      q.mesh.rotation.x+=dt*5;q.mesh.rotation.y+=dt*7;
      const bs=1+.14*Math.sin(performance.now()*.02);q.mesh.scale.setScalar(bs);
    }else if(q.style==='cannon'){
      q.mesh.rotation.y+=dt*2.2;
    }else if(q.style==='rapid'){
      q.mesh.rotation.z+=dt*10;
    }
    let remove=q.life<=0;
    if(!remove){
      const o=hitObstacle(q.mesh.position,q.radius);
      if(o){damageObstacle(o,q.damage,q.mesh.position);remove=true}
      else if(Math.abs(q.mesh.position.x)>ARENA.halfW-q.radius||Math.abs(q.mesh.position.z)>ARENA.halfH-q.radius)remove=true;
    }
    if(!remove){
      const enemy=1-q.owner,p=players[enemy];
      // Top-down game: hit testing must use the XZ plane only.
      // Bullet y=.82 while player root y=0, so 3D distance made normal shots impossible to hit.
      const dx=q.mesh.position.x-p.root.position.x;
      const dz=q.mesh.position.z-p.root.position.z;
      if(p.alive&&dx*dx+dz*dz<(p.radius+q.radius)**2){
        if(p.cfg.defense==='parry'&&p.parryActive>0&&sourceFrontDot(p,q.mesh.position)>-.15){
          parryBullet(enemy,q);
          remove=false;
        }else{
          damage(enemy,q.damage,q.owner);
          remove=true;
        }
      }
    }
    if(remove){disposeBullet(q);bullets.splice(i,1)}
  }

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.life-=dt;p.mesh.position.addScaledVector(p.vel,dt);p.vel.y-=6*dt;
    if(p.mesh.material?.opacity!==undefined)p.mesh.material.opacity=Math.max(0,p.life/p.max);
    if(p.life<=0){scene.remove(p.mesh);p.mesh.geometry?.dispose?.();p.mesh.material?.dispose?.();particles.splice(i,1)}
  }

  updateHUD();updateWorldStatus();$('#timer').textContent=Math.ceil(matchTime);
}


function getLayoutSize(){
  const root=document.documentElement;
  return {w:Math.max(1,root.clientWidth||innerWidth),h:Math.max(1,root.clientHeight||innerHeight)};
}
function updateTopCamera(){
  if(cameraMode!=='top')return;
  const {w,h}=getLayoutSize(),aspect=w/Math.max(1,h),portrait=h>=w;
  topCamera.up.set(portrait?1:0,0,portrait?0:-1);
  if(players.length===2&&players[0]?.root&&players[1]?.root){
    const a=players[0].root.position,b=players[1].root.position;
    const mx=(a.x+b.x)*.5,mz=(a.z+b.z)*.5;
    const dx=Math.abs(a.x-b.x),dz=Math.abs(a.z-b.z);
    const screenSpanX=portrait?dz:dx,screenSpanY=portrait?dx:dz;
    const needW=screenSpanX+7.0,needH=screenSpanY+9.0;
    let viewH=Math.max(portrait?34:19,needH,needW/Math.max(.25,aspect));
    viewH=Math.min(viewH,portrait?42:27);
    const viewW=viewH*aspect;
    topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
    topCamera.position.set(mx,38,mz+.01);topCamera.lookAt(mx,0,mz);
  }else{
    const viewH=h>=w?38:23,viewW=viewH*aspect;
    topCamera.left=-viewW/2;topCamera.right=viewW/2;topCamera.top=viewH/2;topCamera.bottom=-viewH/2;
    topCamera.position.set(0,38,.01);topCamera.lookAt(0,0,0);
  }
  topCamera.updateProjectionMatrix();
}
function updateChaseCamera(i,cam,aspect){
  const me=players[i],op=players[1-i];if(!me?.root||!op?.root)return;
  const a=me.root.position,b=op.root.position;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  const ux=dx/len,uz=dz/len,dist=THREE.MathUtils.clamp(len,3,28);
  const back=THREE.MathUtils.clamp(4.8+dist*.09,5.0,7.3),height=THREE.MathUtils.clamp(6.8+dist*.08,7.0,9.5);
  const target=new THREE.Vector3((a.x+b.x)*.5,.8,(a.z+b.z)*.5);
  let cx=a.x-ux*back,cz=a.z-uz*back;
  cx=THREE.MathUtils.clamp(cx,-ARENA.halfW+1.1,ARENA.halfW-1.1);cz=THREE.MathUtils.clamp(cz,-ARENA.halfH+1.1,ARENA.halfH-1.1);
  cam.position.lerp(new THREE.Vector3(cx,height,cz),.24);cam.aspect=Math.max(.55,aspect);cam.fov=THREE.MathUtils.clamp(61+Math.max(0,8-dist)*.35,59,68);
  cam.up.set(0,i===1?-1:1,0);cam.lookAt(target);cam.updateProjectionMatrix();
}
function renderSplitArena(){
  const size=new THREE.Vector2();renderer.getDrawingBufferSize(size);
  const w=Math.max(1,Math.floor(size.x)),h=Math.max(2,Math.floor(size.y)),lower=Math.floor(h/2),upper=h-lower;
  renderer.setScissorTest(true);
  updateChaseCamera(0,chaseCameras[0],w/lower);renderer.setViewport(0,0,w,lower);renderer.setScissor(0,0,w,lower);_baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],w/upper);renderer.setViewport(0,lower,w,upper);renderer.setScissor(0,lower,w,upper);_baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}
function setCameraMode(mode){
  cameraMode=mode==='arena'?'arena':'top';camera=topCamera;document.body.classList.toggle('split-arena',cameraMode==='arena');
  document.querySelectorAll('.camera-buttons button').forEach(b=>b.classList.toggle('selected',b.dataset.mode===cameraMode));resize();
}
$('#camera-mode')?.addEventListener('click',()=>setCameraMode('top'));
$('#camera-tilt-test')?.addEventListener('click',()=>setCameraMode('arena'));
function resize(){const {w,h}=getLayoutSize();renderer.setSize(w,h,false);updateTopCamera()}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,80));resize();
function loop(now){
  const dt=Math.min(.033,(now-last)/1000);last=now;
  if(hitStop>0)hitStop=Math.max(0,hitStop-dt);else update(dt);
  updateTopCamera();
  if(cameraMode==='arena'&&players.length===2)renderSplitArena();else _baseRender(scene,topCamera);
  requestAnimationFrame(loop);
}
buildArena('square');requestAnimationFrame(loop);
if('serviceWorker' in navigator){addEventListener('load',()=>navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{}));}
