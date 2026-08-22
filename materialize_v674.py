from pathlib import Path

js_path=Path('src/main.js')
css_path=Path('style.css')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
css=css_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

# Version
html=html.replace('Duel Arena v6.7.3','Duel Arena v6.7.4')
html=html.replace('<strong>v6.7.3</strong><span>HORIZONTAL BATTLE AXIS</span>','<strong>v6.7.4</strong><span>COMBAT FEEL PASS</span>')

# Add combat feel state next to existing globals.
old="let select=['ranger','ranger'], arenaType='square', players=[], bullets=[], parts=[], running=false,time=90,last=performance.now(),hitStop=0;"
new="let select=['ranger','ranger'], arenaType='square', players=[], bullets=[], parts=[], running=false,time=90,last=performance.now(),hitStop=0,shakePower=0,shakeTime=0,koSlow=0,combo=[0,0],comboTimer=[0,0];"
if old not in js: raise SystemExit('global state hook not found')
js=js.replace(old,new,1)

# Richer FX helpers after burst().
needle="function burst(pos,col=0xffffff,n=10){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,5,5),new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.copy(pos);scene.add(m);parts.push({m,v:new THREE.Vector3((Math.random()-.5)*4,Math.random()*2.5,(Math.random()-.5)*4),life:.3})}}"
helpers=r'''function burst(pos,col=0xffffff,n=10){for(let i=0;i<n;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(.075,5,5),new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.copy(pos);scene.add(m);parts.push({m,v:new THREE.Vector3((Math.random()-.5)*4,Math.random()*2.5,(Math.random()-.5)*4),life:.3})}}
function sparkBurst(pos,col=0xffffff,n=14,power=1){
 for(let i=0;i<n;i++){const g=i%3===0?new THREE.BoxGeometry(.035,.035,.28):new THREE.SphereGeometry(.055,5,5);const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:col,transparent:true}));m.position.copy(pos);scene.add(m);const a=Math.random()*Math.PI*2,s=(2.2+Math.random()*4.3)*power;m.rotation.y=a;parts.push({m,v:new THREE.Vector3(Math.cos(a)*s,(1.2+Math.random()*3)*power,Math.sin(a)*s),life:.22+Math.random()*.18})}
}
function impactRing(pos,col=0xffffff,scale=1){const m=new THREE.Mesh(new THREE.RingGeometry(.18,.28,28),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.copy(pos);m.position.y=.12;scene.add(m);parts.push({m,v:new THREE.Vector3(),life:.22,ring:true,scale})}
function addShake(power=.18,dur=.12){shakePower=Math.max(shakePower,power);shakeTime=Math.max(shakeTime,dur)}
function screenFlash(kind='hit'){let el=document.getElementById('combat-flash');if(!el){el=document.createElement('div');el.id='combat-flash';document.body.appendChild(el)}el.className='';void el.offsetWidth;el.className=kind;}
function damagePop(world,dm,attacker){const v=world.clone().project(camera);const el=document.createElement('div');el.className='combat-damage '+(dm>=26?'heavy':'');el.textContent='-'+Math.round(dm);el.style.left=((v.x*.5+.5)*innerWidth)+'px';el.style.top=((-v.y*.5+.5)*innerHeight)+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),620);combo[attacker]++;comboTimer[attacker]=.8;if(combo[attacker]>=2){const c=document.createElement('div');c.className='combo-pop';c.textContent=combo[attacker]+' HIT!';c.style.left=attacker?'68%':'32%';document.body.appendChild(c);setTimeout(()=>c.remove(),430)}}
function flashPlayer(p){p.root.traverse(n=>{if(!n.material)return;const mats=Array.isArray(n.material)?n.material:[n.material];mats.forEach(mat=>{if(!mat.color)return;const old=mat.color.getHex();mat.color.setHex(0xffffff);setTimeout(()=>{try{mat.color.setHex(old)}catch{}},70)})})}
function lowHpPulse(){players.forEach((p,i)=>{const el=document.querySelector(`.hud.player.${i?'two':'one'}`);if(el)el.classList.toggle('low-hp',p.alive&&p.hp/p.max<=.3)})}
'''
if needle not in js: raise SystemExit('burst hook not found')
js=js.replace(needle,helpers,1)

