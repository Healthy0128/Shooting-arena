import * as THREE from 'three';

const EFFECTS={
  rifle:{color:0xfff3b0,length:.42,radius:.055,impact:0xffd77a,count:9,shake:1.2},
  scatter:{color:0xffa65c,length:.5,radius:.12,impact:0xff8b52,count:15,shake:3.1},
  rapid:{color:0x78d8ff,length:.32,radius:.045,impact:0x65cfff,count:7,shake:.8},
  arcane:{color:0x62f6df,length:.56,radius:.09,impact:0x74ffe8,count:13,shake:1.5},
  bladegun:{color:0xff83c6,length:.48,radius:.06,impact:0xff8fd0,count:11,shake:1.2},
  cannon:{color:0xff7048,length:.72,radius:.16,impact:0xff653f,count:22,shake:5.4},
  seeker:{color:0x63f4db,length:.58,radius:.1,impact:0x72ffe8,count:16,shake:2.2},
  shock:{color:0xffb14f,length:.4,radius:.15,impact:0xffc663,count:18,shake:3.5},
  rail:{color:0xff5e78,length:.95,radius:.11,impact:0xff7890,count:24,shake:6.2}
};
const IMPACT_SCALE={light:.72,normal:1,heavy:1.38,ko:1.72};

export function createWeaponEffectsController({scene,matchLater,particleBurst,tone,cameraShake,shotSfx}){
  const transientMeshes=new Set();
  const slashEffects=new Map();
  function config(style){return EFFECTS[style]||EFFECTS.rifle}

  function disposeMesh(mesh){
    if(!transientMeshes.has(mesh))return;
    transientMeshes.delete(mesh);
    scene.remove(mesh);
    mesh.geometry?.dispose?.();
    mesh.material?.dispose?.();
  }

  function muzzle(style,position,direction,powered=false){
    const cfg=config(style);
    const dir=direction.clone().normalize();
    const streak=new THREE.Mesh(
      new THREE.CylinderGeometry(cfg.radius*.35,cfg.radius,cfg.length,8,1),
      new THREE.MeshBasicMaterial({color:powered?0xffef7a:cfg.color,transparent:true,opacity:.92,depthWrite:false})
    );
    streak.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
    streak.position.copy(position).addScaledVector(dir,cfg.length*.5);
    scene.add(streak);
    transientMeshes.add(streak);
    matchLater(()=>disposeMesh(streak),52);

    const glow=new THREE.Mesh(
      new THREE.SphereGeometry(cfg.radius*1.45,8,6),
      new THREE.MeshBasicMaterial({color:powered?0xffffff:cfg.color,transparent:true,opacity:.82,depthWrite:false})
    );
    glow.position.copy(position);
    scene.add(glow);
    transientMeshes.add(glow);
    matchLater(()=>disposeMesh(glow),72);
    cameraShake?.(cfg.shake,style==='cannon'||style==='rail'?150:85);
  }

  function impact(style,position,kind='player',bounces=0,tier='normal'){
    const cfg=config(style);
    const scale=kind==='player'?(IMPACT_SCALE[tier]||1):.78;
    const color=style==='bladegun'&&bounces>0?0xffffff:cfg.impact;
    particleBurst(
      position.clone().setY(Math.max(.35,position.y||.75)),
      color,
      Math.max(5,Math.ceil(cfg.count*scale)),
      ((style==='cannon'||style==='rail')?.105:.065)*Math.min(1.45,scale)
    );

    const ring=new THREE.Mesh(
      new THREE.RingGeometry(cfg.radius*1.8,cfg.radius*3.7,24),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.78,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.copy(position);
    ring.position.y=Math.max(.06,position.y||.06);
    ring.scale.setScalar(scale);
    scene.add(ring);
    transientMeshes.add(ring);
    matchLater(()=>disposeMesh(ring),105);
  }

  function shotSound(style){
    shotSfx?.(style);
    if(style==='shock'){
      tone(118,.08,'square',.032,90);matchLater(()=>tone(76,.07,'sawtooth',.02,-25),28);
    }else if(style==='seeker'){
      tone(330,.07,'sine',.026,210);matchLater(()=>tone(510,.05,'triangle',.018,80),32);
    }else if(style==='rail'){
      tone(740,.045,'sawtooth',.035,-520);matchLater(()=>tone(92,.1,'square',.03,-28),25);
    }else if(style==='scatter'){
      tone(92,.065,'square',.03,35);matchLater(()=>tone(138,.04,'square',.018,-25),24);
    }else if(style==='rapid')tone(245,.028,'square',.016,95);
    else if(style==='arcane'){
      tone(410,.07,'sine',.028,180);matchLater(()=>tone(620,.045,'sine',.016,-100),30);
    }else if(style==='bladegun')tone(215,.04,'triangle',.02,120);
    else if(style==='cannon'){
      tone(68,.11,'sawtooth',.04,22);matchLater(()=>tone(105,.065,'square',.022,-35),36);
    }else tone(180,.04,'square',.02,85);
  }

  function clear(){
    [...transientMeshes].forEach(disposeMesh);
    slashEffects.forEach(effect=>{
      scene.remove(effect.root);
      effect.root.traverse(part=>{
        part.geometry?.dispose?.();
        part.material?.dispose?.();
      });
    });
    slashEffects.clear();
  }

  function createSlashEffect(owner){
    const root=new THREE.Group();
    const start=-Math.PI*155/180;
    const length=Math.PI*130/180;
    const glow=new THREE.Mesh(
      new THREE.RingGeometry(.38,1.72,48,1,start,length),
      new THREE.MeshBasicMaterial({color:0xffe5a1,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false})
    );
    const edge=new THREE.Mesh(
      new THREE.RingGeometry(1.48,1.78,48,1,start,length),
      new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,side:THREE.DoubleSide,depthWrite:false})
    );
    glow.rotation.x=edge.rotation.x=-Math.PI/2;
    root.add(glow,edge);
    root.visible=false;
    root.userData.slashToken=0;
    scene.add(root);
    const effect={root,glow,edge};
    slashEffects.set(owner,effect);
    return effect;
  }

  function slash(position,direction,color=0xffe5a1,owner=0){
    const effect=slashEffects.get(owner)||createSlashEffect(owner);
    const token=++effect.root.userData.slashToken;
    effect.glow.material.color.set(color);
    effect.edge.material.color.set(0xffffff);
    effect.root.position.copy(position).setY(.72);
    effect.root.rotation.y=Math.atan2(direction.x,direction.z);
    effect.root.scale.setScalar(1);
    effect.root.visible=true;
    matchLater(()=>{
      if(effect.root.userData.slashToken===token)effect.root.visible=false;
    },180);
  }

  return {muzzle,impact,shotSound,slash,clear};
}
