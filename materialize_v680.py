from pathlib import Path

js_path=Path('src/main.js')
css_path=Path('style.css')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
css=css_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'v6.8.0' in html and 'getLiveViewport' in js and 'v6.8.0 resolution adaptive split' in css:
    print('v6.8.0 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.7.9','Duel Arena v6.8.0')
html=html.replace('<strong>v6.7.9</strong><span>SPLIT VIEW FIX</span>','<strong>v6.8.0</strong><span>RESOLUTION ADAPTIVE SPLIT</span>')

old="""function updateChaseCamera(i,cam,aspect){
  const me=players[i],op=players[1-i];if(!me?.root||!op?.root)return;
  const a=me.root.position,b=op.root.position;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  const ux=dx/len,uz=dz/len;
  const dist=THREE.MathUtils.clamp(len,2.5,18);
  const back=THREE.MathUtils.clamp(4.8+dist*.12,5.1,7.0);
  const height=THREE.MathUtils.clamp(4.2+dist*.08,4.5,5.8);
  const target=new THREE.Vector3(
    THREE.MathUtils.lerp(a.x,b.x,.42),
    .8,
    THREE.MathUtils.lerp(a.z,b.z,.42)
  );
  const desired=new THREE.Vector3(a.x-ux*back,height,a.z-uz*back);
  cam.position.lerp(desired,.24);
  cam.aspect=aspect;cam.fov=THREE.MathUtils.clamp(48-dist*.18,43,48);cam.updateProjectionMatrix();
  cam.up.set(0,i===1?-1:1,0);
  cam.lookAt(target);
}"""
new="""function updateChaseCamera(i,cam,aspect){
  const me=players[i],op=players[1-i];if(!me?.root||!op?.root)return;
  const a=me.root.position,b=op.root.position;
  const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;
  const ux=dx/len,uz=dz/len;
  const dist=THREE.MathUtils.clamp(len,2.5,18);
  // Split-screen is much shorter than a full-screen camera. Frame from the
  // actual half-screen aspect ratio instead of fixed phone assumptions.
  const narrow=Math.max(0,1-Math.min(1,aspect));
  const back=THREE.MathUtils.clamp(2.45+dist*.055+narrow*1.15,2.55,4.05);
  const height=THREE.MathUtils.clamp(5.25+dist*.075+narrow*1.4,5.45,7.45);
  const targetMix=THREE.MathUtils.clamp(.34+dist*.008,.35,.46);
  const target=new THREE.Vector3(
    THREE.MathUtils.lerp(a.x,b.x,targetMix),
    .72,
    THREE.MathUtils.lerp(a.z,b.z,targetMix)
  );
  let cx=a.x-ux*back,cz=a.z-uz*back;
  // Never put a chase camera behind the arena wall; that was the main cause
  // of the large dark/empty half-screen on phones.
  cx=THREE.MathUtils.clamp(cx,-A.hw+1.05,A.hw-1.05);
  cz=THREE.MathUtils.clamp(cz,-A.hh+1.05,A.hh-1.05);
  const desired=new THREE.Vector3(cx,height,cz);
  cam.position.lerp(desired,.28);
  cam.aspect=Math.max(.45,aspect);
  cam.fov=THREE.MathUtils.clamp(56+narrow*13+Math.max(0,7-dist)*.35,54,70);
  cam.updateProjectionMatrix();
  cam.up.set(0,i===1?-1:1,0);
  cam.lookAt(target);
}"""
if old not in js: raise SystemExit('updateChaseCamera anchor not found')
js=js.replace(old,new,1)

old="""function renderSplitArena(){
  const canvas=renderer.domElement,w=canvas.width,h=canvas.height;
  const bottomH=Math.round(h*.5),topH=h-bottomH;
  const bottomAspect=w/Math.max(1,bottomH),topAspect=w/Math.max(1,topH);
  renderer.setScissorTest(true);
  updateChaseCamera(0,chaseCameras[0],bottomAspect);
  renderer.setViewport(0,0,w,bottomH);renderer.setScissor(0,0,w,bottomH);_baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],topAspect);
  renderer.setViewport(0,bottomH,w,topH);renderer.setScissor(0,bottomH,w,topH);_baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}"""