# Stronger SUPER presentation.
old="tone(280,.12,'sine',.04,420);banner('SUPER!',450)}"
new="tone(280,.12,'sine',.055,520);addShake(.32,.22);screenFlash('super');impactRing(p.root.position.clone(),p.cfg.col,1.8);sparkBurst(p.root.position.clone().setY(.9),p.cfg.col,24,1.25);hitStop=Math.max(hitStop,.055);banner('SUPER!',520)}"
if old not in js: raise SystemExit('super hook not found')
js=js.replace(old,new,1)

# Replace damage/KO with punchier versions.
old="function damage(v,dm,a){const p=players[v];if(!p.alive||p.inv>0)return;p.hp=Math.max(0,p.hp-dm);players[a].sup=Math.min(100,players[a].sup+dm*.9);p.sup=Math.min(100,p.sup+dm*.35);hitStop=.035;tone(85,.07,'sawtooth',.035,-30);burst(p.root.position.clone().setY(.9));if(navigator.vibrate)navigator.vibrate(18);if(p.hp<=0)ko(v,a)}"
new="function damage(v,dm,a){const p=players[v];if(!p.alive||p.inv>0)return;const hitPos=p.root.position.clone().setY(.9);p.hp=Math.max(0,p.hp-dm);players[a].sup=Math.min(100,players[a].sup+dm*.9);p.sup=Math.min(100,p.sup+dm*.35);const heavy=dm>=25;hitStop=Math.max(hitStop,heavy?.065:.038);addShake(heavy?.28:.13,heavy?.16:.09);tone(heavy?72:92,heavy?.095:.06,'sawtooth',heavy?.05:.03,-35);sparkBurst(hitPos,players[a]?.cfg?.col||0xffffff,heavy?20:11,heavy?1.25:.85);impactRing(hitPos,players[a]?.cfg?.col||0xffffff,heavy?1.5:1);damagePop(hitPos,dm,a);flashPlayer(p);screenFlash(heavy?'heavy':'hit');const atk=players[a];if(atk){const dx=p.root.position.x-atk.root.position.x,dz=p.root.position.z-atk.root.position.z,len=Math.hypot(dx,dz)||1,k=heavy?.42:.22;const q=p.root.position.clone();q.x+=dx/len*k;q.z+=dz/len*k;if(!blocked(q,p.r))p.root.position.copy(q)}if(navigator.vibrate)navigator.vibrate(heavy?[22,18,26]:14);if(p.hp<=0)ko(v,a)}"
if old not in js: raise SystemExit('damage hook not found')
js=js.replace(old,new,1)
old="function ko(v,a){const p=players[v];p.alive=false;p.root.visible=false;players[a].score++;burst(p.root.position.clone().setY(.9),p.cfg.col,22);tone(150,.16,'sawtooth',.05,-100);banner('K.O!',700);hud();if(players[a].score>=3)setTimeout(()=>finish(a),700);else setTimeout(()=>reset(v),1000)}"
new="function ko(v,a){const p=players[v],pos=p.root.position.clone().setY(.9);p.alive=false;p.root.visible=false;players[a].score++;koSlow=.22;hitStop=Math.max(hitStop,.105);addShake(.58,.38);sparkBurst(pos,p.cfg.col,42,1.7);impactRing(pos,p.cfg.col,2.6);burst(pos,p.cfg.col,28);screenFlash('ko');tone(138,.22,'sawtooth',.075,-115);if(navigator.vibrate)navigator.vibrate([35,25,55]);banner('K.O!',850);hud();if(players[a].score>=3)setTimeout(()=>finish(a),850);else setTimeout(()=>reset(v),1150)}"
if old not in js: raise SystemExit('ko hook not found')
js=js.replace(old,new,1)

# Update particle renderer for expanding rings, combo timeout, low HP pulse.
old="for(let i=parts.length-1;i>=0;i--){const x=parts[i];x.life-=dt;x.m.position.addScaledVector(x.v,dt);x.v.y-=6*dt;x.m.material.opacity=Math.max(0,x.life/.3);if(x.life<=0){scene.remove(x.m);parts.splice(i,1)}}hud();$('#timer').textContent=Math.ceil(time)}"
new="for(let i=parts.length-1;i>=0;i--){const x=parts[i];x.life-=dt;if(x.ring){const s=(1.25-x.life/.22)*x.scale+1;x.m.scale.setScalar(Math.max(1,s))}else{x.m.position.addScaledVector(x.v,dt);x.v.y-=6*dt}x.m.material.opacity=Math.max(0,x.life/.3);if(x.life<=0){scene.remove(x.m);parts.splice(i,1)}}for(let i=0;i<2;i++){comboTimer[i]=Math.max(0,comboTimer[i]-dt);if(comboTimer[i]===0)combo[i]=0}lowHpPulse();hud();$('#timer').textContent=Math.ceil(time)}"
if old not in js: raise SystemExit('update tail hook not found')
js=js.replace(old,new,1)

