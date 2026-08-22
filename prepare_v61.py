from pathlib import Path

main_path = Path('src/main.js')
index_path = Path('index.html')
style_path = Path('style.css')
sw_path = Path('sw.js')

js = main_path.read_text(encoding='utf-8')

# Wider arena + camera
js = js.replace("scene.fog=new THREE.Fog(0x0d1118,26,44);", "scene.fog=new THREE.Fog(0x0d1118,36,62);")
js = js.replace("const camera=new THREE.PerspectiveCamera(46,1,.1,100); camera.position.set(0,20,15.5);", "const camera=new THREE.PerspectiveCamera(43,1,.1,120); camera.position.set(0,31,23);")
js = js.replace("const A={hw:9.5,hh:6.2};", "const A={hw:14.5,hh:9};")
js = js.replace("root.position.set(0,0,i?-4.5:4.5)", "root.position.set(0,0,i?-7.1:7.1)")
js = js.replace("p.root.position.set(0,0,i?-4.5:4.5)", "p.root.position.set(0,0,i?-7.1:7.1)")

# Real KayKit stage props. Collision stays lightweight and separate.
prop_block = """
const PROP='https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props/main/assets/kaykit/prototype-bits-1.1/Assets/gltf/';
const stagePropCache=new Map();
function prop(url){return stagePropCache.get(url)||stagePropCache.set(url,new Promise((ok,no)=>loader.load(url,ok,undefined,no))).get(url)}
async function addProp(holder,url,scale=1,rot=0,fallback=null){try{const g=await prop(PROP+url);if(!holder.parent)return;const m=g.scene.clone(true);if(Array.isArray(scale))m.scale.set(...scale);else m.scale.setScalar(scale);m.rotation.y=rot;holder.add(m);if(fallback)fallback.visible=false}catch(e){console.warn('stage prop fallback',url,e)}}
"""
needle = "const load=url=>cache.get(url)||cache.set(url,new Promise((ok,no)=>loader.load(url,ok,undefined,no))).get(url);"
if "const PROP='https://raw.githubusercontent.com/GeorgeQLe/assets-kaykit-3d-props" not in js:
    js = js.replace(needle, needle + "\n" + prop_block)

old_box = "function box(x,z,w,d,h=1.4,col=0x66758e,opt={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.75}));m.position.set(x,h/2,z);arena.add(m);obs.push({x,z,hw:w/2,hd:d/2,m,hp:opt.hp||0,breakable:!!opt.hp})}"
new_box = "function box(x,z,w,d,h=1.4,col=0x66758e,opt={}){const g=new THREE.Group();g.position.set(x,0,z);arena.add(g);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.75}));m.position.y=h/2;g.add(m);const file=opt.hp?(opt.hp>60?'Ammo_Box.gltf':'Box_A.gltf'):(w>d?'Wall.gltf':'Wall_Decorated.gltf');addProp(g,file,[Math.max(.6,w/2),Math.max(.65,h/1.4),Math.max(.6,d/2)],w<d?Math.PI/2:0,m);obs.push({x,z,hw:w/2,hd:d/2,m:g,hp:opt.hp||0,breakable:!!opt.hp})}"
js = js.replace(old_box,new_box)

old_cyl = "function cyl(x,z,r,h=1.5){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),new THREE.MeshStandardMaterial({color:0x71819a,roughness:.75}));m.position.set(x,h/2,z);arena.add(m);obs.push({x,z,r,circle:true,m})}"
new_cyl = "function cyl(x,z,r,h=1.5){const g=new THREE.Group();g.position.set(x,0,z);arena.add(g);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),new THREE.MeshStandardMaterial({color:0x71819a,roughness:.75}));m.position.y=h/2;g.add(m);addProp(g,'Pillar_A.gltf',Math.max(.7,r*1.25),0,m);obs.push({x,z,r,circle:true,m:g})}"
js = js.replace(old_cyl,new_cyl)

# Expand the stage layouts themselves.
js = js.replace("new THREE.BoxGeometry(19,.5,12.4)", "new THREE.BoxGeometry(29,.5,18)")
js = js.replace("new THREE.GridHelper(20,20", "new THREE.GridHelper(30,30")
for a,b in {
    "[-3,3].forEach(x=>[-1.7,1.7]":"[-5,5].forEach(x=>[-3,3]",
    "[-3,3].forEach(x=>[-2,2]":"[-5,5].forEach(x=>[-3,3]",
    "box(-6,0,1,3.4);box(6,0,1,3.4)":"box(-10,0,1,5);box(10,0,1,5)",
    "box(0,0,1.15,4.5);box(0,0,4.5,1.15)":"box(0,0,1.15,7);box(0,0,7,1.15)",
    "Math.sin(a)*3.2,Math.cos(a)*3.2":"Math.sin(a)*5.4,Math.cos(a)*5.4",
    "box(-4.2,0,.8,2.7);box(4.2,0,.8,2.7)":"box(-7,0,.8,4);box(7,0,.8,4)",
    "[[-2,-1.7],[2,1.7],[-2,1.7],[2,-1.7],[0,0]]":"[[-3.4,-3],[3.4,3],[-3.4,3],[3.4,-3],[0,0],[-9,4.5],[9,-4.5]]",
    "[[-3,-1.8],[3,1.8],[3,-1.8],[-3,1.8],[0,0],[-6,0],[6,0]]":"[[-5,-3],[5,3],[5,-3],[-5,3],[0,0],[-9,0],[9,0],[0,-5],[0,5]]"
}.items():
    js = js.replace(a,b)

# Face-to-face P2 controls: knob follows finger, only game vector rotates 180 degrees.
old_ptr = "let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);if(z.classList.contains('p2')){dx=-dx;dy=-dy}const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
new_ptr = "let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const max=r.width*.33,mag=Math.hypot(dx,dy);let x=dx/max,y=dy/max;if(mag>max){x*=max/mag;y*=max/mag}if(mag<max*.12)x=y=0;if(pi===1){x=-x;y=-y}(kind==='move'?players[pi].move:players[pi].aim).set(x,y);knob.style.transform=`translate(calc(-50% + ${Math.max(-max,Math.min(max,dx))}px),calc(-50% + ${Math.max(-max,Math.min(max,dy))}px))`"
js = js.replace(old_ptr,new_ptr)

# Projectile collision bug fix: top-down collision is XZ only, not 3D distance.
old_hit = "if(e.alive&&b.m.position.distanceToSquared(e.root.position)<.52)damage(1-b.owner,b.dm,b.owner),rm=true"
new_hit = "const dx=b.m.position.x-e.root.position.x,dz=b.m.position.z-e.root.position.z;if(e.alive&&dx*dx+dz*dz<.62)damage(1-b.owner,b.dm,b.owner),rm=true"
js = js.replace(old_hit,new_hit)

main_path.write_text(js,encoding='utf-8')

# iOS P2 visual orientation fix: do not rotate the joystick container itself.
css = style_path.read_text(encoding='utf-8')
css = css.replace('.stick-zone.p2{top:0;transform:rotate(180deg)}','.stick-zone.p2{top:0}')
style_path.write_text(css,encoding='utf-8')

# Force a fresh service-worker cache so iPhone does not keep old collision code.
sw = sw_path.read_text(encoding='utf-8').replace("duel-arena-v5-core","duel-arena-v61-core")
sw_path.write_text(sw,encoding='utf-8')

print('v6.1 deployment patch applied')
