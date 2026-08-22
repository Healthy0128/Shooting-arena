from pathlib import Path
import re

p=Path('src/main.js')
s=p.read_text(encoding='utf-8')

# v6.7.0 public integrated patch: portrait camera + gameplay hotfixes + stage graphics.

# 1) Orthographic portrait-first camera. Accept either old Perspective or an earlier patched camera.
s=re.sub(
    r"const camera=new THREE\.(?:PerspectiveCamera\([^;]+\); camera\.position\.set\([^;]+\); camera\.lookAt\(0,0,0\)|OrthographicCamera\([^;]+\); camera\.position\.set\([^;]+\); camera\.up\.set\([^;]+\); camera\.lookAt\(0,0,0\));",
    "const camera=new THREE.OrthographicCamera(-11.6,11.6,14.2,-14.2,.1,100); camera.position.set(0,34,.01); camera.up.set(0,0,-1); camera.lookAt(0,0,0);",
    s,count=1
)

# Renderer/shadows.
if 'renderer.shadowMap.enabled=true' not in s:
    s=s.replace("renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace;",
                "renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;")

# 2) P2 face-to-face: knob follows finger, gameplay vector rotates 180 degrees.
old="let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);if(z.classList.contains('p2')){dx=-dx;dy=-dy}const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
new="let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;if(pi===1){x=-x;y=-y}(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
if old in s:s=s.replace(old,new,1)

# Aim release also clears stale vector.
s=s.replace("if(players[pi]&&kind==='move')players[pi].move.set(0,0)","if(players[pi]){if(kind==='move')players[pi].move.set(0,0);else players[pi].aim.set(0,0)}",1)

# 3) XZ projectile collision.
s=s.replace("if(e.alive&&b.m.position.distanceToSquared(e.root.position)<.52)damage(1-b.owner,b.dm,b.owner),rm=true",
            "const dx=b.m.position.x-e.root.position.x,dz=b.m.position.z-e.root.position.z;if(e.alive&&dx*dx+dz*dz<(e.r+.16)**2)damage(1-b.owner,b.dm,b.owner),rm=true",1)

# 4) Rich stage helpers.
helper=r'''
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
 paint(0,-5.5,17,.16,th.accent,.45);paint(0,5.5,17,.16,th.accent,.45);
 glowRing(0,-4.5,1.15,th.glow,.5);glowRing(0,4.5,1.15,th.glow,.5);
 if(t==='ring'){glowRing(0,0,3.3,th.accent,.7);glowRing(0,0,4.8,th.glow,.28)}
 else if(t==='cross'){paint(0,0,8.5,.7,th.accent,.65);paint(0,0,.7,8.5,th.accent,.65)}
 else if(t==='hex'){const h=new THREE.Mesh(new THREE.RingGeometry(2.8,3.2,6),new THREE.MeshBasicMaterial({color:th.accent,transparent:true,opacity:.68,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.rotation.z=Math.PI/6;h.position.y=.02;arena.add(h)}
 else {glowRing(0,0,2.15,th.accent,.24)}
}
'''
if 'const STAGE_THEME=' not in s:
    s=s.replace('function build(t){',helper+'\nfunction build(t){',1)

# Better obstacle materials + shadows.
s=s.replace("new THREE.MeshStandardMaterial({color:col,roughness:.75})","new THREE.MeshStandardMaterial({color:col,roughness:.62,metalness:.16})",1)
s=s.replace("new THREE.MeshStandardMaterial({color:0x71819a,roughness:.75})","new THREE.MeshStandardMaterial({color:0x71819a,roughness:.55,metalness:.22})",1)
s=s.replace("arena.add(m);obs.push({x,z,hw:w/2,hd:d/2,m,hp:opt.hp||0,breakable:!!opt.hp})","m.castShadow=true;m.receiveShadow=true;arena.add(m);obs.push({x,z,hw:w/2,hd:d/2,m,hp:opt.hp||0,breakable:!!opt.hp})",1)
s=s.replace("arena.add(m);obs.push({x,z,r,circle:true,m})","m.castShadow=true;m.receiveShadow=true;arena.add(m);obs.push({x,z,r,circle:true,m})",1)

# Replace build prelude only; preserve arena-specific obstacle layouts.
pat=r"function build\(t\)\{clear\(arena\);obs=\[\];bushes=\[\];const f=new THREE\.Mesh\(new THREE\.BoxGeometry\(19,\.5,12\.4\),new THREE\.MeshStandardMaterial\(\{color:0x39465a,roughness:\.9\}\)\);f\.position\.y=-\.3;arena\.add\(f\);const grid=new THREE\.GridHelper\(20,20,0x8294b3,0x536078\);grid\.position\.y=-\.035;arena\.add\(grid\);"
rep="function build(t){clear(arena);obs=[];bushes=[];const th=theme(t);scene.background.setHex(th.bg);scene.fog.color.setHex(th.bg);const under=new THREE.Mesh(new THREE.BoxGeometry(21,.75,14.2),new THREE.MeshStandardMaterial({color:th.edge,roughness:.9}));under.position.y=-.55;under.receiveShadow=true;arena.add(under);const f=new THREE.Mesh(new THREE.BoxGeometry(19,.5,12.4),new THREE.MeshStandardMaterial({color:th.floor,roughness:.72,metalness:.08}));f.position.y=-.28;f.receiveShadow=true;arena.add(f);const grid=new THREE.GridHelper(19,19,th.accent,0x40546b);grid.material.opacity=.28;grid.material.transparent=true;grid.position.y=-.015;arena.add(grid);perimeter(th);stageMarks(t,th);"
s,n=re.subn(pat,rep,s,count=1)
if n!=1: raise SystemExit('build prelude hook not found')

# 5) Orthographic resize that keeps full arena visible in portrait.
s=re.sub(r"function resize\(\)\{renderer\.setSize\(innerWidth,innerHeight,false\);camera\.aspect=innerWidth/innerHeight;camera\.updateProjectionMatrix\(\)\}",
'''function resize(){renderer.setSize(innerWidth,innerHeight,false);const portrait=innerHeight>=innerWidth;const aspect=portrait?Math.max(.78,(innerWidth/innerHeight)*1.55):innerWidth/innerHeight;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}camera.left=-hw;camera.right=hw;camera.top=hh;camera.bottom=-hh;camera.updateProjectionMatrix()}''',s,count=1)

p.write_text(s,encoding='utf-8')
print('v6.7.0 integrated public patch applied')
