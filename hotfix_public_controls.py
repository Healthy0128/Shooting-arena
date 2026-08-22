from pathlib import Path

p=Path('src/main.js')
s=p.read_text(encoding='utf-8')

# v6.6.7 PUBLIC HOTFIX
# 1) Projectile/player collision must be XZ-only in a top-down game.
old="if(e.alive&&b.m.position.distanceToSquared(e.root.position)<.52)damage(1-b.owner,b.dm,b.owner),rm=true"
new="const dx=b.m.position.x-e.root.position.x,dz=b.m.position.z-e.root.position.z;if(e.alive&&dx*dx+dz*dz<(e.r+.16)**2)damage(1-b.owner,b.dm,b.owner),rm=true"
if old in s:
    s=s.replace(old,new,1)

# 2) P2 face-to-face input: keep knob under the finger, rotate only gameplay vector.
old="let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);if(z.classList.contains('p2')){dx=-dx;dy=-dy}const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
new="let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;if(pi===1){x=-x;y=-y}(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
if old in s:
    s=s.replace(old,new,1)

# 3) Aim release clears stale aim.
old="if(players[pi]&&kind==='move')players[pi].move.set(0,0)"
new="if(players[pi]){if(kind==='move')players[pi].move.set(0,0);else players[pi].aim.set(0,0)}"
if old in s:
    s=s.replace(old,new,1)

# 4) Portrait-first top-down camera. The game world renders only in the center battle viewport.
old="const camera=new THREE.PerspectiveCamera(46,1,.1,100); camera.position.set(0,20,15.5); camera.lookAt(0,0,0);"
new="const camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,100); camera.position.set(0,30,.01); camera.up.set(0,0,-1); camera.lookAt(0,0,0); let battleView={x:0,y:0,w:innerWidth,h:innerHeight};"
if old not in s:
    raise SystemExit('camera hook not found')
s=s.replace(old,new,1)

# 5) Responsive center viewport + orientation notice.
old="function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();"
new="""function ensureOrientationNotice(){let n=document.querySelector('#portrait-only');if(!n){n=document.createElement('div');n.id='portrait-only';n.innerHTML='<div><b>PORTRAIT MODE</b><span>端末を縦向きにしてください</span></div>';document.body.appendChild(n)}n.style.display=innerWidth>innerHeight?'grid':'none'}\nfunction resize(){\n  const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);\n  const portrait=h>=w;\n  const viewH=portrait?Math.min(h*.56,w*1.08):h;\n  battleView={x:0,y:Math.max(0,(h-viewH)/2),w,h:viewH};\n  const aspect=battleView.w/Math.max(1,battleView.h);\n  const halfW=A.hw+.85,halfH=halfW/aspect;\n  camera.left=-halfW;camera.right=halfW;camera.top=halfH;camera.bottom=-halfH;camera.updateProjectionMatrix();\n  ensureOrientationNotice();\n}\naddEventListener('resize',resize);resize();"""
if old not in s:
    raise SystemExit('resize hook not found')
s=s.replace(old,new,1)

# 6) Render the 3D arena only inside the center viewport, leaving top/bottom for controls.
old="function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(hitStop>0)hitStop-=dt;else update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}build('square');requestAnimationFrame(loop);"
new="""function loop(now){const dt=Math.min(.033,(now-last)/1000);last=now;if(hitStop>0)hitStop-=dt;else update(dt);\nrenderer.setScissorTest(false);renderer.setViewport(0,0,innerWidth,innerHeight);renderer.clear();\nrenderer.setViewport(battleView.x,battleView.y,battleView.w,battleView.h);renderer.setScissor(battleView.x,battleView.y,battleView.w,battleView.h);renderer.setScissorTest(true);renderer.render(scene,camera);renderer.setScissorTest(false);requestAnimationFrame(loop)}build('square');requestAnimationFrame(loop);"""
if old not in s:
    raise SystemExit('render loop hook not found')
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')

# Portrait UI CSS and visible version marker.
css=Path('style.css')
c=css.read_text(encoding='utf-8')
c += r'''\n/* v6.6.7 portrait-first public layout */\n#game{background:#090d14}\n#portrait-only{position:fixed;inset:0;z-index:9999;place-items:center;background:#070a10f2;color:#fff;text-align:center;padding:30px}\n#portrait-only>div{padding:24px 30px;border-radius:22px;background:#121b29;border:1px solid #ffffff22;box-shadow:0 20px 70px #000c}\n#portrait-only b{display:block;font-size:28px;letter-spacing:.08em}\n#portrait-only span{display:block;margin-top:8px;font-size:14px;opacity:.7}\n@media (orientation:portrait){\n  .stick-zone{width:42vw;max-width:300px;height:22vh;max-height:260px}\n  .stick-zone.p2{top:max(12px,env(safe-area-inset-top))}\n  .stick-zone.p1{bottom:max(12px,env(safe-area-inset-bottom))}\n  .stick{width:96px;height:96px}.stick i{width:42px;height:42px}\n  .super-btn.p2{top:max(94px,calc(env(safe-area-inset-top) + 80px))}\n  .def-btn.p2{top:max(150px,calc(env(safe-area-inset-top) + 136px))}\n  .super-btn.p1{bottom:max(94px,calc(env(safe-area-inset-bottom) + 80px))}\n  .def-btn.p1{bottom:max(150px,calc(env(safe-area-inset-bottom) + 136px))}\n  .hud{width:min(78vw,620px)}\n}\n'''
css.write_text(c,encoding='utf-8')

idx=Path('index.html')
h=idx.read_text(encoding='utf-8')
h=h.replace('v0.6.6.6','v0.6.6.7').replace('STAGE GRAPHICS BUILD','PORTRAIT PUBLIC BUILD')
idx.write_text(h,encoding='utf-8')

print('v6.6.7 portrait-first camera/layout hotfix applied')
