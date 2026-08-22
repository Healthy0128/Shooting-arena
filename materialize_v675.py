from pathlib import Path
import re

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

# Version labels
html=html.replace('Duel Arena v6.7.4','Duel Arena v6.7.5')
html=html.replace('<strong>v6.7.4</strong><span>COMBAT FEEL PASS</span>','<strong>v6.7.5</strong><span>CUSTOM LOADOUT LIVE</span>')

# Loadout definitions after C table
anchor="const A={hw:9.5,hh:6.2};"
if anchor not in js: raise SystemExit('A anchor not found')
insert=r'''
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
'''
js=js.replace(anchor,insert+'\n'+anchor,1)

# Player accepts override config/build data
js=js.replace('function player(i,key){const cfg=C[key],','function player(i,key,cfgOverride=null,buildInfo=null){const cfg=cfgOverride||C[key],',1)
js=js.replace("const p={i,key,cfg,root,primitive,host,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(i?-1:1,0),r:.58,mix:null};realModel(p);return p}","const p={i,key,cfg,build:buildInfo,root,primitive,host,hp:cfg.hp,max:cfg.hp,score:0,alive:true,inv:0,cd:0,sup:0,move:new THREE.Vector2(),aim:new THREE.Vector2(i?-1:1,0),r:cfg.r||.58,mix:null,defCd:0,guardTime:0,barrier:0,parryTime:0};realModel(p);return p}",1)

# Defense action before audio block
needle='let audio=null, realBgm=null;'
if needle not in js: raise SystemExit('audio anchor not found')
defense_code=r'''
function defenseMove(i){const p=players[i];if(!running||!p?.alive||p.defCd>0)return;const d=p.cfg.defense||'roll',meta=DEFENSE[d]||DEFENSE.roll;p.defCd=meta.cd;const vec=(p.move.lengthSq()>.08?p.move:p.aim).clone();if(vec.lengthSq()<.05)vec.set(i?-1:1,0);vec.normalize();const dash=(dist,inv)=>{for(let k=0;k<6;k++){const q=p.root.position.clone();q.x+=vec.x*dist/6;q.z+=vec.y*dist/6;if(!blocked(q,p.r))p.root.position.copy(q)}p.inv=Math.max(p.inv,inv)};if(d==='roll'){dash(2.5,.26);sparkBurst(p.root.position.clone().setY(.35),p.cfg.col,10,.7)}else if(d==='step'){dash(2.0,.17);sparkBurst(p.root.position.clone().setY(.3),p.cfg.col,8,.65)}else if(d==='evade'){dash(2.2,.38);sparkBurst(p.root.position.clone().setY(.35),p.cfg.col,12,.8)}else if(d==='guard'){p.guardTime=.75;impactRing(p.root.position.clone(),p.cfg.col,1.5)}else if(d==='barrier'){p.barrier=55;impactRing(p.root.position.clone(),0x82ddff,2.0)}else if(d==='parry'){p.parryTime=.20;impactRing(p.root.position.clone(),0xffffff,1.7)}tone(210,.07,'square',.025,90);addShake(.08,.08)}
'''
js=js.replace(needle,defense_code+'\n'+needle,1)

# Defensive damage handling and passive modifiers
old='function damage(v,dm,a){const p=players[v];if(!p.alive||p.inv>0)return;const hitPos=p.root.position.clone().setY(.9);p.hp=Math.max(0,p.hp-dm);players[a].sup=Math.min(100,players[a].sup+dm*.9);p.sup=Math.min(100,p.sup+dm*.35);'
new="function damage(v,dm,a){const p=players[v];if(!p.alive||p.inv>0)return;const hitPos=p.root.position.clone().setY(.9);if(p.parryTime>0){p.parryTime=0;p.defCd=0;hitStop=Math.max(hitStop,.075);addShake(.32,.16);sparkBurst(hitPos,0xffffff,22,1.15);banner('PARRY!',420);players[v].sup=Math.min(100,players[v].sup+16);return}if(p.guardTime>0)dm*=.28;if(p.barrier>0){const absorb=Math.min(p.barrier,dm);p.barrier-=absorb;dm-=absorb;sparkBurst(hitPos,0x82ddff,10,.7);if(dm<=.01)return}dm*=p.cfg.taken||1;p.hp=Math.max(0,p.hp-dm);players[a].sup=Math.min(100,players[a].sup+dm*.9*(players[a].cfg.superGain||1));p.sup=Math.min(100,p.sup+dm*.35*(p.cfg.superGain||1));"
if old not in js: raise SystemExit('damage prefix not found')
js=js.replace(old,new,1)

