import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const renderer=new THREE.WebGLRenderer({canvas:$('#game'),antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0d1118); scene.fog=new THREE.Fog(0x0d1118,26,44);
const topCamera=new THREE.OrthographicCamera(-11.6,11.6,14.2,-14.2,.1,100); topCamera.position.set(0,34,.01); topCamera.up.set(0,0,-1); topCamera.lookAt(0,0,0);
const arenaCamera=new THREE.PerspectiveCamera(43,1,.1,100);
let camera=topCamera,cameraMode='top';
const cameraTarget=new THREE.Vector3();
scene.add(new THREE.HemisphereLight(0xeaf2ff,0x202534,2.1)); const sun=new THREE.DirectionalLight(0xffffff,2.2); sun.position.set(7,14,8); scene.add(sun);

const ADV='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/main/addons/kaykit_character_pack_adventures/Characters/gltf/';
const SK='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0/main/addons/kaykit_character_pack_skeletons/Characters/gltf/';
const C={
 ranger:{n:'RANGER',hp:100,sp:4.8,cd:.22,dm:20,bs:13,col:0x35a7ff,super:'rapid',model:ADV+'Knight.glb'},
 crusher:{n:'CRUSHER',hp:135,sp:4,cd:.62,dm:13,bs:11.5,pel:5,spr:.26,col:0xff8a3d,super:'blast',model:ADV+'Barbarian.glb'},
 dash:{n:'DASH',hp:82,sp:6.2,cd:.17,dm:13,bs:14.5,col:0x9c6cff,super:'dash',model:ADV+'Rogue_Hooded.glb'},
 mage:{n:'MAGE',hp:88,sp:4.6,cd:.34,dm:24,bs:10.5,col:0x5be0d0,super:'nova',model:ADV+'Mage.glb'},
 rogue:{n:'ROGUE',hp:92,sp:5.7,cd:.19,dm:15,bs:14,col:0xffd45a,super:'fan',model:ADV+'Rogue.glb'},
 skeleton:{n:'BONES',hp:112,sp:4.35,cd:.42,dm:28,bs:11.8,col:0xded6c1,super:'storm',model:SK+'Skeleton_Warrior.glb'}
};

const BODY={
 knight:{base:'ranger',name:'KNIGHT',hp:1,sp:1,r:.58},
 barbarian:{base:'crusher',name:'BARBARIAN',hp:1.16,sp:.88,r:.66},
 rogueHood:{base:'dash',name:'HOODED',hp:.88,sp:1.16,r:.52},
 mage:{base:'mage',name:'MAGE',hp:.94,sp:.98,r:.56},
 rogue:{base:'rogue',name:'ROGUE',hp:.92,sp:1.10,r:.53},
 skeleton:{base:'skeleton',name:'BONES',hp:1.10,sp:.92,r:.62}
};
const WEAPON={
 rifle:{name:'RIFLE',dm:20,cd:.22,bs:13,pel:1,spr:0},
 scatter:{name:'SCATTER',dm:13,cd:.62,bs:11.5,pel:5,spr:.26},
 rapid:{name:'RAPID',dm:13,cd:.17,bs:14.5,pel:1,spr:0},
 arcane:{name:'ARCANE',dm:24,cd:.34,bs:10.5,pel:1,spr:0},
 bladegun:{name:'BLADE GUN',dm:15,cd:.19,bs:14,pel:1,spr:0},
 cannon:{name:'CANNON',dm:28,cd:.42,bs:11.8,pel:1,spr:0}
};
const DEFENSE={roll:{name:'ROLL',cd:2.4},guard:{name:'GUARD',cd:2.2},step:{name:'STEP',cd:1.7},barrier:{name:'BARRIER',cd:6},evade:{name:'EVADE',cd:3.2},parry:{name:'PARRY',cd:.85}};
const PASSIVE={coolant:{name:'COOLANT',cool:.88},stabilizer:{name:'STABILIZER',spread:.65},sprinter:{name:'SPRINTER',speed:1.06},armor:{name:'ARMOR',taken:.92},charger:{name:'CHARGER',super:1.18},coreHunter:{name:'CORE HUNTER',super:1.08}};
const COLORS={cyan:0x35a7ff,orange:0xff8a3d,violet:0x9c6cff,mint:0x5be0d0,gold:0xffd45a,bone:0xded6c1,pink:0xff7ca8,lime:0x8ee35b};
const COST={body:{knight:2,barbarian:3,rogueHood:2,mage:2,rogue:2,skeleton:3},weapon:{rifle:2,scatter:3,rapid:3,arcane:3,bladegun:2,cannon:4},defense:{roll:2,guard:3,step:2,barrier:3,evade:3,parry:4},super:{rapid:2,blast:2,dash:2,nova:3,fan:2,boneStorm:3},passive:{coolant:1,stabilizer:1,sprinter:1,armor:2,charger:2,coreHunter:1}};
const BUILD_LIMIT=10;
function readBuild(i){const card=document.querySelector(`.loadout-card[data-player="${i}"]`);const get=s=>card?.querySelector(`[data-slot="${s}"]`)?.value;return{body:get('body'),weapon:get('weapon'),defense:get('defense'),super:get('super'),color:get('color'),passive:get('passive')}}
function buildCost(b){return (COST.body[b.body]||0)+(COST.weapon[b.weapon]||0)+(COST.defense[b.defense]||0)+(COST.super[b.super]||0)+(COST.passive[b.passive]||0)}
function configFromBuild(b){const bo=BODY[b.body]||BODY.knight,w=WEAPON[b.weapon]||WEAPON.rifle,pa=PASSIVE[b.passive]||PASSIVE.coolant,base=C[bo.base]||C.ranger;return{...base,n:bo.name,hp:Math.round(100*bo.hp),sp:4.8*bo.sp*(pa.speed||1),r:bo.r,dm:w.dm,cd:w.cd*(pa.cool||1),bs:w.bs,pel:w.pel,spr:w.spr*(pa.spread||1),super:b.super,col:COLORS[b.color]||base.col,defense:b.defense,passive:b.passive,taken:pa.taken||1,superGain:pa.super||1,weapon:b.weapon}}
function syncBuildUI(){let ok=true;for(let i=0;i<2;i++){const b=readBuild(i),cost=buildCost(b),card=document.querySelector(`.loadout-card[data-player="${i}"]`),sum=card?.querySelector('.loadout-summary');if(sum)sum.textContent=`${cost}/${BUILD_LIMIT} · ${(BODY[b.body]||BODY.knight).name} / ${(WEAPON[b.weapon]||WEAPON.rifle).name} / ${(DEFENSE[b.defense]||DEFENSE.roll).name}`;card?.classList.toggle('over-budget',cost>BUILD_LIMIT);ok&&=cost<=BUILD_LIMIT;try{localStorage.setItem(`duel-build-${i}`,JSON.stringify(b))}catch{}}const s=document.querySelector('#start');if(s){s.disabled=!ok;s.textContent=ok?'⚔ ENTER THE ARENA ⚔':'BUILD LIMIT OVER'}}
function setBuild(i,b){const card=document.querySelector(`.loadout-card[data-player="${i}"]`);if(!card)return;for(const [k,v] of Object.entries(b)){const el=card.querySelector(`[data-slot="${k}"]`);if(el&&[...el.options].some(o=>o.value===v))el.value=v}syncBuildUI()}
function randomBuild(i){const keys=o=>Object.keys(o);for(let n=0;n<100;n++){const b={body:keys(BODY)[Math.floor(Math.random()*keys(BODY).length)],weapon:keys(WEAPON)[Math.floor(Math.random()*keys(WEAPON).length)],defense:keys(DEFENSE)[Math.floor(Math.random()*keys(DEFENSE).length)],super:keys(COST.super)[Math.floor(Math.random()*keys(COST.super).length)],color:keys(COLORS)[Math.floor(Math.random()*keys(COLORS).length)],passive:keys(PASSIVE)[Math.floor(Math.random()*keys(PASSIVE).length)]};if(buildCost(b)<=BUILD_LIMIT){setBuild(i,b);return}}}

const A={hw:9.5,hh:6.2}; let arena=new THREE.Group(); scene.add(arena); let obs=[], bushes=[];
let select=['ranger','ranger'], arenaType='square', players=[], bullets=[], parts=[], running=false,time=90,last=performance.now(),hitStop=0,shakePower=0,shakeTime=0,koSlow=0,combo=[0,0],comboTimer=[0,0];
const loader=new GLTFLoader(), cache=new Map();
const load=url=>cache.get(url)||cache.set(url,new Promise((ok,no)=>loader.load(url,ok,undefined,no))).get(url);

function clear(g){while(g.children.length){const x=g.children.pop();x.traverse?.(n=>{n.geometry?.dispose?.(); if(n.material&&!Array.isArray(n.material))n.material.dispose?.()})}}
function box(x,z,w,d,h=1.4,col=0x66758e,opt={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.62,metalness:.16}));m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;arena.add(m);obs.push({x,z,hw:w/2,hd:d/2,m,hp:opt.hp||0,breakable:!!opt.hp})}
function cyl(x,z,r,h=1.5){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),new THREE.MeshStandardMaterial({color:0x71819a,roughness:.55,metalness:.22}));m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;arena.add(m);obs.push({x,z,r,circle:true,m})}
function bush(x,z,r=1.15){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0x3f8c56,roughness:1,transparent:true,opacity:.8,depthWrite:false});for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(.42,.95,7),mat.clone()),a=i*Math.PI*2/7;m.position.set(Math.cos(a)*r*.4,.48,Math.sin(a)*r*.4);g.add(m)}g.position.set(x,0,z);arena.add(g);bushes.push({x,z,r})}

