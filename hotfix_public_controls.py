from pathlib import Path

p=Path('src/main.js')
s=p.read_text(encoding='utf-8')

# 1) Projectile/player collision must be XZ-only in a top-down game.
old="if(e.alive&&b.m.position.distanceToSquared(e.root.position)<.52)damage(1-b.owner,b.dm,b.owner),rm=true"
new="const dx=b.m.position.x-e.root.position.x,dz=b.m.position.z-e.root.position.z;if(e.alive&&dx*dx+dz*dz<(e.r+.16)**2)damage(1-b.owner,b.dm,b.owner),rm=true"
if old not in s:
    raise SystemExit('collision hook not found')
s=s.replace(old,new,1)

# 2) P2 face-to-face input: keep the knob under the finger, rotate only the gameplay vector.
old="let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);if(z.classList.contains('p2')){dx=-dx;dy=-dy}const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
new="let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;if(pi===1){x=-x;y=-y}(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
if old not in s:
    raise SystemExit('P2 stick hook not found')
s=s.replace(old,new,1)

# 3) Aim release should clear aim so touch doesn't continue using a stale vector.
old="if(players[pi]&&kind==='move')players[pi].move.set(0,0)"
new="if(players[pi]){if(kind==='move')players[pi].move.set(0,0);else players[pi].aim.set(0,0)}"
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('public collision + P2 face-to-face controls hotfix applied')
