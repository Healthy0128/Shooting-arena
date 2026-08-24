import * as THREE from 'three';

const STYLE_META={
  rifle:{color:'#8fd7ff',glow:'#2a8cff',shape:'bolt',scale:[2.5,.72]},
  scatter:{color:'#ffbf66',glow:'#ff6a2a',shape:'pellet',scale:[1.25,1.25]},
  rapid:{color:'#b8ff7a',glow:'#39d85c',shape:'tracer',scale:[2.8,.58]},
  arcane:{color:'#c692ff',glow:'#7138ff',shape:'rune',scale:[2.1,2.1]},
  bladegun:{color:'#ff8bc4',glow:'#ff397f',shape:'blade',scale:[2.0,2.0]},
  cannon:{color:'#ff765f',glow:'#b81d22',shape:'core',scale:[2.2,2.2]},
  seeker:{color:'#8affeb',glow:'#18a99a',shape:'missile',scale:[3.1,.9]},
  shock:{color:'#ffd071',glow:'#ff7a28',shape:'wave',scale:[2.5,2.5]},
  rail:{color:'#ff8ea0',glow:'#ff254d',shape:'rail',scale:[4.2,.62]}
};

function makeTexture(meta){
  const canvas=document.createElement('canvas');
  canvas.width=128;
  canvas.height=128;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(64,64,4,64,64,58);
  gradient.addColorStop(0,meta.color);
  gradient.addColorStop(.42,meta.glow);
  gradient.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,128,128);
  ctx.save();
  ctx.translate(64,64);
  ctx.fillStyle='#ffffff';
  ctx.strokeStyle=meta.color;
  ctx.lineWidth=6;
  ctx.shadowColor=meta.glow;
  ctx.shadowBlur=18;
  ctx.beginPath();
  if(meta.shape==='bolt'){
    ctx.moveTo(-42,-9);ctx.lineTo(22,-9);ctx.lineTo(42,0);ctx.lineTo(22,9);ctx.lineTo(-42,9);ctx.closePath();
  }else if(meta.shape==='pellet'){
    ctx.arc(0,0,17,0,Math.PI*2);
  }else if(meta.shape==='tracer'){
    ctx.roundRect(-46,-7,88,14,7);
  }else if(meta.shape==='missile'){
    ctx.moveTo(-44,-10);ctx.lineTo(24,-10);ctx.lineTo(45,0);ctx.lineTo(24,10);ctx.lineTo(-44,10);ctx.lineTo(-31,0);ctx.closePath();
  }else if(meta.shape==='rail'){
    ctx.moveTo(-49,-5);ctx.lineTo(35,-5);ctx.lineTo(49,0);ctx.lineTo(35,5);ctx.lineTo(-49,5);ctx.closePath();
  }else if(meta.shape==='wave'){
    ctx.arc(0,0,29,0,Math.PI*2);
    ctx.arc(0,0,16,0,Math.PI*2,true);
  }else if(meta.shape==='rune'){
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3-Math.PI/2;
      const radius=i%2?17:29;
      const x=Math.cos(angle)*radius;
      const y=Math.sin(angle)*radius;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.closePath();
  }else if(meta.shape==='blade'){
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4-Math.PI/2;
      const radius=i%2?10:34;
      const x=Math.cos(angle)*radius;
      const y=Math.sin(angle)*radius;
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.closePath();
  }else{
    ctx.arc(0,0,24,0,Math.PI*2);
  }
  ctx.fill();
  ctx.stroke();
  if(meta.shape==='rune'||meta.shape==='blade'){
    ctx.beginPath();
    ctx.arc(0,0,7,0,Math.PI*2);
    ctx.fillStyle=meta.glow;
    ctx.fill();
  }
  ctx.restore();
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

export function createProjectileVisualController(){
  const textures=new Map();

  function textureFor(style){
    const key=STYLE_META[style]?style:'rifle';
    if(!textures.has(key))textures.set(key,makeTexture(STYLE_META[key]));
    return textures.get(key);
  }

  function create(style,radius,powered=false){
    const key=STYLE_META[style]?style:'rifle';
    const meta=STYLE_META[key];
    const size=Math.max(.32,radius*3.2);
    const root=new THREE.Group();
    const directional=key==='rifle'||key==='rapid'||key==='seeker'||key==='rail';
    root.userData.visualParts=[];
    root.userData.directional=directional;

    if(directional){
      const geometry=new THREE.PlaneGeometry(size*meta.scale[0],size*meta.scale[1]);
      const makeMaterial=()=>new THREE.MeshBasicMaterial({
        map:textureFor(key),
        color:powered?0xffffff:meta.color,
        transparent:true,
        depthWrite:false,
        side:THREE.DoubleSide,
        blending:THREE.AdditiveBlending
      });
      const horizontal=new THREE.Mesh(geometry,makeMaterial());
      horizontal.rotation.x=-Math.PI/2;
      const vertical=new THREE.Mesh(geometry.clone(),makeMaterial());
      root.add(horizontal,vertical);
      root.userData.visualParts.push(horizontal,vertical);
    }else{
      const material=new THREE.SpriteMaterial({
        map:textureFor(key),
        color:powered?0xffffff:meta.color,
        transparent:true,
        depthWrite:false,
        blending:THREE.AdditiveBlending
      });
      const sprite=new THREE.Sprite(material);
      sprite.scale.set(size*meta.scale[0],size*meta.scale[1],1);
      root.add(sprite);
      root.userData.projectileSprite=sprite;
      root.userData.baseScale=sprite.scale.clone();
      root.userData.visualParts.push(sprite);
    }
    return root;
  }

  function update(bullet,dt,elapsed){
    if(bullet.mesh.userData.directional){
      bullet.mesh.rotation.y=Math.atan2(-bullet.vel.z,bullet.vel.x);
      return;
    }
    const sprite=bullet.mesh.userData.projectileSprite;
    if(!sprite)return;
    const base=bullet.mesh.userData.baseScale;
    if(bullet.style==='arcane'){
      sprite.material.rotation+=dt*3.2;
      const pulse=1+.13*Math.sin(elapsed*.02);
      sprite.scale.copy(base).multiplyScalar(pulse);
    }else if(bullet.style==='bladegun'){
      sprite.material.rotation+=dt*11;
    }else if(bullet.style==='cannon'||bullet.style==='shock'){
      const pulse=1+.08*Math.sin(elapsed*.015);
      sprite.scale.copy(base).multiplyScalar(pulse);
    }
  }

  function ricochet(bullet){
    const parts=bullet.mesh.userData.visualParts||[];
    parts.forEach(part=>part.material?.color?.offsetHSL?.(.02,.04,.08));
    const sprite=bullet.mesh.userData.projectileSprite;
    if(sprite){
      sprite.scale.multiplyScalar(1.08);
      bullet.mesh.userData.baseScale.copy(sprite.scale);
    }else{
      bullet.mesh.scale.multiplyScalar(1.08);
    }
  }

  function dispose(root){
    (root.userData.visualParts||[]).forEach(part=>{
      part.geometry?.dispose?.();
      part.material?.dispose?.();
    });
  }

  return {create,update,ricochet,dispose};
}
