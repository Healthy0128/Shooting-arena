from pathlib import Path
import re

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

# Version
html=html.replace('Duel Arena v6.7.6','Duel Arena v6.7.7')
html=html.replace('<strong>v6.7.6</strong><span>ASSET FOUNDATION</span>','<strong>v6.7.7</strong><span>ARSENAL & MATCH INTRO</span>')

# Runtime state
js=js.replace("let select=['ranger','ranger'], arenaType='square', players=[], bullets=[], parts=[], running=false,time=90,last=performance.now(),hitStop=0,shakePower=0,shakeTime=0,koSlow=0,combo=[0,0],comboTimer=[0,0];",
"let select=['ranger','ranger'], arenaType='square', players=[], bullets=[], parts=[], running=false,matchReady=false,matchToken=0,time=90,last=performance.now(),hitStop=0,shakePower=0,shakeTime=0,koSlow=0,combo=[0,0],comboTimer=[0,0];")

anchor="const loader=new GLTFLoader(), cache=new Map();\nconst load=url=>cache.get(url)||cache.set(url,new Promise((ok,no)=>loader.load(url,ok,undefined,no))).get(url);"
insert="""const loader=new GLTFLoader(), cache=new Map();
const load=url=>cache.get(url)||cache.set(url,new Promise((ok,no)=>loader.load(url,ok,undefined,no))).get(url);
const WEAPON_MODELS={
 rifle:'./assets/models/weapons/spear_A.gltf',
 scatter:'./assets/models/weapons/hammer_D.gltf',
 rapid:'./assets/models/weapons/dagger_A.gltf',
 arcane:'./assets/models/weapons/staff_A.gltf',
 bladegun:'./assets/models/weapons/sword_A.gltf',
 cannon:'./assets/models/weapons/axe_D.gltf'
};
const WEAPON_VIS={
 rifle:{scale:.50,col:0x75c8ff,kick:.09},scatter:{scale:.44,col:0xffad63,kick:.17},rapid:{scale:.56,col:0xb18cff,kick:.055},
 arcane:{scale:.48,col:0x67f0dc,kick:.08},bladegun:{scale:.50,col:0xffdf68,kick:.07},cannon:{scale:.46,col:0xf3e7c6,kick:.21}
};
async function equipWeapon(p){
 const key=p.cfg.weapon||'rifle',url=WEAPON_MODELS[key];if(!url)return;
 try{const g=await load(url);if(!p.root.parent)return;const w=g.scene.clone(true),meta=WEAPON_VIS[key]||WEAPON_VIS.rifle;
  w.scale.setScalar(meta.scale);w.rotation.set(Math.PI/2,0,0);w.position.set(.34,1.08,-.55);w.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});
  p.weaponHost.add(w);p.weaponModel=w;p.gun.visible=false;
 }catch(e){console.warn('weapon model fallback',key,e)}
}
function muzzleFlash(p,dir){const meta=WEAPON_VIS[p.cfg.weapon||'rifle']||WEAPON_VIS.rifle;const pos=p.root.position.clone().addScaledVector(dir,.9);pos.y=.9;
 const m=new THREE.Mesh(new THREE.SphereGeometry(.12,7,7),new THREE.MeshBasicMaterial({color:meta.col,transparent:true,opacity:.95}));m.position.copy(pos);scene.add(m);parts.push({m,v:new THREE.Vector3(),life:.08,ring:true,scale:.65});
 sparkBurst(pos,meta.col,p.cfg.weapon==='scatter'?8:4,p.cfg.weapon==='cannon'?1.15:.65);addShake(meta.kick*.35,.05);p.weaponKick=Math.max(p.weaponKick||0,meta.kick);
}
function projectileMesh(key,owner){const c=owner?0xff7b92:0x74d5ff;let g;
 if(key==='scatter')g=new THREE.SphereGeometry(.095,6,6);else if(key==='rapid')g=new THREE.BoxGeometry(.09,.09,.34);else if(key==='arcane')g=new THREE.IcosahedronGeometry(.16,0);else if(key==='bladegun')g=new THREE.BoxGeometry(.08,.06,.42);else if(key==='cannon')g=new THREE.SphereGeometry(.22,8,8);else g=new THREE.SphereGeometry(.12,7,7);
 return new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:c}));}
const voice={three:'./assets/audio/voice/count_3.ogg',two:'./assets/audio/voice/count_2.ogg',one:'./assets/audio/voice/count_1.ogg',go:'./assets/audio/voice/go.ogg'};
function playVoice(key){try{const a=new Audio(voice[key]);a.volume=.72;a.play().catch(()=>tone(key==='go'?520:240,.12,'square',.04,key==='go'?240:0))}catch{}}
function delay(ms){return new Promise(r=>setTimeout(r,ms))}
async function runCountdown(token){matchReady=false;for(const [label,key] of [['3','three'],['2','two'],['1','one'],['GO!','go']]){if(token!==matchToken||!running)return;banner(label,760);playVoice(key);if(key==='go'){screenFlash('super');addShake(.16,.12)}await delay(key==='go'?420:760)}if(token===matchToken&&running)matchReady=true;}
"""
if anchor not in js: raise SystemExit('loader anchor not found')
js=js.replace(anchor,insert,1)

