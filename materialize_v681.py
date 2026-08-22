from pathlib import Path

js_path=Path('src/main.js')
css_path=Path('style.css')
html_path=Path('index.html')
js=js_path.read_text(encoding='utf-8')
css=css_path.read_text(encoding='utf-8')
html=html_path.read_text(encoding='utf-8')

if 'v6.8.1' in html and 'configureTopCamera' in js and 'v6.8.1 canvas coordinate fix' in css:
    print('v6.8.1 already materialized')
    raise SystemExit(0)

html=html.replace('Duel Arena v6.8.0','Duel Arena v6.8.1')
html=html.replace('<strong>v6.8.0</strong><span>RESOLUTION ADAPTIVE SPLIT</span>','<strong>v6.8.1</strong><span>CANVAS COORDINATE FIX</span>')

# Remove visualViewport-based sizing and use layout viewport / actual canvas CSS rect.
old="""function getLiveViewport(){
  const vv=window.visualViewport;
  return {w:Math.max(1,Math.round(vv?.width||document.documentElement.clientWidth||innerWidth)),h:Math.max(1,Math.round(vv?.height||document.documentElement.clientHeight||innerHeight))};
}"""
new="""function getCssViewport(){
  const root=document.documentElement;
  return {w:Math.max(1,Math.round(root.clientWidth||innerWidth)),h:Math.max(1,Math.round(innerHeight||root.clientHeight))};
}
function configureTopCamera(w,h){
  const aspect=w/Math.max(1,h),portrait=h>=w;
  if(portrait){
    // Rotate the projected battlefield 90 degrees: world X becomes screen Y.
    // This matches the portrait device instead of forcing the landscape arena
    // into a narrow phone viewport.
    topCamera.up.set(1,0,0);
    const projectedWidth=A.hh*2+0.7; // world Z span on screen X
    const projectedHeight=projectedWidth/Math.max(.32,aspect);
    topCamera.left=-projectedWidth/2;topCamera.right=projectedWidth/2;
    topCamera.top=projectedHeight/2;topCamera.bottom=-projectedHeight/2;
  }else{
    topCamera.up.set(0,0,-1);
    const projectedWidth=A.hw*2+1.0;
    const projectedHeight=projectedWidth/Math.max(.55,aspect);
    topCamera.left=-projectedWidth/2;topCamera.right=projectedWidth/2;
    topCamera.top=projectedHeight/2;topCamera.bottom=-projectedHeight/2;
  }
  topCamera.lookAt(0,0,0);topCamera.updateProjectionMatrix();
}"""
if old not in js: raise SystemExit('getLiveViewport anchor not found')
js=js.replace(old,new,1)

old="""function screenVectorToWorld(pi,x,y){
  if(cameraMode!=='arena')return new THREE.Vector2(x,y);
  if(pi===1){x=-x;y=-y}
  const cam=chaseCameras[pi];
  const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);fwd.y=0;
  if(fwd.lengthSq()<.0001)fwd.set(pi?-1:1,0,0);else fwd.normalize();
  const right=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
  const wx=right.x*x+fwd.x*(-y),wz=right.z*x+fwd.z*(-y);
  const out=new THREE.Vector2(wx,wz);if(out.lengthSq()>1)out.normalize();return out;
}"""
new="""function screenVectorToWorld(pi,x,y){
  if(cameraMode==='arena'){
    if(pi===1){x=-x;y=-y}
    const cam=chaseCameras[pi];
    const fwd=new THREE.Vector3();cam.getWorldDirection(fwd);fwd.y=0;
    if(fwd.lengthSq()<.0001)fwd.set(pi?-1:1,0,0);else fwd.normalize();
    const right=new THREE.Vector3().crossVectors(fwd,new THREE.Vector3(0,1,0)).normalize();
    const wx=right.x*x+fwd.x*(-y),wz=right.z*x+fwd.z*(-y);
    const out=new THREE.Vector2(wx,wz);if(out.lengthSq()>1)out.normalize();return out;
  }
  // Shared TOP-DOWN also follows the actual camera orientation. This keeps
  // controls correct when the portrait camera is rotated 90 degrees.
  topCamera.updateMatrixWorld(true);
  const e=topCamera.matrixWorld.elements;
  const rightX=e[0],rightZ=e[2],upX=e[4],upZ=e[6];
  const out=new THREE.Vector2(rightX*x-upX*y,rightZ*x-upZ*y);
  if(out.lengthSq()>1)out.normalize();return out;
}"""
if old not in js: raise SystemExit('screenVectorToWorld anchor not found')
js=js.replace(old,new,1)

old="""function resize(){const vp=getLiveViewport(),w=vp.w,h=vp.h;renderer.setSize(w,h,false);renderer.domElement.style.width=w+'px';renderer.domElement.style.height=h+'px';document.documentElement.style.setProperty('--live-vw',w+'px');document.documentElement.style.setProperty('--live-vh',h+'px');const portrait=h>=w;const aspect=portrait?Math.max(.78,(w/h)*1.55):w/h;let hw=10.5,hh=hw/aspect;if(hh<7.25){hh=7.25;hw=hh*aspect}topCamera.left=-hw;topCamera.right=hw;topCamera.top=hh;topCamera.bottom=-hh;topCamera.updateProjectionMatrix();arenaCamera.aspect=w/Math.max(1,h);arenaCamera.updateProjectionMatrix()}addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);resize();"""
new="""function resize(){const vp=getCssViewport(),w=vp.w,h=vp.h;renderer.setSize(w,h,false);renderer.domElement.style.width='100%';renderer.domElement.style.height='100%';configureTopCamera(w,h);arenaCamera.aspect=w/Math.max(1,h);arenaCamera.updateProjectionMatrix()}addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,80));resize();"""
if old not in js: raise SystemExit('resize v680 anchor not found')
js=js.replace(old,new,1)

css += """

/* v6.8.1 canvas coordinate fix */
html,body,#game-wrap{width:100%;height:100dvh;min-height:0}
body{position:fixed;inset:0;overflow:hidden}
#game{position:absolute;inset:0;width:100%;height:100%;display:block}
/* v6.8.0 live-vw/live-vh custom properties are intentionally no longer used. */
"""

js_path.write_text(js,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
html_path.write_text(html,encoding='utf-8')
print('v6.8.1 canvas coordinate fix materialized')