new="""function getLiveViewport(){
  const vv=window.visualViewport;
  return {w:Math.max(1,Math.round(vv?.width||document.documentElement.clientWidth||innerWidth)),h:Math.max(1,Math.round(vv?.height||document.documentElement.clientHeight||innerHeight))};
}
function renderSplitArena(){
  const size=new THREE.Vector2();renderer.getDrawingBufferSize(size);
  const w=Math.max(1,Math.floor(size.x)),h=Math.max(2,Math.floor(size.y));
  // Every view gets exactly 50% of the CURRENT drawing buffer, regardless of
  // DPR, device resolution, browser chrome or safe-area changes.
  const bottomH=Math.floor(h*.5),topH=h-bottomH;
  const bottomAspect=w/Math.max(1,bottomH),topAspect=w/Math.max(1,topH);
  renderer.setScissorTest(true);
  updateChaseCamera(0,chaseCameras[0],bottomAspect);
  renderer.setViewport(0,0,w,bottomH);renderer.setScissor(0,0,w,bottomH);_baseRender(scene,chaseCameras[0]);
  updateChaseCamera(1,chaseCameras[1],topAspect);
  renderer.setViewport(0,bottomH,w,topH);renderer.setScissor(0,bottomH,w,topH);_baseRender(scene,chaseCameras[1]);
  renderer.setScissorTest(false);renderer.setViewport(0,0,w,h);
}"""
if old not in js: raise SystemExit('renderSplitArena v679 anchor not found')
js=js.replace(old,new,1)

old="""function resize(){renderer.setSize(innerWidth,innerHeight,false);const portrait=innerHeight>=innerWidth;const aspect=portrait?Math.max(.78,(innerWidth/innerHeight)*1.55):innerWidth/innerHeight;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}topCamera.left=-hw;topCamera.right=hw;topCamera.top=hh;topCamera.bottom=-hh;topCamera.updateProjectionMatrix();arenaCamera.aspect=innerWidth/Math.max(1,innerHeight);arenaCamera.updateProjectionMatrix()}addEventListener('resize',resize);resize();"""
new="""function resize(){const vp=getLiveViewport(),w=vp.w,h=vp.h;renderer.setSize(w,h,false);renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';document.documentElement.style.setProperty('--live-vw',w+'px');document.documentElement.style.setProperty('--live-vh',h+'px');const portrait=h>=w;const aspect=portrait?Math.max(.78,(w/h)*1.55):w/h;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}topCamera.left=-hw;topCamera.right=hw;topCamera.top=hh;topCamera.bottom=-hh;topCamera.updateProjectionMatrix();arenaCamera.aspect=w/Math.max(1,h);arenaCamera.updateProjectionMatrix()}addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);resize();"""
if old not in js: raise SystemExit('resize anchor not found')
js=js.replace(old,new,1)

css += """

/* v6.8.0 resolution adaptive split */
html,body,#game-wrap{
  width:var(--live-vw,100vw);
  height:var(--live-vh,100dvh);
  min-height:0;
}
#game{position:absolute;inset:0;width:100%;height:100%}
body.split-arena .stick-zone{
  width:50%;height:50%;max-width:none;max-height:none;
}
body.split-arena .stick{
  width:clamp(72px,21vw,112px);
  height:clamp(72px,21vw,112px);
}
body.split-arena .stick-zone.p1 .stick{top:60%}
body.split-arena .stick-zone.p2 .stick{top:40%}
body.split-arena .hud{width:min(68vw,520px)}
body.split-arena .hud.one{bottom:clamp(8px,1.6vh,18px)}
body.split-arena .hud.two{top:clamp(8px,1.6vh,18px)}
body.split-arena .super-btn.p1{bottom:clamp(70px,8.5vh,118px)}
body.split-arena .super-btn.p2{top:clamp(70px,8.5vh,118px)}
body.split-arena .def-btn.p1{bottom:clamp(118px,14vh,180px)}
body.split-arena .def-btn.p2{top:clamp(118px,14vh,180px)}
@media (max-width:430px){
  body.split-arena .hud{width:72vw;grid-template-columns:62px 1fr 1fr 66px;gap:5px;padding:6px 8px}
  body.split-arena .name{font-size:10px}
  body.split-arena .score{letter-spacing:2px}
}
"""

js_path.write_text(js,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.8.0 resolution adaptive split materialized')