# Player: add weapon host and refs
old="function player(i,key,cfgOverride=null,buildInfo=null){const cfg=cfgOverride||C[key],root=new THREE.Group(),primitive=new THREE.Group(),host=new THREE.Group();root.add(primitive,host);"
new="function player(i,key,cfgOverride=null,buildInfo=null){const cfg=cfgOverride||C[key],root=new THREE.Group(),primitive=new THREE.Group(),host=new THREE.Group(),weaponHost=new THREE.Group();root.add(primitive,host,weaponHost);"
if old not in js: raise SystemExit('player head not found')
js=js.replace(old,new,1)
old="const p={i,key,cfg,build:buildInfo,root,primitive,host,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(i?-1:1,0),r:cfg.r||.58,mix:null,defCd:0,guardTime:0,barrier:0,parryTime:0};realModel(p);return p}"
new="const p={i,key,cfg,build:buildInfo,root,primitive,host,weaponHost,gun,weaponModel:null,weaponKick:0,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(i?-1:1,0),r:cfg.r||.58,mix:null,defCd:0,guardTime:0,barrier:0,parryTime:0};realModel(p);equipWeapon(p);return p}"
if old not in js: raise SystemExit('player object not found')
js=js.replace(old,new,1)

# Gate player actions during countdown
js=js.replace("if(!running||!p?.alive||p.defCd>0)return;","if(!running||!matchReady||!p?.alive||p.defCd>0)return;",1)
js=js.replace("if(!running||!p?.alive||p.cd>0||p.aim.lengthSq()<.1)return;","if(!running||!matchReady||!p?.alive||p.cd>0||p.aim.lengthSq()<.1)return;",1)
js=js.replace("if(!running||p.sup<100)return;","if(!running||!matchReady||p.sup<100)return;",1)