const STAGE_THEME={
 square:{floor:0x334b68,edge:0x142437,accent:0x55bfff,glow:0x8edcff,bg:0x09111b},
 pillars:{floor:0x4c4542,edge:0x29231f,accent:0xe8b963,glow:0xffd98f,bg:0x17130f},
 ring:{floor:0x473344,edge:0x281a26,accent:0xff6f9c,glow:0xff9fbd,bg:0x180e16},
 cross:{floor:0x304851,edge:0x162a31,accent:0x50d8d8,glow:0x8affff,bg:0x0b171b},
 hex:{floor:0x312a50,edge:0x1b1532,accent:0xa174ff,glow:0xc3a4ff,bg:0x100b1f},
 fort:{floor:0x5b4d40,edge:0x30261d,accent:0xd8b17e,glow:0xffd49c,bg:0x17120d},
 bush:{floor:0x36563d,edge:0x1d3022,accent:0x6ddd88,glow:0xa0ffb1,bg:0x0b160e},
 crates:{floor:0x504238,edge:0x2c211a,accent:0xffa45b,glow:0xffc078,bg:0x17110d}
};
function theme(t){return STAGE_THEME[t]||STAGE_THEME.square}
function paint(x,z,w,d,c,op=.5){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.012,z);arena.add(m)}
function glowRing(x,z,r,c,op=.45){const m=new THREE.Mesh(new THREE.RingGeometry(r*.72,r,36),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:op,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,.025,z);arena.add(m)}
function perimeter(th){
 const mat=new THREE.MeshStandardMaterial({color:th.edge,roughness:.82,metalness:.18});
 [[0,-6.65,19.8,.55],[0,6.65,19.8,.55],[-9.8,0,.55,12.8],[9.8,0,.55,12.8]].forEach(v=>{const m=new THREE.Mesh(new THREE.BoxGeometry(v[2],.48,v[3]),mat);m.position.set(v[0],.2,v[1]);m.castShadow=true;m.receiveShadow=true;arena.add(m)});
 [[-9.2,-6.05],[9.2,-6.05],[-9.2,6.05],[9.2,6.05]].forEach(([x,z])=>{const b=new THREE.Mesh(new THREE.CylinderGeometry(.22,.3,1.6,10),new THREE.MeshStandardMaterial({color:th.accent,emissive:th.glow,emissiveIntensity:.75,roughness:.25}));b.position.set(x,.8,z);arena.add(b);const l=new THREE.PointLight(th.glow,.7,7,2);l.position.set(x,2,z);arena.add(l)});
}
function stageMarks(t,th){
 paint(-8.4,0,.16,11.2,th.accent,.35);paint(8.4,0,.16,11.2,th.accent,.35);
 glowRing(-4.5,0,1.15,0x74d5ff,.5);glowRing(4.5,0,1.15,0xff7b92,.5);
 if(t==='ring'){glowRing(0,0,3.3,th.accent,.7);glowRing(0,0,4.8,th.glow,.28)}
 else if(t==='cross'){paint(0,0,8.5,.7,th.accent,.65);paint(0,0,.7,8.5,th.accent,.65)}
 else if(t==='hex'){const h=new THREE.Mesh(new THREE.RingGeometry(2.8,3.2,6),new THREE.MeshBasicMaterial({color:th.accent,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.rotation.z=Math.PI/6;h.position.y=.02;arena.add(h)}
 else {glowRing(0,0,2.15,th.accent,.24)}
}

function build(t){clear(arena);obs=[];bushes=[];const th=theme(t);scene.background.setHex(th.bg);scene.fog.color.setHex(th.bg);const under=new THREE.Mesh(new THREE.BoxGeometry(21,.75,14.2),new THREE.MeshStandardMaterial({color:th.edge,roughness:.9}));under.position.y=-.55;under.receiveShadow=true;arena.add(under);const f=new THREE.Mesh(new THREE.BoxGeometry(19,.5,12.4),new THREE.MeshStandardMaterial({color:th.floor,roughness:.72,metalness:.08}));f.position.y=-.28;f.receiveShadow=true;arena.add(f);const grid=new THREE.GridHelper(19,19,th.accent,0x40546b);grid.material.opacity=.28;grid.material.transparent=true;grid.position.y=-.015;arena.add(grid);perimeter(th);stageMarks(t,th);
 if(t==='square')[-3,3].forEach(x=>[-1.7,1.7].forEach(z=>box(x,z,1.4,1.4)));
 if(t==='pillars')[-3,3].forEach(x=>[-2,2].forEach(z=>cyl(x,z,.75)));
 if(t==='ring'){cyl(0,0,2,1.35);box(-6,0,1,3.4);box(6,0,1,3.4)}
 if(t==='cross'){box(0,0,1.15,4.5);box(0,0,4.5,1.15)}
 if(t==='hex')for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(Math.sin(a)*3.2,Math.cos(a)*3.2,.55)}
 if(t==='fort'){box(-3.8,2.2,3,.75);box(3.8,-2.2,3,.75);box(-5,1.2,.75,2.7);box(5,-1.2,.75,2.7);box(-1.5,0,.8,2);box(1.5,0,.8,2)}
 if(t==='bush'){box(-4.2,0,.8,2.7);box(4.2,0,.8,2.7);[[-2,-1.7],[2,1.7],[-2,1.7],[2,-1.7],[0,0]].forEach(v=>bush(...v))}
 if(t==='crates')[[-3,-1.8],[3,1.8],[3,-1.8],[-3,1.8],[0,0],[-6,0],[6,0]].forEach((v,i)=>box(v[0],v[1],1.15,1.15,1,0xb17b45,{hp:i===4?70:45}));
}
function blocked(pos,r=.58){if(Math.abs(pos.x)>A.hw-r||Math.abs(pos.z)>A.hh-r)return true;return obs.some(o=>o.circle?((pos.x-o.x)**2+(pos.z-o.z)**2<(o.r+r)**2):(Math.abs(pos.x-o.x)<o.hw+r&&Math.abs(pos.z-o.z)<o.hd+r))}
function hitObs(pos,r=.13){return obs.find(o=>o.circle?((pos.x-o.x)**2+(pos.z-o.z)**2<(o.r+r)**2):(Math.abs(pos.x-o.x)<o.hw+r&&Math.abs(pos.z-o.z)<o.hd+r))}

async function realModel(p){try{$('#asset-status').textContent='Loading CC0 3D characters…';const g=await load(p.cfg.model);if(!p.root.parent)return;const m=cloneSkeleton(g.scene);m.scale.setScalar(.72);m.rotation.y=Math.PI;m.position.y=.03;p.primitive.visible=false;p.host.add(m);p.mix=new THREE.AnimationMixer(m);const clips=g.animations,idle=clips.find(x=>x.name.toLowerCase().includes('idle'))||clips[0],walk=clips.find(x=>/walk|run/i.test(x.name));if(idle){p.idle=p.mix.clipAction(idle);p.idle.play()}if(walk){p.walk=p.mix.clipAction(walk);p.walk.play();p.walk.enabled=false}$('#asset-status').textContent='KayKit CC0 characters enabled'}catch(e){console.warn(e);$('#asset-status').textContent='3D model fallback active'}}
function player(i,key,cfgOverride=null,buildInfo=null){const cfg=cfgOverride||C[key],root=new THREE.Group(),primitive=new THREE.Group(),host=new THREE.Group();root.add(primitive,host);const shadow=new THREE.Mesh(new THREE.CircleGeometry(.72,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.3,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.015;root.add(shadow);const body=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.72,5,10),new THREE.MeshStandardMaterial({color:cfg.col}));body.position.y=.88;primitive.add(body);const head=new THREE.Mesh(new THREE.SphereGeometry(.42,14,10),new THREE.MeshStandardMaterial({color:0xf1c6a5}));head.position.y=1.66;primitive.add(head);const gun=new THREE.Mesh(new THREE.BoxGeometry(.26,.24,key==='crusher'?1:1.25),new THREE.MeshStandardMaterial({color:0x202735,metalness:.25}));gun.position.set(0,1.05,-.62);root.add(gun);root.position.set(i?4.5:-4.5,0,0);scene.add(root);const p={i,key,cfg,build:buildInfo,root,primitive,host,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(i?-1:1,0),r:cfg.r||.58,mix:null,defCd:0,guardTime:0,barrier:0,parryTime:0};realModel(p);return p}


const aimGuides=[];
function makeAimGuide(i){
  const c=i?0xff8c72:0x74d5ff;
  const mat=new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.72,depthTest:false});
  const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3()]);
  const line=new THREE.Line(geo,mat);line.renderOrder=20;line.visible=false;scene.add(line);aimGuides[i]=line;return line;
}
makeAimGuide(0);makeAimGuide(1);
function updateAimGuides(){
  players.forEach((p,i)=>{
    const line=aimGuides[i];if(!line)return;
    const active=running&&p?.alive&&p.aim.lengthSq()>.12;
    line.visible=!!active;if(!active)return;
    const dir=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize();
    const a=p.root.position.clone();a.y=.08;
    const b=a.clone().addScaledVector(dir,4.2);b.y=.08;
    line.geometry.setFromPoints([a,b]);
  });
}
function setCameraMode(mode){
  cameraMode=mode==='arena'?'arena':'top';
  camera=cameraMode==='arena'?arenaCamera:topCamera;
  document.querySelector('#camera-mode')?.classList.toggle('selected',cameraMode==='top');
  document.querySelector('#camera-tilt-test')?.classList.toggle('selected',cameraMode==='arena');
}
function updateSharedCamera(dt){
  if(cameraMode!=='arena'||players.length<2||!players[0]?.root||!players[1]?.root)return;
  const a=players[0].root.position,b=players[1].root.position;
  const mid=new THREE.Vector3((a.x+b.x)/2,0,(a.z+b.z)/2);
  cameraTarget.lerp(mid,1-Math.pow(.001,dt));
  const dist=Math.hypot(a.x-b.x,a.z-b.z);
  const height=THREE.MathUtils.clamp(10.8+dist*.34,11.6,16.6);
  const back=THREE.MathUtils.clamp(9.8+dist*.24,10.2,13.8);
  const desired=new THREE.Vector3(cameraTarget.x,height,cameraTarget.z+back);
  arenaCamera.position.lerp(desired,1-Math.pow(.002,dt));
  arenaCamera.lookAt(cameraTarget.x,.15,cameraTarget.z);
}