# Start from actual menu builds
old="function start(){players.forEach(p=>scene.remove(p.root));bullets.forEach(b=>scene.remove(b.m));parts.forEach(x=>scene.remove(x.m));bullets=[];parts=[];build(arenaType);players=[player(0,select[0]),player(1,select[1])];"
new="function start(){players.forEach(p=>scene.remove(p.root));bullets.forEach(b=>scene.remove(b.m));parts.forEach(x=>scene.remove(x.m));bullets=[];parts=[];build(arenaType);const b0=readBuild(0),b1=readBuild(1);const c0=configFromBuild(b0),c1=configFromBuild(b1);players=[player(0,(BODY[b0.body]||BODY.knight).base,c0,b0),player(1,(BODY[b1.body]||BODY.knight).base,c1,b1)];"
if old not in js: raise SystemExit('start hook not found')
js=js.replace(old,new,1)

# Hook DEF buttons + loadout UI
old="$('#start').onclick=()=>{ac().resume?.();start()};$('#rematch').onclick=start;$('#back-menu').onclick=()=>{running=false;stopBgm();$('#result').hidden=true;$('#hud').hidden=true;$('#controls').hidden=true;$('#menu').hidden=false};$$('.super-btn').forEach(b=>b.onpointerdown=e=>{e.preventDefault();superMove(+b.dataset.player)});"
new="$$('.loadout-card select').forEach(s=>s.addEventListener('change',syncBuildUI));$$('.random-build').forEach(b=>b.onclick=()=>randomBuild(+b.dataset.player));for(let i=0;i<2;i++){try{const saved=JSON.parse(localStorage.getItem(`duel-build-${i}`)||'null');if(saved)setBuild(i,saved)}catch{}}if(buildCost(readBuild(1))>BUILD_LIMIT)setBuild(1,{body:'barbarian',weapon:'bladegun',defense:'roll',super:'blast',color:'orange',passive:'coolant'});syncBuildUI();$('#start').onclick=()=>{if($('#start').disabled)return;ac().resume?.();start()};$('#rematch').onclick=start;$('#back-menu').onclick=()=>{running=false;stopBgm();$('#result').hidden=true;$('#hud').hidden=true;$('#controls').hidden=true;$('#menu').hidden=false};$$('.def-btn').forEach(b=>b.onpointerdown=e=>{e.preventDefault();defenseMove(+b.dataset.player)});$$('.super-btn').forEach(b=>b.onpointerdown=e=>{e.preventDefault();superMove(+b.dataset.player)});"
if old not in js: raise SystemExit('control hook not found')
js=js.replace(old,new,1)

# Update defense timers and button labels inside player update
old="players.forEach(p=>{p.cd=Math.max(0,p.cd-dt);p.inv=Math.max(0,p.inv-dt);if(!p.alive)return;"
new="players.forEach(p=>{p.cd=Math.max(0,p.cd-dt);p.inv=Math.max(0,p.inv-dt);p.defCd=Math.max(0,(p.defCd||0)-dt);p.guardTime=Math.max(0,(p.guardTime||0)-dt);p.parryTime=Math.max(0,(p.parryTime||0)-dt);const db=document.querySelector(`.def-btn[data-player=\"${p.i}\"]`);if(db){db.textContent=p.defCd>0?p.defCd.toFixed(1):'DEF';db.classList.toggle('ready',p.defCd<=0)}if(!p.alive)return;"
if old not in js: raise SystemExit('player update hook not found')
js=js.replace(old,new,1)

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.7.5 custom loadout live materialized')