# Projectile visuals + muzzle flash
old="function spawn(owner,dir,dm,sp){const p=players[owner],m=new THREE.Mesh(new THREE.SphereGeometry(.115,7,7),new THREE.MeshBasicMaterial({color:owner?0xff7b92:0x74d5ff}));m.position.copy(p.root.position).addScaledVector(dir,.95);m.position.y=.82;scene.add(m);bullets.push({m,v:dir.clone().multiplyScalar(sp),owner,life:1.45,dm})}"
new="function spawn(owner,dir,dm,sp){const p=players[owner],key=p.cfg.weapon||'rifle',m=projectileMesh(key,owner);m.position.copy(p.root.position).addScaledVector(dir,.95);m.position.y=.82;m.rotation.y=Math.atan2(dir.x,dir.z);scene.add(m);bullets.push({m,v:dir.clone().multiplyScalar(sp),owner,life:key==='cannon'?1.65:1.45,dm,key})}"
if old not in js: raise SystemExit('spawn not found')
js=js.replace(old,new,1)
old="function shoot(i){const p=players[i];if(!running||!matchReady||!p?.alive||p.cd>0||p.aim.lengthSq()<.1)return;p.cd=p.cfg.cd;const base=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize(),n=p.cfg.pel||1;for(let k=0;k<n;k++){const a=n===1?0:THREE.MathUtils.lerp(-p.cfg.spr,p.cfg.spr,k/(n-1));spawn(i,base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),a),p.cfg.dm,p.cfg.bs)}tone(p.key==='crusher'?100:180,.05,'square',.02,60)}"
new="function shoot(i){const p=players[i];if(!running||!matchReady||!p?.alive||p.cd>0||p.aim.lengthSq()<.1)return;p.cd=p.cfg.cd;const base=new THREE.Vector3(p.aim.x,0,p.aim.y).normalize(),n=p.cfg.pel||1;muzzleFlash(p,base);for(let k=0;k<n;k++){const a=n===1?0:THREE.MathUtils.lerp(-p.cfg.spr,p.cfg.spr,k/(n-1));spawn(i,base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),a),p.cfg.dm,p.cfg.bs)}const w=p.cfg.weapon||'rifle';tone(w==='cannon'?82:w==='scatter'?110:w==='arcane'?310:w==='rapid'?215:175,w==='cannon'?.09:.05,w==='arcane'?'sine':'square',w==='cannon'?.035:.02,w==='arcane'?260:60)}"
if old not in js: raise SystemExit('shoot not found')
js=js.replace(old,new,1)

# Start countdown instead of instant FIGHT
old="function start(){players.forEach(p=>scene.remove(p.root));bullets.forEach(b=>scene.remove(b.m));parts.forEach(x=>scene.remove(x.m));bullets=[];parts=[];build(arenaType);const b0=readBuild(0),b1=readBuild(1);const c0=configFromBuild(b0),c1=configFromBuild(b1);players=[player(0,(BODY[b0.body]||BODY.knight).base,c0,b0),player(1,(BODY[b1.body]||BODY.knight).base,c1,b1)];time=90;running=true;$('#menu').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;$('#result').hidden=true;playBgm(arenaType==='hex'?'space':'normal');hud();banner('FIGHT!',900)}"
new="function start(){players.forEach(p=>scene.remove(p.root));bullets.forEach(b=>scene.remove(b.m));parts.forEach(x=>scene.remove(x.m));bullets=[];parts=[];build(arenaType);const b0=readBuild(0),b1=readBuild(1);const c0=configFromBuild(b0),c1=configFromBuild(b1);players=[player(0,(BODY[b0.body]||BODY.knight).base,c0,b0),player(1,(BODY[b1.body]||BODY.knight).base,c1,b1)];time=90;running=true;matchReady=false;matchToken++;$('#menu').hidden=true;$('#hud').hidden=false;$('#controls').hidden=false;$('#result').hidden=true;playBgm(arenaType==='hex'?'space':'normal');hud();runCountdown(matchToken)}"
if old not in js: raise SystemExit('start not found')
js=js.replace(old,new,1)

# Timer should not move during countdown (handle common compact forms)
js=js.replace("if(running){time-=dt;","if(running&&matchReady){time-=dt;")
js=js.replace("if(running)time-=dt;","if(running&&matchReady)time-=dt;")

# Weapon recoil recovery: inject into common player update prefix if present
js=js.replace("players.forEach(p=>{p.cd=Math.max(0,p.cd-dt);p.inv=Math.max(0,p.inv-dt);",
"players.forEach(p=>{p.cd=Math.max(0,p.cd-dt);p.inv=Math.max(0,p.inv-dt);p.weaponKick=Math.max(0,(p.weaponKick||0)-dt*1.9);if(p.weaponHost)p.weaponHost.position.z=p.weaponKick;",1)

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.7.7 arsenal + match intro materialized')