function defenseMove(i){const p=players[i];if(!running||!p?.alive||p.defCd>0)return;const d=p.cfg.defense||'roll',meta=DEFENSE[d]||DEFENSE.roll;p.defCd=meta.cd;const vec=(p.move.lengthSq()>.08?p.move:p.aim).clone();if(vec.lengthSq()<.05)vec.set(i?-1:1,0);vec.normalize();const dash=(dist,inv)=>{for(let k=0;k<6;k++){const q=p.root.position.clone();q.x+=vec.x*dist/6;q.z+=vec.y*dist/6;if(!blocked(q,p.r))p.root.position.copy(q)}p.inv=Math.max(p.inv,inv)};if(d==='roll'){dash(2.5,.26);sparkBurst(p.root.position.clone().setY(.35),p.cfg.col,10,.7)}else if(d==='step'){dash(2.0,.17);sparkBurst(p.root.position.clone().setY(.3),p.cfg.col,8,.65)}else if(d==='evade'){dash(2.2,.38);sparkBurst(p.root.position.clone().setY(.35),p.cfg.col,12,.8)}else if(d==='guard'){p.guardTime=.75;impactRing(p.root.position.clone(),p.cfg.col,1.5)}else if(d==='barrier'){p.barrier=55;impactRing(p.root.position.clone(),0x82ddff,2.0)}else if(d==='parry'){p.parryTime=.20;impactRing(p.root.position.clone(),0xffffff,1.7)}tone(210,.07,'square',.025,90);addShake(.08,.08)}

