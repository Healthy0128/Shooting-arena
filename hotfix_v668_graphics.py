from pathlib import Path

js_path=Path('src/main.js')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

# Renderer / camera: portrait-first orthographic view that always fits the full arena.
old="const renderer=new THREE.WebGLRenderer({canvas:$('#game'),antialias:true,powerPreference:'high-performance'});\nrenderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace;\nconst scene=new THREE.Scene(); scene.background=new THREE.Color(0x0d1118); scene.fog=new THREE.Fog(0x0d1118,26,44);\nconst camera=new THREE.PerspectiveCamera(46,1,.1,100); camera.position.set(0,20,15.5); camera.lookAt(0,0,0);\nscene.add(new THREE.HemisphereLight(0xeaf2ff,0x202534,2.1)); const sun=new THREE.DirectionalLight(0xffffff,2.2); sun.position.set(7,14,8); scene.add(sun);"
new="const renderer=new THREE.WebGLRenderer({canvas:$('#game'),antialias:true,powerPreference:'high-performance'});\nrenderer.setPixelRatio(Math.min(devicePixelRatio,1.5)); renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;\nconst scene=new THREE.Scene(); scene.background=new THREE.Color(0x0b1018); scene.fog=new THREE.Fog(0x0b1018,30,55);\nconst camera=new THREE.OrthographicCamera(-10.5,10.5,10.5,-10.5,.1,100); camera.position.set(0,30,.01); camera.up.set(0,0,-1); camera.lookAt(0,0,0);\nscene.add(new THREE.HemisphereLight(0xeaf2ff,0x18202c,1.55)); const sun=new THREE.DirectionalLight(0xffffff,2.35); sun.position.set(7,16,6); sun.castShadow=true; sun.shadow.mapSize.set(1024,1024); scene.add(sun);"
if old not in js:
    raise SystemExit('camera/renderer hook not found')
js=js.replace(old,new,1)

# Richer obstacle materials and shadows.
old="function box(x,z,w,d,h=1.4,col=0x66758e,opt={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.75}));m.position.set(x,h/2,z);arena.add(m);obs.push({x,z,hw:w/2,hd:d/2,m,hp:opt.hp||0,breakable:!!opt.hp})}"
new="function box(x,z,w,d,h=1.4,col=0x66758e,opt={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color:col,roughness:.68,metalness:.08}));m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;arena.add(m);obs.push({x,z,hw:w/2,hd:d/2,m,hp:opt.hp||0,breakable:!!opt.hp})}"
if old in js: js=js.replace(old,new,1)
old="function cyl(x,z,r,h=1.5){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),new THREE.MeshStandardMaterial({color:0x71819a,roughness:.75}));m.position.set(x,h/2,z);arena.add(m);obs.push({x,z,r,circle:true,m})}"
new="function cyl(x,z,r,h=1.5,col=0x71819a){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,18),new THREE.MeshStandardMaterial({color:col,roughness:.58,metalness:.12}));m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;arena.add(m);obs.push({x,z,r,circle:true,m})}"
if old in js: js=js.replace(old,new,1)

start=js.index('function build(t){')
end=js.index('\nfunction blocked',start)

