import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARENA, PROPS, STAGE_THEMES } from './arena-config.js?v=695';

export function createArenaController({scene}){
  const arenaRoot=new THREE.Group();
  scene.add(arenaRoot);

  const gltfLoader=new GLTFLoader();
  const propCache=new Map();
  let buildId=0;
  let obstacles=[];
  let bushes=[];

  function getArenaTheme(type){
    return STAGE_THEMES[type]||STAGE_THEMES.square;
  }

  async function loadProp(url){
    if(propCache.has(url))return propCache.get(url);
    const promise=new Promise((resolve,reject)=>gltfLoader.load(url,resolve,undefined,reject));
    propCache.set(url,promise);
    return promise;
  }

  async function attachPropVisual(url,holder,opts={},targetBuildId=buildId){
    try{
      const gltf=await loadProp(url);
      if(targetBuildId!==buildId||!holder.parent)return;

      const model=gltf.scene.clone(true);
      const scale=opts.scale??1;
      if(Array.isArray(scale))model.scale.set(scale[0],scale[1],scale[2]);
      else model.scale.setScalar(scale);

      model.rotation.y=opts.rotY||0;
      model.position.set(opts.ox||0,opts.oy||0,opts.oz||0);
      model.traverse(node=>{
        if(node.isMesh){
          node.castShadow=false;
          node.receiveShadow=false;
        }
      });
      holder.add(model);
      if(opts.fallback)opts.fallback.visible=false;
    }catch(err){
      console.warn('Stage prop fallback:',url,err);
    }
  }

  function clearGroup(group){
    while(group.children.length)group.remove(group.children[group.children.length-1]);
  }

  function makeFallbackBox(w,h,d,color=0x65748c){
    return new THREE.Mesh(
      new THREE.BoxGeometry(w,h,d),
      new THREE.MeshStandardMaterial({color,roughness:.78})
    );
  }

  function addRealBox(x,z,w,d,h=1.35,opts={}){
    const holder=new THREE.Group();
    holder.position.set(x,0,z);
    arenaRoot.add(holder);

    const fallback=makeFallbackBox(w,h,d,opts.color||0x66758e);
    fallback.position.y=h/2;
    holder.add(fallback);

    const collider={x,z,hw:w/2,hd:d/2,mesh:holder,destructible:!!opts.destructible,hp:opts.hp??0};
    obstacles.push(collider);

    attachPropVisual(opts.url||PROPS.wall,holder,{
      scale:opts.scale||[Math.max(.55,w/2),Math.max(.55,h/1.4),Math.max(.55,d/2)],
      rotY:opts.rotY||0,
      oy:opts.oy||0,
      fallback
    },buildId);
    return collider;
  }

  function addRealPillar(x,z,r=.8,h=1.8,variant='A'){
    const holder=new THREE.Group();
    holder.position.set(x,0,z);
    arenaRoot.add(holder);

    const fallback=new THREE.Mesh(
      new THREE.CylinderGeometry(r,r,h,18),
      new THREE.MeshStandardMaterial({color:0x71819a,roughness:.75})
    );
    fallback.position.y=h/2;
    holder.add(fallback);

    obstacles.push({x,z,hw:r,hd:r,circle:true,r,mesh:holder});
    attachPropVisual(variant==='B'?PROPS.pillarB:PROPS.pillarA,holder,{scale:Math.max(.7,r*1.35),fallback},buildId);
  }

  function addBush(x,z,r=1.25){
    const group=new THREE.Group();
    const mat=new THREE.MeshStandardMaterial({color:0x3f8c56,roughness:1,transparent:true,opacity:.76,depthWrite:false});

    for(let i=0;i<9;i++){
      const mesh=new THREE.Mesh(new THREE.ConeGeometry(.46,1.05,7),mat.clone());
      const angle=i/9*Math.PI*2;
      mesh.position.set(Math.cos(angle)*r*.45,.52,Math.sin(angle)*r*.45);
      mesh.rotation.y=angle;
      group.add(mesh);
    }

    group.position.set(x,0,z);
    arenaRoot.add(group);
    bushes.push({x,z,r,group});

    const deco=new THREE.Group();
    deco.position.set(x,0,z);
    arenaRoot.add(deco);
    attachPropVisual(PROPS.pallet,deco,{scale:.42,rotY:Math.PI/2},buildId);
  }

  function addWallRun(x,z,length,vertical=false,decorated=false){
    const seg=2.2;
    const count=Math.max(1,Math.round(length/seg));
    for(let i=0;i<count;i++){
      const offset=(i-(count-1)/2)*seg;
      addRealBox(
        x+(vertical?0:offset),
        z+(vertical?offset:0),
        vertical?.72:2.0,
        vertical?2.0:.72,
        1.25,
        {url:decorated?PROPS.wallDecorated:PROPS.wall,scale:1,rotY:vertical?Math.PI/2:0}
      );
    }
  }

  function addCrate(x,z,hp=48,variant=0){
    const urls=[PROPS.ammo,PROPS.boxA,PROPS.boxB,PROPS.boxC];
    return addRealBox(x,z,1.35,1.35,1.05,{destructible:true,hp,url:urls[variant%urls.length],scale:.88,color:0xb17b45});
  }

  function addBarrel(x,z,variant=0){
    const holder=new THREE.Group();
    holder.position.set(x,0,z);
    arenaRoot.add(holder);

    const fallback=new THREE.Mesh(
      new THREE.CylinderGeometry(.62,.62,1.15,16),
      new THREE.MeshStandardMaterial({color:0x6f7e98,roughness:.75})
    );
    fallback.position.y=.58;
    holder.add(fallback);

    obstacles.push({x,z,hw:.62,hd:.62,circle:true,r:.62,mesh:holder});
    const urls=[PROPS.barrelA,PROPS.barrelB,PROPS.barrelC];
    attachPropVisual(urls[variant%3],holder,{scale:.9,fallback},buildId);
  }

  function applyArenaTheme(theme){
    scene.background.setHex(theme.bg);
    scene.fog.color.setHex(theme.fog);
    scene.fog.near=34;
    scene.fog.far=66;
  }

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

  function addStageGlow(parent,x,z,r,color,height=.02,opacity=.48){
    const ring=new THREE.Mesh(
      new THREE.CircleGeometry(r,28),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.set(x,height,z);
    parent.add(ring);
    return ring;
  }

  function addArenaPerimeter(theme){
    const group=new THREE.Group();
    arenaRoot.add(group);

    const wallMat=new THREE.MeshStandardMaterial({color:theme.edge,roughness:.9,metalness:.08});
    const beamMat=new THREE.MeshStandardMaterial({color:theme.rim,roughness:.45,metalness:.35,emissive:theme.accent,emissiveIntensity:.18});
    const sideX=ARENA.halfW+.7;
    const sideZ=ARENA.halfH+.7;

    const north=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2+1.6,.8,1.15),wallMat);
    north.position.set(0,.34,-sideZ);group.add(north);
    const south=north.clone();south.position.set(0,.34,sideZ);group.add(south);
    const west=new THREE.Mesh(new THREE.BoxGeometry(1.15,.8,ARENA.halfH*2+1.6),wallMat);
    west.position.set(-sideX,.34,0);group.add(west);
    const east=west.clone();east.position.set(sideX,.34,0);group.add(east);

    const innerLine=new THREE.MeshStandardMaterial({color:theme.accentSoft,roughness:.2,metalness:0,emissive:theme.accent,emissiveIntensity:.4});
    const stripN=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2,.12,.12),innerLine);
    stripN.position.set(0,.77,-ARENA.halfH-.1);group.add(stripN);
    const stripS=stripN.clone();stripS.position.set(0,.77,ARENA.halfH+.1);group.add(stripS);
    const stripW=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,ARENA.halfH*2),innerLine);
    stripW.position.set(-ARENA.halfW-.1,.77,0);group.add(stripW);
    const stripE=stripW.clone();stripE.position.set(ARENA.halfW+.1,.77,0);group.add(stripE);

    [[-sideX,-sideZ],[-sideX,sideZ],[sideX,-sideZ],[sideX,sideZ]].forEach(([x,z])=>{
      const col=new THREE.Mesh(new THREE.CylinderGeometry(.42,.52,2.2,10),beamMat);col.position.set(x,1.1,z);group.add(col);
      const orb=new THREE.Mesh(new THREE.SphereGeometry(.28,12,8),new THREE.MeshStandardMaterial({color:theme.accentSoft,emissive:theme.glow,emissiveIntensity:.8,roughness:.15}));
      orb.position.set(x,2.35,z);group.add(orb);
      const glow=new THREE.PointLight(theme.glow,.55,8,2);glow.position.set(x,2.5,z);group.add(glow);
    });
  }

  function addArenaAccentLights(theme,type){
    const group=new THREE.Group();
    arenaRoot.add(group);

    [-9.5,9.5].forEach(x=>[-5.5,5.5].forEach(z=>{
      const light=new THREE.PointLight(theme.glow,type==='hex'?.85:.55,10,2);
      light.position.set(x,3.8,z);group.add(light);
    }));

    const down=new THREE.SpotLight(theme.accentSoft,.4,50,Math.PI/4,.5,2);
    down.position.set(0,17,0);down.target.position.set(0,0,0);group.add(down);group.add(down.target);
  }

  function addArenaScenery(type,theme){
    if(type==='square'||type==='cross'||type==='crates'||type==='fort'){
      [
        [-13.2,-7.5,PROPS.locker,Math.PI/2,.55],
        [13.2,7.5,PROPS.workbench,-Math.PI/2,.55],
        [-12.8,7.4,PROPS.pallet,0,.45],
        [12.8,-7.4,PROPS.pallet,Math.PI,.45]
      ].forEach(([x,z,url,rot,scale])=>{
        const holder=new THREE.Group();holder.position.set(x,0,z);arenaRoot.add(holder);
        attachPropVisual(url,holder,{scale,rotY:rot},buildId);
      });
    }

    if(type==='hex'){
      for(let i=0;i<6;i++){
        const angle=Math.PI*2*i/6+Math.PI/6;
        const x=Math.sin(angle)*11.2,z=Math.cos(angle)*6.9;
        const pole=new THREE.Mesh(new THREE.CylinderGeometry(.18,.22,2.8,8),new THREE.MeshStandardMaterial({color:0x5b4d89,roughness:.35,metalness:.5,emissive:theme.accent,emissiveIntensity:.25}));
        pole.position.set(x,1.3,z);arenaRoot.add(pole);
        const cap=new THREE.Mesh(new THREE.IcosahedronGeometry(.38,0),new THREE.MeshStandardMaterial({color:0xe9deff,emissive:theme.glow,emissiveIntensity:.75,roughness:.18}));
        cap.position.set(x,2.95,z);arenaRoot.add(cap);
      }
    }

    if(type==='bush'){
      [[-11,-6.3],[11,6.3],[-11,6.3],[11,-6.3],[0,-7.1],[0,7.1]].forEach(([x,z],i)=>addBush(x,z,i<4?1.1:1.4));
    }

    if(type==='pillars'||type==='ring'){
      [[-12,0],[12,0],[0,-7.2],[0,7.2]].forEach(([x,z])=>{
        const pad=new THREE.Mesh(new THREE.CylinderGeometry(.85,.95,.24,18),new THREE.MeshStandardMaterial({color:0x5b5158,roughness:.9,emissive:theme.accent,emissiveIntensity:.08}));
        pad.position.set(x,.12,z);arenaRoot.add(pad);addStageGlow(arenaRoot,x,z,1.08,theme.accent,.02,.26);
      });
    }
  }

  function addSpawnPads(theme,type){
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

  function addStageArchitecture(type,theme){
    const group=new THREE.Group();
    arenaRoot.add(group);
    const dark=new THREE.MeshStandardMaterial({color:theme.edge,roughness:.82,metalness:.22});
    const metal=new THREE.MeshStandardMaterial({color:theme.rim,roughness:.45,metalness:.5,emissive:theme.accent,emissiveIntensity:.12});
    const glowMat=new THREE.MeshStandardMaterial({color:theme.accentSoft,roughness:.2,metalness:.12,emissive:theme.glow,emissiveIntensity:.7});
    const addBox=(x,y,z,w,h,d,mat=dark)=>{
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);group.add(mesh);return mesh;
    };
    const addPole=(x,z,h=4,r=.25,mat=metal)=>{
      const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.12,h,8),mat);mesh.position.set(x,h/2,z);group.add(mesh);return mesh;
    };

    if(type==='square'){
      [-11,0,11].forEach(x=>{
        addPole(x,-12.6,5,.22);addPole(x,12.6,5,.22);
        addBox(x,4.7,-12.6,3.6,.18,.28,metal);addBox(x,4.7,12.6,3.6,.18,.28,metal);
      });
      [-15.2,15.2].forEach(x=>[-7.2,7.2].forEach(z=>{
        addBox(x,1.3,z,2.2,2.6,2.2,dark);
        addBox(x,2.75,z,1.55,.18,1.55,glowMat);
      }));
    }else if(type==='pillars'){
      [[-14,-9],[-14,9],[14,-9],[14,9]].forEach(([x,z],i)=>{
        const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.35,.5,12),dark);plinth.position.set(x,.25,z);group.add(plinth);
        const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.58,.7,4.6,12),metal);shaft.position.set(x,2.65,z);group.add(shaft);
        const crown=new THREE.Mesh(new THREE.CylinderGeometry(.95,.7,.5,12),glowMat);crown.position.set(x,5.08,z);group.add(crown);
        if(i%2===0){const l=new THREE.PointLight(theme.glow,.45,7,2);l.position.set(x,5.2,z);group.add(l)}
      });
    }else if(type==='ring'){
      [[-14.3,-7.8],[-14.3,7.8],[14.3,-7.8],[14.3,7.8]].forEach(([x,z])=>{
        addPole(x,z,4.8,.2);
        const halo=new THREE.Mesh(new THREE.TorusGeometry(.8,.1,8,24),glowMat);halo.position.set(x,4.6,z);halo.rotation.x=Math.PI/2;group.add(halo);
      });
      [-7,0,7].forEach(x=>{
        addBox(x,.9,-12.3,4.8,1.8,1.4,dark);addBox(x,.9,12.3,4.8,1.8,1.4,dark);
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
      const core=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.5,.34,6),dark);core.position.set(0,.2,0);core.rotation.y=Math.PI/6;group.add(core);
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.72,0),glowMat);crystal.position.set(0,2.7,0);group.add(crystal);
      const halo1=new THREE.Mesh(new THREE.TorusGeometry(1.45,.08,8,36),glowMat);halo1.position.set(0,2.7,0);halo1.rotation.x=Math.PI/2;group.add(halo1);
      const halo2=halo1.clone();halo2.scale.setScalar(.72);halo2.rotation.y=Math.PI/2;group.add(halo2);
      for(let i=0;i<6;i++){
        const a=i*Math.PI/3+Math.PI/6,x=Math.cos(a)*14.2,z=Math.sin(a)*8.8;
        addPole(x,z,5,.18);
        const node=new THREE.Mesh(new THREE.IcosahedronGeometry(.34,0),glowMat);node.position.set(x,5.05,z);group.add(node);
      }
    }else if(type==='fort'){
      [-1,1].forEach(side=>{
        const x=side*14.1;
        addBox(x,1.15,-6.8,3.6,2.3,3.2,dark);addBox(x,1.15,6.8,3.6,2.3,3.2,dark);
        [-6.8,6.8].forEach(z=>{
          [-1.2,0,1.2].forEach(offset=>addBox(x+offset,.32,z-1.8,.8,.65,.8,metal));
          addPole(x-side*1.5,z,4.8,.14);
          const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.05),new THREE.MeshBasicMaterial({color:theme.accent,side:THREE.DoubleSide,transparent:true,opacity:.85}));
          flag.position.set(x-side*1.52,4.15,z);flag.rotation.y=Math.PI/2;group.add(flag);
        });
      });
    }else if(type==='bush'){
      const trunkMat=new THREE.MeshStandardMaterial({color:0x4a3426,roughness:1});
      const leafMat=new THREE.MeshStandardMaterial({color:0x2f6b42,roughness:1});
      [[-15,-8.5],[-15,8.5],[15,-8.5],[15,8.5],[-8,-12],[8,-12],[-8,12],[8,12]].forEach(([x,z],i)=>{
        const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.26,.38,2.4,7),trunkMat);trunk.position.set(x,1.2,z);group.add(trunk);
        const crown=new THREE.Mesh(new THREE.ConeGeometry(1.55+(i%3)*.15,3.4,8),leafMat);crown.position.set(x,3.5,z);crown.rotation.y=i*.7;group.add(crown);
      });
    }else if(type==='crates'){
      [[-14.3,-7.4],[-14.3,6.2],[14.3,-6.2],[14.3,7.4]].forEach(([x,z],i)=>{
        const holder=new THREE.Group();holder.position.set(x,0,z);group.add(holder);
        attachPropVisual([PROPS.boxA,PROPS.boxB,PROPS.boxC][i%3],holder,{scale:1.15,rotY:i%2?Math.PI/2:0},buildId);
        const top=new THREE.Group();top.position.set(x,1.35,z);group.add(top);
        attachPropVisual(PROPS.boxA,top,{scale:.9,rotY:i%2?0:Math.PI/2},buildId);
      });
      [-9,0,9].forEach(x=>{addPole(x,-12.5,5.2,.18);addPole(x,12.5,5.2,.18);addBox(x,5,-12.5,3,.15,.22,glowMat);addBox(x,5,12.5,3,.15,.22,glowMat)});
    }
  }

  function addCenterPattern(type,holder,theme){
    if(type==='ring'){
      const r1=new THREE.Mesh(new THREE.RingGeometry(2.8,3.4,48),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));
      r1.rotation.x=-Math.PI/2;r1.position.y=.02;holder.add(r1);
      const r2=new THREE.Mesh(new THREE.RingGeometry(5,5.35,56),new THREE.MeshBasicMaterial({color:theme.accentSoft,transparent:true,opacity:.48,side:THREE.DoubleSide,depthWrite:false}));
      r2.rotation.x=-Math.PI/2;r2.position.y=.021;holder.add(r2);
    }else if(type==='cross'){
      addPaintStripe(holder,0,0,1,10.6,theme.accent,0,.02,.9);addPaintStripe(holder,0,0,18.2,1,theme.accent,0,.02,.9);
    }else if(type==='hex'){
      const hex=new THREE.Mesh(new THREE.CircleGeometry(3.1,6),new THREE.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false}));
      hex.rotation.x=-Math.PI/2;hex.rotation.z=Math.PI/6;hex.position.y=.02;holder.add(hex);
      const hex2=new THREE.Mesh(new THREE.RingGeometry(4.1,4.45,6),new THREE.MeshBasicMaterial({color:theme.accentSoft,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false}));
      hex2.rotation.x=-Math.PI/2;hex2.rotation.z=Math.PI/6;hex2.position.y=.021;holder.add(hex2);
    }else if(type==='fort'){
      addPaintStripe(holder,0,0,8.6,.95,theme.accent,0,.02,.82);addPaintStripe(holder,-5.6,-3.75,2.8,.72,theme.accentSoft,0,.02,.58);addPaintStripe(holder,5.6,3.75,2.8,.72,theme.accentSoft,0,.02,.58);
    }else if(type==='bush'){
      addStageGlow(holder,0,0,3.2,theme.accent,.02,.18);addStageGlow(holder,-5.4,0,1.3,theme.accentSoft,.021,.15);addStageGlow(holder,5.4,0,1.3,theme.accentSoft,.021,.15);
    }else if(type==='pillars'){
      addPaintStripe(holder,0,-3.2,14.4,.74,theme.accent,0,.02,.72);addPaintStripe(holder,0,3.2,14.4,.74,theme.accent,0,.02,.72);
    }else if(type==='crates'){
      addPaintStripe(holder,0,0,8,.92,theme.accent,Math.PI/4,.02,.75);addPaintStripe(holder,0,0,8,.92,theme.accent,-Math.PI/4,.02,.75);
    }else{
      addPaintStripe(holder,0,0,9,.9,theme.accent,0,.02,.84);addPaintStripe(holder,0,0,.9,6.6,theme.accent,0,.02,.84);
    }
  }

  function addFloorVisual(type){
    const theme=getArenaTheme(type);
    applyArenaTheme(theme);
    const holder=new THREE.Group();holder.position.y=-.28;arenaRoot.add(holder);

    const base=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2+3.8,.9,ARENA.halfH*2+3.8),new THREE.MeshStandardMaterial({color:theme.edge,roughness:.96}));
    base.position.y=-.45;holder.add(base);
    const fallback=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2,.45,ARENA.halfH*2),new THREE.MeshStandardMaterial({color:theme.floor,roughness:.88,metalness:.08}));
    fallback.position.y=-.05;holder.add(fallback);
    const rim=new THREE.Mesh(new THREE.BoxGeometry(ARENA.halfW*2+.35,.12,ARENA.halfH*2+.35),new THREE.MeshStandardMaterial({color:theme.rim,roughness:.45,metalness:.22,emissive:theme.accent,emissiveIntensity:.1}));
    rim.position.y=.18;holder.add(rim);

    attachPropVisual(theme.floorProp||PROPS.floor,holder,{scale:[ARENA.halfW,1,ARENA.halfH],fallback},buildId);

    const gridGroup=new THREE.Group();holder.add(gridGroup);
    for(let x=-12;x<=12;x+=4)if(x!==0)addPaintStripe(gridGroup,x,0,.18,ARENA.halfH*2-1.2,theme.accentSoft,0,.015,.18);
    for(let z=-8;z<=8;z+=4)if(z!==0)addPaintStripe(gridGroup,0,z,ARENA.halfW*2-1.2,.18,theme.accentSoft,0,.015,.18);

    addPaintStripe(holder,0,-ARENA.halfH+.95,ARENA.halfW*2-2.2,.22,theme.accent,0,.02,.4);
    addPaintStripe(holder,0,ARENA.halfH-.95,ARENA.halfW*2-2.2,.22,theme.accent,0,.02,.4);
    addPaintStripe(holder,-ARENA.halfW+.95,0,.22,ARENA.halfH*2-2.2,theme.accent,0,.02,.4);
    addPaintStripe(holder,ARENA.halfW-.95,0,.22,ARENA.halfH*2-2.2,theme.accent,0,.02,.4);
    addCenterPattern(type,holder,theme);

    if(type==='bush'||type==='fort'){
      [[-6.5,-2.4,2.2],[6.2,2.6,1.8],[-8.4,4.5,1.4],[8.2,-4.7,1.6]].forEach(([x,z,r])=>addStageGlow(holder,x,z,r,theme.accentSoft,.018,.08));
    }
  }

  function build(type){
    buildId++;
    clearGroup(arenaRoot);
    obstacles=[];
    bushes=[];

    const theme=getArenaTheme(type);
    addFloorVisual(type);
    addArenaPerimeter(theme);
    addArenaAccentLights(theme,type);
    addArenaScenery(type,theme);
    addSpawnPads(theme,type);
    addStageArchitecture(type,theme);

    if(type==='square'){
      [[-5,-3],[5,3],[5,-3],[-5,3]].forEach(([x,z],i)=>addCrate(x,z,60,i));
      addWallRun(-9,0,4.5,true);addWallRun(9,0,4.5,true);
    }else if(type==='pillars'){
      [[-5,-3],[5,-3],[-5,3],[5,3]].forEach(([x,z],i)=>addRealPillar(x,z,.9,2,i%2?'B':'A'));
      addBarrel(0,-3.2,0);addBarrel(0,3.2,1);
    }else if(type==='ring'){
      const radius=4.2;
      for(let i=0;i<8;i++){const angle=i*Math.PI/4;addBarrel(Math.sin(angle)*radius,Math.cos(angle)*radius,i)}
      addWallRun(-10,0,4.5,true,true);addWallRun(10,0,4.5,true,true);
    }else if(type==='cross'){
      addWallRun(0,0,7,true);addWallRun(0,0,7,false);
      addCrate(-7,-4,48,1);addCrate(7,4,48,2);addCrate(7,-4,48,3);addCrate(-7,4,48,0);
    }else if(type==='hex'){
      const radius=5.4;
      for(let i=0;i<6;i++){const angle=Math.PI*2*i/6;addRealPillar(Math.sin(angle)*radius,Math.cos(angle)*radius,.8,1.8,i%2?'B':'A')}
      addCrate(0,0,75,0);
    }else if(type==='fort'){
      addWallRun(-7,4.3,5,false,true);addWallRun(7,-4.3,5,false,true);addWallRun(-9,2.4,4,true);addWallRun(9,-2.4,4,true);addWallRun(-2.5,0,3,true);addWallRun(2.5,0,3,true);
      addCrate(-10,-4.6,48,1);addCrate(10,4.6,48,2);
    }else if(type==='bush'){
      addWallRun(-7,0,4,true);addWallRun(7,0,4,true);
      [[-3.4,-3],[3.4,3],[-3.4,3],[3.4,-3],[0,0],[-9,4.5],[9,-4.5]].forEach(([x,z])=>addBush(x,z,1.35));
    }else if(type==='crates'){
      const spots=[[-5,-3],[5,3],[5,-3],[-5,3],[0,0],[-9,0],[9,0],[0,-5],[0,5],[-10,-5],[10,5]];
      spots.forEach(([x,z],i)=>addCrate(x,z,i===4?85:52,i));
    }
  }

  function intersectsObstacle(pos,r,obstacle){
    if(obstacle.circle){
      const dx=pos.x-obstacle.x,dz=pos.z-obstacle.z;
      return dx*dx+dz*dz<(obstacle.r+r)*(obstacle.r+r);
    }
    return Math.abs(pos.x-obstacle.x)<obstacle.hw+r&&Math.abs(pos.z-obstacle.z)<obstacle.hd+r;
  }

  function canMoveTo(pos,r){
    if(Math.abs(pos.x)>ARENA.halfW-r||Math.abs(pos.z)>ARENA.halfH-r)return false;
    return !obstacles.some(obstacle=>intersectsObstacle(pos,r,obstacle));
  }

  function hitObstacle(pos,r=.15){return obstacles.find(obstacle=>intersectsObstacle(pos,r,obstacle))||null}

  function damageObstacle(obstacle,amount){
    if(!obstacle?.destructible)return {handled:false,destroyed:false};
    obstacle.hp-=amount;
    if(obstacle.hp>0)return {handled:true,destroyed:false};
    arenaRoot.remove(obstacle.mesh);
    obstacles=obstacles.filter(item=>item!==obstacle);
    return {handled:true,destroyed:true};
  }

  function isInBush(pos){
    return bushes.some(bush=>{
      const dx=pos.x-bush.x,dz=pos.z-bush.z;
      return dx*dx+dz*dz<bush.r*bush.r;
    });
  }

  return {build,canMoveTo,hitObstacle,damageObstacle,isInBush};
}