let audio=null, realBgm=null;const bgm={normal:'./assets/audio/bgm/01_empacotatron_loop.ogg',sudden:'./assets/audio/bgm/02_trance_boss_battle.ogg',space:'./assets/audio/bgm/03_space_boss_battle.ogg'};
function ac(){return audio||(audio=new (window.AudioContext||window.webkitAudioContext)())}
function tone(f,d=.06,type='square',g=.025,slide=0){try{const c=ac(),o=c.createOscillator(),v=c.createGain();o.type=type;o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),c.currentTime+d);v.gain.setValueAtTime(g,c.currentTime);v.gain.exponentialRampToValueAtTime(.0001,c.currentTime+d);o.connect(v);v.connect(c.destination);o.start();o.stop(c.currentTime+d)}catch{}}
function playBgm(mode='normal'){stopBgm();const a=new Audio(bgm[mode]||bgm.normal);a.loop=true;a.volume=.28;a.play().then(()=>realBgm=a).catch(()=>{});}
function stopBgm(){if(realBgm){realBgm.pause();realBgm=null}}
function burst(pos,col=0xffffff,n=10){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,5,5),new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.copy(pos);scene.add(m);parts.push({m,v:new THREE.Vector3((Math.random()-.5)*4,Math.random()*2.5,(Math.random()-.5)*4),life:.3})}}
function sparkBurst(pos,col=0xffffff,n=14,power=1){
 for(let i=0;i<n;i++){const g=i%3===0?new THREE.BoxGeometry(.035,.035,.28):new THREE.SphereGeometry(.055,5,5);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.copy(pos);scene.add(m);const a=Math.random()*Math.PI*2,s=(2.2+Math.random()*4.3)*power;m.rotation.y=a;parts.push({m,v:new THREE.Vector3(Math.cos(a)*s,(1.2+Math.random()*3)*power,Math.sin(a)*s),life:.22+Math.random()*.18})}
}
function impactRing(pos,col=0xffffff,scale=1){const m=new THREE.Mesh(new THREE.RingGeometry(.18,.28,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.copy(pos);m.position.y=.12;scene.add(m);parts.push({m,v:new THREE.Vector3(),life:.22,ring:true,scale})}
function addShake(power=.18,dur=.12){shakePower=Math.max(shakePower,power);shakeTime=Math.max(shakeTime,dur)}
function screenFlash(kind='hit'){let el=document.getElementById('combat-flash');if(!el){el=document.createElement('div');el.id='combat-flash';document.body.appendChild(el)}el.className='';void el.offsetWidth;el.className=kind;}
function damagePop(world,dm,attacker){const v=world.clone().project(camera);const el=document.createElement('div');el.className='combat-damage '+(dm>=26?'heavy':'');el.textContent='-'+Math.round(dm);el.style.left=((v.x*.5+.5)*innerWidth)+'px';el.style.top=((-v.y*.5+.5)*innerHeight)+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),620);combo[attacker]++;comboTimer[attacker]=.8;if(combo[attacker]>=2){const c=document.createElement('div');c.className='combo-pop';c.textContent=combo[attacker]+' HIT!';c.style.left=attacker?'68%':'32%';document.body.appendChild(c);setTimeout(()=>c.remove(),430)}}
function flashPlayer(p){p.root.traverse(n=>{if(!n.material)return;const mats=Array.isArray(n.material)?n.material:[n.material];mats.forEach(mat=>{if(!mat.color)return;const old=mat.color.getHex();mat.color.setHex(0xffffff);setTimeout(()=>{try{mat.color.setHex(old)}catch{}},70)})})}
function lowHpPulse(){players.forEach((p,i)=>{const el=document.querySelector(`.hud.player.${i?'two':'one'}`);if(el)el.classList.toggle('low-hp',p.alive&&p.hp/p.max<=.3)})}