replacement=r'''const STAGE_STYLE={
 square:{bg:0x0b1520,floor:0x2c4055,edge:0x101a26,accent:0x53bfff,obs:0x597694},
 pillars:{bg:0x171619,floor:0x494249,edge:0x211d22,accent:0xe7bd72,obs:0x786a66},
 ring:{bg:0x1a1118,floor:0x493543,edge:0x271921,accent:0xff759e,obs:0x7c5067},
 cross:{bg:0x0d191d,floor:0x30464a,edge:0x142529,accent:0x55e1d9,obs:0x567e83},
 hex:{bg:0x120f20,floor:0x30284c,edge:0x1a1530,accent:0xa67cff,obs:0x66579a},
 fort:{bg:0x191613,floor:0x544b41,edge:0x2c251f,accent:0xe0bb7a,obs:0x796657},
 bush:{bg:0x0d1811,floor:0x344d39,edge:0x18271c,accent:0x70dc8a,obs:0x5f7964},
 crates:{bg:0x17130f,floor:0x4d4238,edge:0x29211a,accent:0xffa45d,obs:0x9a7049}
};

function stageMat(color,emissive=0,ei=0,rough=.78,metal=.08){
 return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,emissive,emissiveIntensity:ei});
}
function decoBox(x,z,w,d,h,color,emissive=0,ei=0){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),stageMat(color,emissive,ei,.58,.16));
 m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;arena.add(m);return m;
}
function floorMark(x,z,w,d,color,opacity=.55,rot=0){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
 m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,.025,z);arena.add(m);return m;
}
function glowCircle(x,z,r,color,opacity=.22){
 const m=new THREE.Mesh(new THREE.CircleGeometry(r,36),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
 m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);arena.add(m);return m;
}
function ringMark(x,z,ri,ro,color,opacity=.55){
 const m=new THREE.Mesh(new THREE.RingGeometry(ri,ro,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide}));
 m.rotation.x=-Math.PI/2;m.position.set(x,.035,z);arena.add(m);return m;
}
function perimeter(style){
 decoBox(0,-6.55,20.2,.45,.62,style.edge,style.accent,.16);
 decoBox(0, 6.55,20.2,.45,.62,style.edge,style.accent,.16);
 decoBox(-9.72,0,.45,13.5,.62,style.edge,style.accent,.16);
 decoBox( 9.72,0,.45,13.5,.62,style.edge,style.accent,.16);
 floorMark(0,-6.18,18.8,.09,style.accent,.85);
 floorMark(0, 6.18,18.8,.09,style.accent,.85);
 floorMark(-9.38,0,.09,11.9,style.accent,.85);
 floorMark( 9.38,0,.09,11.9,style.accent,.85);
 [[-9.7,-6.5],[9.7,-6.5],[-9.7,6.5],[9.7,6.5]].forEach(([x,z])=>{
   const p=new THREE.Mesh(new THREE.CylinderGeometry(.24,.34,1.7,10),stageMat(style.obs,style.accent,.32,.36,.25));
   p.position.set(x,.85,z);p.castShadow=true;arena.add(p);
   const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,10,8),stageMat(0xffffff,style.accent,1.15,.18,.1));cap.position.set(x,1.85,z);arena.add(cap);
   const l=new THREE.PointLight(style.accent,.38,5.5,2);l.position.set(x,2,z);arena.add(l);
 });
}
function centerDesign(t,style){
 glowCircle(0,0,1.35,style.accent,.10);ringMark(0,0,1.48,1.62,style.accent,.8);
 if(t==='ring'){ringMark(0,0,2.7,3.05,style.accent,.65);ringMark(0,0,4.35,4.52,style.accent,.32)}
 else if(t==='cross'){floorMark(0,0,.7,8.4,style.accent,.52);floorMark(0,0,13.2,.7,style.accent,.52)}
 else if(t==='hex'){const h=new THREE.Mesh(new THREE.RingGeometry(2.5,2.82,6),new THREE.MeshBasicMaterial({color:style.accent,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));h.rotation.x=-Math.PI/2;h.rotation.z=Math.PI/6;h.position.y=.035;arena.add(h)}
 else if(t==='fort'){floorMark(-4.7,0,4.1,.5,style.accent,.42);floorMark(4.7,0,4.1,.5,style.accent,.42)}
 else if(t==='crates'){floorMark(0,0,7.5,.45,style.accent,.45,Math.PI/4);floorMark(0,0,7.5,.45,style.accent,.45,-Math.PI/4)}
 else {floorMark(0,0,8.8,.42,style.accent,.34);floorMark(0,0,.42,5.8,style.accent,.34)}
}
function stageScenery(t,style){
 // Decorative set dressing kept outside the player collision field.
 const d=[[ -8.65,-5.35],[8.65,5.35],[-8.65,5.35],[8.65,-5.35]];
 d.forEach(([x,z],i)=>{
   if(t==='bush'){
     const g=new THREE.Group();for(let k=0;k<5;k++){const a=k*Math.PI*2/5;const m=new THREE.Mesh(new THREE.DodecahedronGeometry(.42,0),stageMat(0x3c8b50));m.position.set(Math.cos(a)*.38,.35,Math.sin(a)*.38);g.add(m)}g.position.set(x,0,z);arena.add(g);
   }else if(t==='hex'){
     const m=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,2.2,6),stageMat(style.obs,style.accent,.35,.3,.35));m.position.set(x,1.1,z);arena.add(m);const c=new THREE.Mesh(new THREE.OctahedronGeometry(.32),stageMat(0xffffff,style.accent,.95,.2,.1));c.position.set(x,2.38,z);arena.add(c);
   }else{
     const w=i%2?1.3:.95, h=i%2?.55:.9;
     const m=decoBox(x,z,w,.72,h,style.obs,0,0);m.rotation.y=(i%2?Math.PI/2:0);
     const band=decoBox(x,z,w*1.03,.75,.10,style.accent,style.accent,.24);band.position.y=h*.62;
   }
 });
}
function build(t){
 clear(arena);obs=[];bushes=[];const style=STAGE_STYLE[t]||STAGE_STYLE.square;
 scene.background.setHex(style.bg);scene.fog.color.setHex(style.bg);
 const under=new THREE.Mesh(new THREE.BoxGeometry(21.6,.72,14.6),stageMat(style.edge,0,0,.95,.03));under.position.y=-.56;under.receiveShadow=true;arena.add(under);
 const f=new THREE.Mesh(new THREE.BoxGeometry(19,.36,12.4),stageMat(style.floor,0,0,.82,.08));f.position.y=-.18;f.receiveShadow=true;arena.add(f);
 const grid=new THREE.GridHelper(19,19,style.accent,0x526175);grid.material.transparent=true;grid.material.opacity=.22;grid.position.y=.012;arena.add(grid);
 // spawn lanes and center objective area
 glowCircle(0,-4.5,1.15,0x74d5ff,.12);ringMark(0,-4.5,.82,1.00,0x74d5ff,.48);
 glowCircle(0, 4.5,1.15,0xff7b92,.12);ringMark(0, 4.5,.82,1.00,0xff7b92,.48);
 centerDesign(t,style);perimeter(style);stageScenery(t,style);
 if(t==='square')[-3,3].forEach(x=>[-1.7,1.7].forEach(z=>box(x,z,1.4,1.4,1.35,style.obs)));
 if(t==='pillars')[-3,3].forEach(x=>[-2,2].forEach(z=>cyl(x,z,.75,1.65,style.obs)));
 if(t==='ring'){cyl(0,0,2,1.35,style.obs);box(-6,0,1,3.4,1.35,style.obs);box(6,0,1,3.4,1.35,style.obs)}
 if(t==='cross'){box(0,0,1.15,4.5,1.35,style.obs);box(0,0,4.5,1.15,1.35,style.obs)}
 if(t==='hex')for(let i=0;i<6;i++){const a=i*Math.PI/3;cyl(Math.sin(a)*3.2,Math.cos(a)*3.2,.55,1.55,style.obs)}
 if(t==='fort'){box(-3.8,2.2,3,.75,1.4,style.obs);box(3.8,-2.2,3,.75,1.4,style.obs);box(-5,1.2,.75,2.7,1.4,style.obs);box(5,-1.2,.75,2.7,1.4,style.obs);box(-1.5,0,.8,2,1.4,style.obs);box(1.5,0,.8,2,1.4,style.obs)}
 if(t==='bush'){box(-4.2,0,.8,2.7,1.25,style.obs);box(4.2,0,.8,2.7,1.25,style.obs);[[-2,-1.7],[2,1.7],[-2,1.7],[2,-1.7],[0,0]].forEach(v=>bush(...v))}
 if(t==='crates')[[-3,-1.8],[3,1.8],[3,-1.8],[-3,1.8],[0,0],[-6,0],[6,0]].forEach((v,i)=>box(v[0],v[1],1.15,1.15,1,0xa46f42,{hp:i===4?70:45}));
}
'''
js=js[:start]+replacement+js[end:]

# Fit the entire arena in every aspect ratio, with portrait as the design target.
old="function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();"
new="function resize(){renderer.setSize(innerWidth,innerHeight,false);const aspect=innerWidth/Math.max(1,innerHeight),worldW=21.0,worldH=14.0;let hw,hh;if(aspect>=worldW/worldH){hh=worldH/2;hw=hh*aspect}else{hw=worldW/2;hh=hw/aspect}camera.left=-hw;camera.right=hw;camera.top=hh;camera.bottom=-hh;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();"
if old not in js:
    raise SystemExit('resize hook not found')
js=js.replace(old,new,1)

# Public version marker.
html=html.replace('Duel Arena v0.6.6.6','Duel Arena v0.6.6.8')
html=html.replace('<strong>v0.6.6.6</strong><span>STAGE GRAPHICS BUILD</span>','<strong>v0.6.6.8</strong><span>PUBLIC GRAPHICS RESTORE</span>')

js_path.write_text(js,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.6.8 public graphics restore applied')