# Replace loop so hitstop freezes gameplay but particles/camera feedback keep breathing.
old="function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(hitStop>0)hitStop-=dt;else update(dt);updateAimGuides();updateSharedCamera(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}"
new="function loop(now){const rawDt=Math.min(.033,(now-last)/1000);last=now;let gameDt=rawDt;if(koSlow>0){koSlow=Math.max(0,koSlow-rawDt);gameDt*=.22}if(hitStop>0){hitStop=Math.max(0,hitStop-rawDt);gameDt=0}else update(gameDt);updateAimGuides();updateSharedCamera(rawDt);shakeTime=Math.max(0,shakeTime-rawDt);const saved=camera.position.clone();if(shakeTime>0&&shakePower>0){const f=shakeTime/.38,amp=shakePower*Math.min(1,f*2.5);camera.position.x+=(Math.random()-.5)*amp;camera.position.y+=(Math.random()-.5)*amp*.55;camera.position.z+=(Math.random()-.5)*amp}renderer.render(scene,camera);camera.position.copy(saved);if(shakeTime<=0)shakePower=0;requestAnimationFrame(loop)}"
if old not in js: raise SystemExit('loop hook not found')
js=js.replace(old,new,1)

# CSS for flashes/damage/low HP.
css_add=r'''

/* v6.7.4 Combat Feel Pass */
#combat-flash{position:fixed;inset:0;pointer-events:none;z-index:70;opacity:0}
#combat-flash.hit{animation:combatFlashHit .12s ease-out}
#combat-flash.heavy{animation:combatFlashHeavy .18s ease-out}
#combat-flash.super{animation:combatFlashSuper .24s ease-out}
#combat-flash.ko{animation:combatFlashKo .32s ease-out}
@keyframes combatFlashHit{0%{opacity:.18;background:#fff}100%{opacity:0;background:transparent}}
@keyframes combatFlashHeavy{0%{opacity:.28;background:#fff}40%{opacity:.14;background:#ffb36a}100%{opacity:0}}
@keyframes combatFlashSuper{0%{opacity:.32;background:#b69cff}100%{opacity:0}}
@keyframes combatFlashKo{0%{opacity:.52;background:#fff}24%{opacity:.28;background:#ff8d72}100%{opacity:0}}
.combat-damage{position:fixed;z-index:80;pointer-events:none;transform:translate(-50%,-50%);font-weight:1000;font-size:24px;text-shadow:0 3px 10px #000,0 0 8px #fff;animation:combatDamage .6s cubic-bezier(.16,.8,.22,1) forwards}
.combat-damage.heavy{font-size:32px}
@keyframes combatDamage{0%{opacity:0;transform:translate(-50%,-25%) scale(.65)}18%{opacity:1;transform:translate(-50%,-70%) scale(1.28)}100%{opacity:0;transform:translate(-50%,-165%) scale(.86)}}
.combo-pop{position:fixed;top:46%;z-index:81;pointer-events:none;transform:translate(-50%,-50%) rotate(-7deg);font-weight:1000;font-style:italic;font-size:clamp(20px,5vw,38px);text-shadow:0 3px 12px #000;animation:comboPop .42s ease-out forwards}
@keyframes comboPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.5) rotate(-9deg)}30%{opacity:1;transform:translate(-50%,-50%) scale(1.18) rotate(-5deg)}100%{opacity:0;transform:translate(-50%,-85%) scale(.92) rotate(-3deg)}}
.hud.low-hp{animation:lowHpPulse .72s ease-in-out infinite}
.hud.low-hp .hp{box-shadow:0 0 18px #ff4b4b}
@keyframes lowHpPulse{50%{filter:brightness(1.24);transform:translateX(-50%) scale(1.015)}}
.hud.two.low-hp{animation:lowHpPulseP2 .72s ease-in-out infinite}
@keyframes lowHpPulseP2{50%{filter:brightness(1.24);transform:translateX(-50%) rotate(180deg) scale(1.015)}}
'''
if 'v6.7.4 Combat Feel Pass' not in css: css+=css_add

js_path.write_text(js,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.7.4 combat feel pass materialized')