function spawn(owner,dir,dm,sp){const p=players[owner],m=new THREE.Mesh(new THREE.SphereGeometry(.115,7,7),new THREE.MeshBasicMaterial({color:owner?0xff7b92:0x74d5ff}));m.position.copy(p.root.position).addScaledVector(dir,.95);m.position.y=.82;scene.add(m);bullets.push({m,v:dir.clone().multiplyScalar(sp),owner,life:1.45,dm})}
function shoot(i){const p=players[i];if(!running||!p?.alive||p.cd>0||p.aim.lengthSq()<.1)return;p.cd=p.cfg.cd;const base=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize(),n=p.cfg.pel||1;for(let k=0;k<n;k++){const a=n===1?0:THREE.MathUtils.lerp(-p.cfg.spr,p.cfg.spr,k/(n-1));spawn(i,base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),a),p.cfg.dm,p.cfg.bs)}tone(p.key==='crusher'?100:180,.05,'square',.02,60)}
function superMove(i){const p=players[i];if(!running||p.sup<100)return;p.sup=0;const dir=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize();if(p.cfg.super==='rapid')for(let k=0;k<10;k++)setTimeout(()=>{p.cd=0;shoot(i)},k*75);if(p.cfg.super==='blast'||p.cfg.super==='nova'||p.cfg.super==='storm'){const n=p.cfg.super==='storm'?14:18;for(let k=0;k<n;k++){const a=k*Math.PI*2/n;spawn(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),18,10)}if(p.cfg.super==='nova')p.hp=Math.min(p.max,p.hp+20)}if(p.cfg.super==='dash'){for(let k=0;k<10;k++){const q=p.root.position.clone().addScaledVector(dir,.7);if(!blocked(q,p.r))p.root.position.copy(q)}p.inv=.45}if(p.cfg.super==='fan')for(let k=-4;k<=4;k++)spawn(i,dir.clone().applyAxisAngle(new THREE.Vector3(0,1,0),k*.12),19,14.5);tone(280,.12,'sine',.055,520);addShake(.32,.22);screenFlash('super');impactRing(p.root.position.clone(),p.cfg.col,1.8);sparkBurst(p.root.position.clone().setY(.9),p.cfg.col,24,1.25);hitStop=Math.max(hitStop,.055);banner('SUPER!',520)}
function damage(v,dm,a){const p=players[v];if(!p.alive||p.inv>0)return;const hitPos=p.root.position.clone().setY(.9);if(p.parryTime>0){p.parryTime=0;p.defCd=0;hitStop=Math.max(hitStop,.075);addShake(.32,.16);sparkBurst(hitPos,0xffffff,22,1.15);banner('PARRY!',420);players[v].sup=Math.min(100,players[v].sup+16);return}if(p.guardTime>0)dm*=.28;if(p.barrier>0){const absorb=Math.min(p.barrier,dm);p.barrier-=absorb;dm-=absorb;sparkBurst(hitPos,0x82ddff,10,.7);if(dm<=.01)return}dm*=p.cfg.taken||1;p.hp=Math.max(0,p.hp-dm);players[a].sup=Math.min(100,players[a].sup+dm*.9*(players[a].cfg.superGain||1));p.sup=Math.min(100,p.sup+dm*.35*(p.cfg.superGain||1));const heavy=dm>=25;hitStop=Math.max(hitStop,heavy?.065:.038);addShake(heavy?.28:.13,heavy?.16:.09);tone(heavy?72:92,heavy?.095:.06,'sawtooth',heavy?.05:.03,-35);sparkBurst(hitPos,players[a]?.cfg?.col||0xffffff,heavy?20:11,heavy?1.25:.85);impactRing(hitPos,players[a]?.cfg?.col||0xffffff,heavy?1.5:1);damagePop(hitPos,dm,a);flashPlayer(p);screenFlash(heavy?'heavy':'hit');const atk=players[a];if(atk){const dx=p.root.position.x-atk.root.position.x,dz=p.root.position.z-atk.root.position.z,len=Math.hypot(dx,dz)||1,k=heavy?.42:.22;const q=p.root.position.clone();q.x+=dx/len*k;q.z+=dz/len*k;if(!blocked(q,p.r))p.root.position.copy(q)}if(navigator.vibrate)navigator.vibrate(heavy?[22,18,26]:14);if(p.hp<=0)ko(v,a)}
function ko(v,a){const p=players[v],pos=p.root.position.clone().setY(.9);p.alive=false;p.root.visible=false;players[a].score++;koSlow=.22;hitStop=Math.max(hitStop,.105);addShake(.58,.38);sparkBurst(pos,p.cfg.col,42,1.7);impactRing(pos,p.cfg.col,2.6);burst(pos,p.cfg.col,28);screenFlash('ko');tone(138,.22,'sawtooth',.075,-115);if(navigator.vibrate)navigator.vibrate([35,25,55]);banner('K.O!',850);hud();if(players[a].score>=3)setTimeout(()=>finish(a),850);else setTimeout(()=>reset(v),1150)}
function reset(i){const p=players[i];p.hp=p.max;p.alive=true;p.inv=1.15;p.root.visible=true;p.root.position.set(i?4.5:-4.5,0,0)}
function banner(t,ms=650){const b=$('#banner');b.textContent=t;b.classList.add('show');setTimeout(()=>b.classList.remove('show'),ms)}
function hud(){players.forEach((p,i)=>{$(`#p${i+1}-name`).textContent=p.cfg.n;$(`#p${i+1}-hp`).style.width=`${100*p.hp/p.max}%`;$(`#p${i+1}-super`).style.width=`${p.sup}%`;$(`#p${i+1}-score`).textContent=[0,1,2].map(n=>n<p.score?'●':'○').join(' ');$(`.super-btn[data-player="${i}"]`).classList.toggle('ready',p.sup>=100)})}
function finish(w){running=false;stopBgm();$('#winner').textContent=`P${w+1} WIN!`;$('#result-score').textContent=`${players[0].score} - ${players[1].score}`;$('#result').hidden=false}
function start(){players.forEach(p=>scene.remove(p.root));bullets.forEach(b=>scene.remove(b.m));parts.forEach(x=>scene.remove(x.m));bullets=[];parts=[];build(arenaType);const b0=readBuild(0),b1=readBuild(1);const c0=configFromBuild(b0),c1=configFromBuild(b1);players=[player(0,(BODY[b0.body]||BODY.knight).base,c0,b0),player(1,(BODY[b1.body]||BODY.knight).base,c1,b1)];time=90;running=true;$('#menu').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;$('#result').hidden=true;playBgm(arenaType==='hex'?'space':'normal');hud();banner('FIGHT!',900)}

