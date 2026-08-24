import * as THREE from 'three';
import { ARENA, PROPS } from './arena-config.js?v=695';

function addPaintStripe(parent,x,z,w,h,color,rot=0,y=.015,opacity=.92){
  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false})
  );
  mesh.rotation.x=-Math.PI/2;
  mesh.rotation.z=rot;
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return mesh;
}

function addSpawnPads(arenaRoot,theme,type){
  const group=new THREE.Group();
  arenaRoot.add(group);
  [-12,12].forEach((x,index)=>{
    const base=new THREE.Mesh(
      new THREE.CylinderGeometry(1.55,1.75,.18,32),
      new THREE.MeshStandardMaterial({color:theme.edge,roughness:.55,metalness:.3,emissive:theme.accent,emissiveIntensity:.12})
    );
    base.position.set(x,.05,0);
    group.add(base);

    const ring=new THREE.Mesh(
      new THREE.RingGeometry(1.06,1.34,36),
      new THREE.MeshBasicMaterial({color:index===0?0x5dc5ff:0xff6d8f,transparent:true,opacity:.72,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.set(x,.15,0);
    group.add(ring);

    for(let i=0;i<4;i++){
      const a=i*Math.PI/2;
      addPaintStripe(group,x+Math.cos(a)*1.65,Math.sin(a)*1.65,.55,.12,theme.accentSoft,a,.16,.58);
    }
  });

  if(type==='fort'){
    addPaintStripe(group,-12,0,3.8,.22,theme.accentSoft,0,.16,.42);
    addPaintStripe(group,12,0,3.8,.22,theme.accentSoft,0,.16,.42);
  }
}

function addStageArchitecture(arenaRoot,type,theme,attachPropVisual,buildId){
  const group=new THREE.Group();
  arenaRoot.add(group);

  const dark=new THREE.MeshStandardMaterial({color:theme.edge,roughness:.82,metalness:.22});
  const metal=new THREE.MeshStandardMaterial({color:theme.rim,roughness:.45,metalness:.5,emissive:theme.accent,emissiveIntensity:.12});
  const glowMat=new THREE.MeshStandardMaterial({color:theme.accentSoft,roughness:.2,metalness:.12,emissive:theme.glow,emissiveIntensity:.7});

  const addBox=(x,y,z,w,h,d,mat=dark)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z);
    group.add(mesh);
    return mesh;
  };
  const addPole=(x,z,h=4,r=.25,mat=metal)=>{
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.12,h,8),mat);
    mesh.position.set(x,h/2,z);
    group.add(mesh);
    return mesh;
  };

  if(type==='square'){
    [-11,0,11].forEach(x=>{
      addPole(x,-12.6,5,.22);
      addPole(x,12.6,5,.22);
      addBox(x,4.7,-12.6,3.6,.18,.28,metal);
      addBox(x,4.7,12.6,3.6,.18,.28,metal);
    });
    [-15.2,15.2].forEach(x=>[-7.2,7.2].forEach(z=>{
      addBox(x,1.3,z,2.2,2.6,2.2,dark);
      addBox(x,2.75,z,1.55,.18,1.55,glowMat);
    }));
  }else if(type==='pillars'){
    [[-14,-9],[-14,9],[14,-9],[14,9]].forEach(([x,z],i)=>{
      const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.35,.5,12),dark);
      plinth.position.set(x,.25,z);
      group.add(plinth);
      const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.58,.7,4.6,12),metal);
      shaft.position.set(x,2.65,z);
      group.add(shaft);
      const crown=new THREE.Mesh(new THREE.CylinderGeometry(.95,.7,.5,12),glowMat);
      crown.position.set(x,5.08,z);
      group.add(crown);
      if(i%2===0){
        const light=new THREE.PointLight(theme.glow,.45,7,2);
        light.position.set(x,5.2,z);
        group.add(light);
      }
    });
  }else if(type==='ring'){
    [[-14.3,-7.8],[-14.3,7.8],[14.3,-7.8],[14.3,7.8]].forEach(([x,z])=>{
      addPole(x,z,4.8,.2);
      const halo=new THREE.Mesh(new THREE.TorusGeometry(.8,.1,8,24),glowMat);
      halo.position.set(x,4.6,z);
      halo.rotation.x=Math.PI/2;
      group.add(halo);
    });
    [-7,0,7].forEach(x=>{
      addBox(x,.9,-12.3,4.8,1.8,1.4,dark);
      addBox(x,.9,12.3,4.8,1.8,1.4,dark);
      addPaintStripe(group,x,-11.55,3.8,.18,theme.accent,0,.06,.72);
      addPaintStripe(group,x,11.55,3.8,.18,theme.accent,0,.06,.72);
    });
  }else if(type==='cross'){
    [-14.6,14.6].forEach(x=>[-7.5,0,7.5].forEach((z,i)=>{
      addBox(x,1.7,z,1.4,3.4,2.1,dark);
      for(let y=.7;y<2.9;y+=.7)addBox(x+(x<0?.72:-.72),y,z,.06,.35,1.45,glowMat);
      if(i===1)addPole(x*.93,z,5.2,.16);
    }));
  }else if(type==='hex'){
    const core=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.5,.34,6),dark);
    core.position.set(0,.2,0);
    core.rotation.y=Math.PI/6;
    group.add(core);

    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.72,0),glowMat);
    crystal.position.set(0,2.7,0);
    group.add(crystal);

    const halo1=new THREE.Mesh(new THREE.TorusGeometry(1.45,.08,8,36),glowMat);
    halo1.position.set(0,2.7,0);
    halo1.rotation.x=Math.PI/2;
    group.add(halo1);
    const halo2=halo1.clone();
    halo2.scale.setScalar(.72);
    halo2.rotation.y=Math.PI/2;
    group.add(halo2);

    for(let i=0;i<6;i++){
      const a=i*Math.PI/3+Math.PI/6;
      const x=Math.cos(a)*14.2,z=Math.sin(a)*8.8;
      addPole(x,z,5,.18);
      const node=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,0),glowMat);
      node.position.set(x,5.05,z);
      group.add(node);
    }
  }else if(type==='fort'){
    [-1,1].forEach(side=>{
      const x=side*14.1;
      addBox(x,1.15,-6.8,3.6,2.3,3.2,dark);
      addBox(x,1.15,6.8,3.6,2.3,3.2,dark);
      [-6.8,6.8].forEach(z=>{
        [-1.2,0,1.2].forEach(offset=>addBox(x+offset,.32,z-1.8,.8,.65,.8,metal));
        addPole(x-side*1.5,z,4.8,.14);
        const flag=new THREE.Mesh(
          new THREE.PlaneGeometry(1.7,1.05),
          new THREE.MeshBasicMaterial({color:theme.accent,side:THREE.DoubleSide,transparent:true,opacity:.85})
        );
        flag.position.set(x-side*1.52,4.15,z);
        flag.rotation.y=Math.PI/2;
        group.add(flag);
      });
    });
  }else if(type==='bush'){
    const trunkMat=new THREE.MeshStandardMaterial({color:0x4a3426,roughness:1});
    const leafMat=new THREE.MeshStandardMaterial({color:0x2f6b42,roughness:1});
    [[-15,-8.5],[-15,8.5],[15,-8.5],[15,8.5],[-8,-12],[8,-12],[-8,12],[8,12]].forEach(([x,z],i)=>{
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.26,.38,2.4,7),trunkMat);
      trunk.position.set(x,1.2,z);
      group.add(trunk);
      const crown=new THREE.Mesh(new THREE.ConeGeometry(1.55+(i%3)*.15,3.4,8),leafMat);
      crown.position.set(x,3.5,z);
      crown.rotation.y=i*.7;
      group.add(crown);
    });
  }else if(type==='crates'){
    [[-14.3,-7.4],[-14.3,6.2],[14.3,-6.2],[14.3,7.4]].forEach(([x,z],i)=>{
      const holder=new THREE.Group();
      holder.position.set(x,0,z);
      group.add(holder);
      attachPropVisual([PROPS.boxA,PROPS.boxB,PROPS.boxC][i%3],holder,{scale:1.15,rotY:i%2?Math.PI/2:0},buildId);

      const top=new THREE.Group();
      top.position.set(x,1.35,z);
      group.add(top);
      attachPropVisual(PROPS.boxA,top,{scale:.9,rotY:i%2?0:Math.PI/2},buildId);
    });
    [-9,0,9].forEach(x=>{
      addPole(x,-12.5,5.2,.18);
      addPole(x,12.5,5.2,.18);
      addBox(x,5,-12.5,3,.15,.22,glowMat);
      addBox(x,5,12.5,3,.15,.22,glowMat);
    });
  }
}

export function addStageVisuals({arenaRoot,type,theme,attachPropVisual,buildId}){
  addSpawnPads(arenaRoot,theme,type);
  addStageArchitecture(arenaRoot,type,theme,attachPropVisual,buildId);
}
