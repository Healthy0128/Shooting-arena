import * as THREE from 'three';
import { ARENA } from './arena-config.js?v=695';

const FIELD_WEAPONS=[
  {key:'seeker',name:'誘導ランチャー',color:0x63f4db,ammo:5,stats:{weaponStyle:'seeker',damage:30,fireCd:.42,recovery:.12,bulletSpeed:11.5,bulletRadius:.22,bulletLife:2.4,recoil:.12,pellets:1,spread:0,heatGain:14,homing:4.2,vibration:16}},
  {key:'shock',name:'全周ショック',color:0xffb14f,ammo:2,stats:{weaponStyle:'shock',damage:14,fireCd:.78,recovery:.3,bulletSpeed:10.8,bulletRadius:.17,bulletLife:1.25,recoil:.28,pattern:'radial',radialCount:16,heatGain:28,vibration:22}},
  {key:'rail',name:'レールキャノン',color:0xff5e78,ammo:3,stats:{weaponStyle:'rail',damage:62,fireCd:.88,recovery:.34,bulletSpeed:24,bulletRadius:.23,bulletLife:1.35,recoil:.38,pellets:1,spread:0,heatGain:32,vibration:28}}
];

export function createFieldWeaponController({scene,getPlayers,canMoveTo,showBanner,tone,particleBurst}){
  let pickup=null;
  let spawnTimer=8;
  let quietTime=0;
  const directionIndicators=new Map();

  function ensureIndicator(player){
    if(directionIndicators.has(player))return directionIndicators.get(player);
    const group=new THREE.Group();
    group.position.y=.3;
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.02,1.08,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.7,side:THREE.DoubleSide,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;
    const arrow=new THREE.Mesh(new THREE.ConeGeometry(.18,.42,3),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:1,depthWrite:false}));
    arrow.rotation.x=Math.PI/2;
    arrow.position.z=-1.22;
    group.add(ring,arrow);player.root.add(group);
    const indicator={group,ring,arrow};directionIndicators.set(player,indicator);return indicator;
  }

  function hideIndicators(){
    directionIndicators.forEach(indicator=>{indicator.group.visible=false});
  }

  function disposeObject(object){
    object?.traverse?.(node=>{
      node.geometry?.dispose?.();
      if(Array.isArray(node.material))node.material.forEach(material=>material.dispose?.());
      else node.material?.dispose?.();
    });
    object?.removeFromParent?.();
  }

  function clearPlayerWeapon(player,announce=false){
    if(!player?.fieldWeapon)return;
    disposeObject(player.fieldWeapon.attachment);
    player.fieldWeapon=null;
  }

  function randomPosition(){
    for(let attempt=0;attempt<32;attempt++){
      const position=new THREE.Vector3(
        THREE.MathUtils.randFloat(-ARENA.halfW+2.2,ARENA.halfW-2.2),
        0,
        THREE.MathUtils.randFloat(-ARENA.halfH+2.2,ARENA.halfH-2.2)
      );
      if(canMoveTo(position,.9))return position;
    }
    return new THREE.Vector3(0,0,0);
  }

  function createPickupVisual(definition,position){
    const group=new THREE.Group();
    group.position.copy(position);
    const ring=new THREE.Mesh(
      new THREE.RingGeometry(.58,.78,36),
      new THREE.MeshBasicMaterial({color:definition.color,transparent:true,opacity:.75,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.y=.05;
    group.add(ring);
    const core=new THREE.Mesh(
      definition.key==='rail'?new THREE.BoxGeometry(.85,.24,.28):new THREE.OctahedronGeometry(.38,0),
      new THREE.MeshStandardMaterial({color:definition.color,emissive:definition.color,emissiveIntensity:1.25,roughness:.3,metalness:.25})
    );
    core.position.y=.72;
    group.add(core);
    const beam=new THREE.Mesh(
      new THREE.CylinderGeometry(.035,.035,.65,8),
      new THREE.MeshBasicMaterial({color:definition.color,transparent:true,opacity:.45})
    );
    beam.position.y=.36;
    group.add(beam);
    scene.add(group);
    return {group,ring,core};
  }

  function spawn(){
    if(pickup)return;
    const definition=FIELD_WEAPONS[Math.floor(Math.random()*FIELD_WEAPONS.length)];
    const position=randomPosition();
    pickup={definition,position,visual:createPickupVisual(definition,position),time:0};
    tone(560,.12,'sine',.035,260);
  }

  function attachToPlayer(player,definition){
    clearPlayerWeapon(player);
    const attachment=new THREE.Mesh(
      new THREE.BoxGeometry(.32,.22,.7),
      new THREE.MeshStandardMaterial({color:definition.color,emissive:definition.color,emissiveIntensity:.85,metalness:.35,roughness:.3})
    );
    attachment.position.set(.28,.08,-.32);
    player.weaponPivot.add(attachment);
    player.fieldWeapon={
      key:definition.key,
      name:definition.name,
      color:definition.color,
      ammo:definition.ammo,
      maxAmmo:definition.ammo,
      stats:{...definition.stats},
      attachment
    };
  }

  function collect(player){
    const definition=pickup.definition;
    const position=pickup.position.clone().setY(.7);
    attachToPlayer(player,definition);
    disposeObject(pickup.visual.group);
    pickup=null;
    quietTime=0;
    spawnTimer=THREE.MathUtils.randFloat(13,18);
    particleBurst(position,definition.color,24,.09);
    tone(720,.12,'square',.04,240);
  }

  function consume(player){
    if(!player?.fieldWeapon)return;
    player.fieldWeapon.ammo=Math.max(0,player.fieldWeapon.ammo-1);
    if(player.fieldWeapon.ammo>0)return;
    const color=player.fieldWeapon.color;
    particleBurst(player.root.position.clone().setY(.9),color,12,.06);
    clearPlayerWeapon(player,true);
  }

  function noteDamage(){
    quietTime=0;
  }

  function update(dt){
    quietTime+=dt;
    if(!pickup){
      spawnTimer-=dt*(quietTime>=7?2.5:1);
      if(spawnTimer<=0)spawn();
      hideIndicators();
      return;
    }
    pickup.time+=dt;
    pickup.visual.core.rotation.y+=dt*2.8;
    pickup.visual.core.rotation.x+=dt*1.1;
    pickup.visual.core.position.y=.72+Math.sin(pickup.time*4)*.09;
    pickup.visual.ring.rotation.z+=dt*.8;
    for(const player of getPlayers()){
      const indicator=ensureIndicator(player);
      indicator.group.visible=player.alive;
      const dx=pickup.position.x-player.root.position.x;
      const dz=pickup.position.z-player.root.position.z;
      indicator.arrow.material.color.setHex(pickup.definition.color);
      indicator.ring.material.color.setHex(pickup.definition.color);
      indicator.arrow.visible=false;
      const stretch=THREE.MathUtils.clamp(1+Math.hypot(dx,dz)*.055,1,1.42);
      indicator.group.rotation.y=Math.atan2(dx,dz)-player.root.rotation.y;
      indicator.ring.rotation.y=0;
      indicator.ring.scale.set(1,stretch,1);
      indicator.ring.position.z=(stretch-1)*.54;
      indicator.ring.material.opacity=.56+.16*Math.sin(performance.now()*.008);
      if(!player.alive)continue;
      const pdx=player.root.position.x-pickup.position.x;
      const pdz=player.root.position.z-pickup.position.z;
      if(pdx*pdx+pdz*pdz<1.15*1.15){collect(player);break}
    }
  }

  function reset(){
    if(pickup)disposeObject(pickup.visual.group);
    pickup=null;
    hideIndicators();
    getPlayers().forEach(player=>clearPlayerWeapon(player));
    spawnTimer=8;
    quietTime=0;
  }

  return {update,reset,consume,noteDamage};
}