$$('.char-buttons').forEach(g=>g.onclick=e=>{const b=e.target.closest('button[data-char]');if(!b)return;const i=+g.dataset.player;select[i]=b.dataset.char;$$(`.char-buttons[data-player="${i}"] button`).forEach(x=>x.classList.toggle('selected',x===b))});
$('.arena-buttons').onclick=e=>{const b=e.target.closest('button[data-arena]');if(!b)return;arenaType=b.dataset.arena;$$('.arena-buttons button').forEach(x=>x.classList.toggle('selected',x===b))};
$('#camera-mode').onclick=()=>setCameraMode('top');$('#camera-tilt-test').onclick=()=>setCameraMode('arena');setCameraMode('top');
$$('.loadout-card select').forEach(s=>s.addEventListener('change',syncBuildUI));$$('.random-build').forEach(b=>b.onclick=()=>randomBuild(+b.dataset.player));for(let i=0;i<2;i++){try{const saved=JSON.parse(localStorage.getItem(`duel-build-${i}`)||'null');if(saved)setBuild(i,saved)}catch{}}if(buildCost(readBuild(1))>BUILD_LIMIT)setBuild(1,{body:'barbarian',weapon:'bladegun',defense:'roll',super:'blast',color:'orange',passive:'coolant'});syncBuildUI();$('#start').onclick=()=>{if($('#start').disabled)return;ac().resume?.();start()};$('#rematch').onclick=start;$('#back-menu').onclick=()=>{running=false;stopBgm();$('#result').hidden=true;$('#hud').hidden=true;$('#controls').hidden=true;$('#menu').hidden=false};$$('.def-btn').forEach(b=>b.onpointerdown=e=>{e.preventDefault();defenseMove(+b.dataset.player)});$$('.super-btn').forEach(b=>b.onpointerdown=e=>{e.preventDefault();superMove(+b.dataset.player)});

const ptr=new Map();$$('.stick-zone').forEach(z=>{const knob=z.querySelector('i'),base=z.querySelector('.stick'),pi=+z.dataset.player,kind=z.dataset.kind;const apply=e=>{if(!players[pi])return;const r=base.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`;if(kind==='aim'&&mag>max*.35)shoot(pi)};z.onpointerdown=e=>{e.preventDefault();z.setPointerCapture(e.pointerId);ptr.set(e.pointerId,1);apply(e)};z.onpointermove=e=>ptr.has(e.pointerId)&&apply(e);const end=e=>{ptr.delete(e.pointerId);knob.style.transform='translate(-50%,-50%)';if(players[pi]){if(kind==='move')players[pi].move.set(0,0);else players[pi].aim.set(0,0)}};z.onpointerup=end;z.onpointercancel=end});

function update(dt){if(!running)return;time=Math.max(0,time-dt);if(time<=0){if(players[0].score!==players[1].score)finish(players[0].score>players[1].score?0:1);else{time=30;playBgm('sudden');banner('SUDDEN DEATH!',1000)}}players.forEach(p=>{p.cd=Math.max(0,p.cd-dt);p.inv=Math.max(0,p.inv-dt);p.defCd=Math.max(0,(p.defCd||0)-dt);p.guardTime=Math.max(0,(p.guardTime||0)-dt);p.parryTime=Math.max(0,(p.parryTime||0)-dt);const db=document.querySelector(`.def-btn[data-player="${p.i}"]`);if(db){db.textContent=p.defCd>0?p.defCd.toFixed(1):'DEF';db.classList.toggle('ready',p.defCd<=0)}if(!p.alive)return;const m=p.move.clone();if(m.lengthSq()>1)m.normalize();const q=p.root.position.clone();q.x+=m.x*p.cfg.sp*dt;q.z+=m.y*p.cfg.sp*dt;if(!blocked(q,p.r))p.root.position.copy(q);if(p.aim.lengthSq()>.1)p.root.rotation.y=Math.atan2(p.aim.x,p.aim.y)+Math.PI;if(p.mix){const moving=p.move.lengthSq()>.08;if(p.walk){p.walk.enabled=moving;p.walk.setEffectiveWeight(moving?1:0)}if(p.idle){p.idle.enabled=!moving;p.idle.setEffectiveWeight(moving?0:1)}p.mix.update(dt)}p.root.visible=p.inv>0?Math.floor(p.inv*12)%2===0:true});for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.life-=dt;b.m.position.addScaledVector(b.v,dt);let rm=b.life<=0;const o=!rm&&hitObs(b.m.position);if(o){if(o.breakable){o.hp-=b.dm;burst(b.m.position.clone(),0xd6a05d,6);if(o.hp<=0){arena.remove(o.m);obs=obs.filter(x=>x!==o);burst(b.m.position.clone(),0xc58b4a,16)}}rm=true}else if(!rm&&(Math.abs(b.m.position.x)>A.hw||Math.abs(b.m.position.z)>A.hh))rm=true;if(!rm){const e=players[1-b.owner];const dx=b.m.position.x-e.root.position.x,dz=b.m.position.z-e.root.position.z;if(e.alive&&dx*dx+dz*dz<(e.r+.16)**2)damage(1-b.owner,b.dm,b.owner),rm=true}if(rm){scene.remove(b.m);bullets.splice(i,1)}}for(let i=parts.length-1;i>=0;i--){const x=parts[i];x.life-=dt;if(x.ring){const s=(1.25-x.life/.22)*x.scale+1;x.m.scale.setScalar(Math.max(1,s))}else{x.m.position.addScaledVector(x.v,dt);x.v.y-=6*dt}x.m.material.opacity=Math.max(0,x.life/.3);if(x.life<=0){scene.remove(x.m);parts.splice(i,1)}}for(let i=0;i<2;i++){comboTimer[i]=Math.max(0,comboTimer[i]-dt);if(comboTimer[i]===0)combo[i]=0}lowHpPulse();hud();$('#timer').textContent=Math.ceil(time)}
function resize(){renderer.setSize(innerWidth,innerHeight,false);const portrait=innerHeight>=innerWidth;const aspect=portrait?Math.max(.78,(innerWidth/innerHeight)*1.55):innerWidth/innerHeight;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}topCamera.left=-hw;topCamera.right=hw;topCamera.top=hh;topCamera.bottom=-hh;topCamera.updateProjectionMatrix();arenaCamera.aspect=innerWidth/Math.max(1,innerHeight);arenaCamera.updateProjectionMatrix()}addEventListener('resize',resize);resize();
function loop(now){const rawDt=Math.min(.033,(now-last)/1000);last=now;let gameDt=rawDt;if(koSlow>0){koSlow=Math.max(0,koSlow-rawDt);gameDt*=.22}if(hitStop>0){hitStop=Math.max(0,hitStop-rawDt);gameDt=0}else update(gameDt);updateAimGuides();updateSharedCamera(rawDt);shakeTime=Math.max(0,shakeTime-rawDt);const saved=camera.position.clone();if(shakeTime>0&&shakePower>0){const f=shakeTime/.38,amp=shakePower*Math.min(1,f*2.5);camera.position.x+=(Math.random()-.5)*amp;camera.position.y+=(Math.random()-.5)*amp*.55;camera.position.z+=(Math.random()-.5)*amp}renderer.render(scene,camera);camera.position.copy(saved);if(shakeTime<=0)shakePower=0;requestAnimationFrame(loop)}build('square');requestAnimationFrame(loop);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn));
