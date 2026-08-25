import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { SPAWN_X } from './arena-config.js?v=695';
import { CHARACTERS } from './loadout-config.js?v=695';

export function defenseLabel(type){
  return ({
    roll:'ROLL',guard:'GUARD',step:'STEP',
    barrier:'BARRIER',evade:'EVADE',parry:'PARRY'
  })[type]||'DEF';
}

export function createPlayerController({scene}){
  const gltfLoader=new GLTFLoader();
  const assetCache=new Map();

  async function loadCharacterAsset(url){
    if(assetCache.has(url))return assetCache.get(url);
    const promise=new Promise((resolve,reject)=>{
      gltfLoader.load(url,resolve,undefined,reject);
    });
    assetCache.set(url,promise);
    return promise;
  }

  function findClip(clips,patterns,fallback=false){
    return clips.find(c=>patterns.some(p=>c.name.toLowerCase().includes(p)))||(fallback?clips[0]:null);
  }

  async function attachWeaponModel(player){
    const url=player.cfg.weaponModel;
    if(!url)return;
    try{
      const gltf=await loadCharacterAsset(url);
      if(!player.root.parent)return;
      const model=gltf.scene.clone(true);
      model.scale.setScalar(player.cfg.weaponScale||.8);
      model.rotation.set(Math.PI/2,0,Math.PI);
      model.position.set(0,0,-.48);
      model.traverse(n=>{
        if(n.isMesh){n.castShadow=false;n.receiveShadow=false}
      });
      player.weaponPrimitive.visible=false;
      player.weaponPivot.add(model);
      player.weaponReal=model;
    }catch(err){
      console.warn('Weapon fallback:',url,err);
    }
  }

  async function attachRealModel(player){
    const cfg=player.cfg;
    try{
      const assetStatus=document.querySelector('#asset-status');
      if(assetStatus)assetStatus.textContent='Loading CC0 character models…';
      const gltf=await loadCharacterAsset(cfg.model);
      if(!player.root.parent)return;
      const model=cloneSkeleton(gltf.scene);
      model.scale.setScalar(.72);
      model.rotation.y=Math.PI;
      model.position.y=.03;
      model.traverse(n=>{
        if(n.isMesh){
          n.castShadow=false;
          n.receiveShadow=false;
        }
      });
      player.primitive.visible=false;
      player.modelHost.add(model);
      const mixer=new THREE.AnimationMixer(model);
      const idle=findClip(gltf.animations,['idle'],true);
      const walk=findClip(gltf.animations,['walking_a','walk','running_a','run']);
      const actionClips={
        shoot:findClip(gltf.animations,['shooting','shoot','attack_stab']),
        hit:findClip(gltf.animations,['hit_a','hit_b','hit']),
        defense:findClip(gltf.animations,['roll','dodge','attack_spin']),
        super:findClip(gltf.animations,['attack_spinning','attack_spin','attack']),
        death:findClip(gltf.animations,['death_a','death_b','death'])
      };
      if(idle){const a=mixer.clipAction(idle);a.play();player.idleAction=a}
      if(walk){const a=mixer.clipAction(walk);a.play();a.enabled=false;player.walkAction=a}
      player.actionAnimations=Object.fromEntries(
        Object.entries(actionClips).filter(([,clip])=>clip).map(([name,clip])=>{
          const action=mixer.clipAction(clip);
          action.setLoop(THREE.LoopOnce,1);
          action.clampWhenFinished=true;
          action.enabled=false;
          return [name,action];
        })
      );
      player.mixer=mixer;
      player.realModel=true;
      if(assetStatus)assetStatus.textContent='KayKit CC0 characters enabled · weapons load independently';
    }catch(err){
      console.warn('GLB fallback:',cfg.model,err);
      const assetStatus=document.querySelector('#asset-status');
      if(assetStatus)assetStatus.textContent='Some models could not load — fallback models are active.';
    }
  }

  function makePlayer(i,keyOrCfg){
    const cfg=typeof keyOrCfg==='string'?CHARACTERS[keyOrCfg]:keyOrCfg;
    const key=cfg.weaponKey||keyOrCfg;
    const root=new THREE.Group();

    const shadow=new THREE.Mesh(
      new THREE.CircleGeometry(.72,24),
      new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.3,depthWrite:false})
    );
    shadow.rotation.x=-Math.PI/2;
    shadow.position.y=.015;
    root.add(shadow);

    const visualRig=new THREE.Group();
    root.add(visualRig);

    const primitive=new THREE.Group();
    visualRig.add(primitive);
    const body=new THREE.Mesh(
      new THREE.CapsuleGeometry(.48,.72,5,10),
      new THREE.MeshStandardMaterial({color:cfg.color,roughness:.58})
    );
    body.position.y=.88;
    primitive.add(body);
    const head=new THREE.Mesh(
      new THREE.SphereGeometry(.42,16,12),
      new THREE.MeshStandardMaterial({color:0xf1c6a5,roughness:.8})
    );
    head.position.y=1.66;
    primitive.add(head);

    const modelHost=new THREE.Group();
    visualRig.add(modelHost);

    const weaponPivot=new THREE.Group();
    weaponPivot.position.y=1.05;
    visualRig.add(weaponPivot);
    const gunLen=key==='crusher'?1.0:key==='skeleton'?1.4:1.25;
    const gunColor=key==='mage'?0x5be0d0:key==='skeleton'?0x8f826c:0x202735;
    const gun=new THREE.Mesh(
      new THREE.BoxGeometry(key==='crusher'?.38:.26,.24,gunLen),
      new THREE.MeshStandardMaterial({color:gunColor,metalness:.25,roughness:.45})
    );
    gun.position.z=-gunLen*.5;
    weaponPivot.add(gun);
    const muzzleAnchor=new THREE.Group();
    muzzleAnchor.position.z=-gunLen;
    weaponPivot.add(muzzleAnchor);

    const x=i===0?-SPAWN_X:SPAWN_X;
    root.position.set(x,0,0);
    root.rotation.y=i===0?-Math.PI/2:Math.PI/2;
    const bodyScale=cfg.bodyWeight==='heavy'?1.08:cfg.bodyWeight==='light'?.94:1;
    primitive.scale.setScalar(bodyScale);
    modelHost.scale.setScalar(bodyScale);
    scene.add(root);

    const defenseFx=new THREE.Group();
    root.add(defenseFx);

    const guardShield=new THREE.Mesh(
      new THREE.PlaneGeometry(1.25,1.45),
      new THREE.MeshBasicMaterial({color:0x83d8ff,transparent:true,opacity:.0,side:THREE.DoubleSide,depthWrite:false})
    );
    guardShield.position.set(0,1.0,-.72);
    defenseFx.add(guardShield);

    const barrierShell=new THREE.Mesh(
      new THREE.SphereGeometry(.95,16,12),
      new THREE.MeshBasicMaterial({color:0x69dbff,transparent:true,opacity:0,wireframe:true,depthWrite:false})
    );
    barrierShell.position.y=.95;
    defenseFx.add(barrierShell);

    const parryRing=new THREE.Mesh(
      new THREE.RingGeometry(.72,1.02,40),
      new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false})
    );
    parryRing.rotation.x=-Math.PI/2;
    parryRing.position.y=.06;
    defenseFx.add(parryRing);

    const superAura=new THREE.Mesh(
      new THREE.TorusGeometry(.82,.045,8,48),
      new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:0,depthWrite:false})
    );
    superAura.rotation.x=-Math.PI/2;
    superAura.position.y=.08;
    defenseFx.add(superAura);

    const player={
      i,key,cfg,root,visualRig,primitive,modelHost,weaponPivot,muzzleAnchor,weaponPrimitive:gun,weaponReal:null,
      hp:cfg.hp,maxHp:cfg.hp,alive:true,invuln:0,fireCd:0,recovery:0,super:0,heat:0,
      overheated:false,fireHeld:false,powerBuff:0,defenseCd:0,guard:100,guarding:false,barrier:0,
      parryActive:0,parryChain:0,defenseFx,guardShield,barrierShell,parryRing,superAura,flashTime:0,dashFx:0,
      stats:{damageDealt:0,damageTaken:0,shots:0,hits:0,supers:0,defenses:0,cores:0,parries:0},
      move:new THREE.Vector2(),lastMoveSide:0,aim:new THREE.Vector2(i===0?1:-1,0),radius:cfg.radius||.58,
      mixer:null,realModel:false,actionAnimations:{},oneShotAction:null,actionTime:0,fieldWeapon:null,
      hitReaction:0,hitReactionDuration:.26,hitSide:1,shotReaction:0,shotReactionDuration:.12,bodyScale
    };
    attachRealModel(player);
    attachWeaponModel(player);
    return player;
  }

  function resetPlayer(player,i){
    player.hp=player.maxHp;
    player.alive=true;
    player.invuln=1.15;
    player.heat=0;
    player.overheated=false;
    player.recovery=0;
    player.fireHeld=false;
    player.powerBuff=0;
    player.defenseCd=0;
    player.guard=100;
    player.guarding=false;
    player.barrier=0;
    player.parryActive=0;
    player.parryChain=0;
    player.flashTime=0;
    player.hitReaction=0;
    player.shotReaction=0;
    player.visualRig.position.set(0,0,0);
    player.visualRig.rotation.set(0,0,0);
    player.weaponPivot.position.z=0;
    player.weaponPivot.rotation.x=0;
    player.actionTime=0;
    if(player.oneShotAction){
      player.oneShotAction.stop();
      player.oneShotAction.enabled=false;
      player.oneShotAction=null;
    }
    if(player.guardShield)player.guardShield.visible=false;
    if(player.barrierShell)player.barrierShell.visible=false;
    if(player.parryRing)player.parryRing.visible=false;
    player.fireCd=.18;
    player.root.visible=true;
    player.root.position.set(i===0?-SPAWN_X:SPAWN_X,0,0);
    player.move.set(0,0);
    player.aim.set(i===0?1:-1,0);
  }

  function flashPlayer(player,duration=.09){
    player.flashTime=Math.max(player.flashTime||0,duration);
  }

  function defenseTrail(player,color=player.cfg.color){
    const ghost=new THREE.Mesh(
      new THREE.RingGeometry(.38,.62,28),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide,depthWrite:false})
    );
    ghost.rotation.x=-Math.PI/2;
    ghost.position.copy(player.root.position);
    ghost.position.y=.08;
    scene.add(ghost);

    const born=performance.now();
    function fade(){
      const t=(performance.now()-born)/220;
      if(t>=1){
        scene.remove(ghost);
        ghost.geometry.dispose();
        ghost.material.dispose();
        return;
      }
      ghost.scale.setScalar(1+t*.8);
      ghost.material.opacity=.55*(1-t);
      requestAnimationFrame(fade);
    }
    requestAnimationFrame(fade);
  }

  function playPlayerAction(player,name){
    if(!player)return false;
    if(name==='hit'){
      player.hitReaction=player.hitReactionDuration||.26;
      player.hitSide=Math.random()<.5?-1:1;
    }
    if(name==='shoot'){
      player.shotReactionDuration=THREE.MathUtils.clamp(.085+(player.cfg.recoil||0)*.18,.09,.17);
      player.shotReaction=player.shotReactionDuration;
    }
    const action=player?.actionAnimations?.[name];
    if(!action)return false;
    if(player.oneShotAction&&player.oneShotAction!==action){
      player.oneShotAction.stop();
      player.oneShotAction.enabled=false;
    }
    action.reset();
    action.enabled=true;
    action.setEffectiveWeight(1);
    action.play();
    player.oneShotAction=action;
    player.actionTime=Math.max(.12,action.getClip().duration);
    return true;
  }

  function updatePlayerVisuals(player,dt,inBush=false){
    if(!player.guardShield)return;
    player.flashTime=Math.max(0,(player.flashTime||0)-dt);
    player.hitReaction=Math.max(0,(player.hitReaction||0)-dt);
    player.shotReaction=Math.max(0,(player.shotReaction||0)-dt);
    let hitImpulse=0;
    if(player.hitReaction>0){
      const duration=player.hitReactionDuration||.26;
      const phase=1-player.hitReaction/duration;
      hitImpulse=Math.sin(THREE.MathUtils.clamp(phase,0,1)*Math.PI);
    }
    let shotImpulse=0;
    if(player.shotReaction>0){
      const phase=1-player.shotReaction/(player.shotReactionDuration||.12);
      shotImpulse=Math.sin(THREE.MathUtils.clamp(phase,0,1)*Math.PI);
    }
    const recoilScale=THREE.MathUtils.clamp((player.cfg.recoil||.08)*1.8,.08,.62);
    player.visualRig.position.z=.24*hitImpulse+.09*shotImpulse*recoilScale;
    player.visualRig.rotation.x=-.2*hitImpulse+.06*shotImpulse*recoilScale;
    player.visualRig.rotation.z=(player.hitSide||1)*.09*hitImpulse;
    player.weaponPivot.position.z=.22*shotImpulse*recoilScale;
    player.weaponPivot.rotation.x=.16*shotImpulse*recoilScale;

    const guardOn=player.guarding&&player.alive;
    player.guardShield.material.opacity=guardOn?.42:0;
    player.guardShield.visible=guardOn;
    if(guardOn)player.guardShield.scale.setScalar(.98+.04*Math.sin(performance.now()*.012));

    const barrierOn=player.barrier>0&&player.alive;
    player.barrierShell.material.opacity=barrierOn?.22:0;
    player.barrierShell.visible=barrierOn;
    if(barrierOn){
      player.barrierShell.rotation.y+=dt*1.8;
      player.barrierShell.scale.setScalar(.98+.04*Math.sin(performance.now()*.01));
    }

    const parryOn=player.parryActive>0&&player.alive;
    player.parryRing.material.opacity=parryOn?.85:0;
    player.parryRing.visible=parryOn;
    if(parryOn){
      player.parryRing.rotation.z+=dt*7;
      const s=1+.18*Math.sin(performance.now()*.03);
      player.parryRing.scale.setScalar(s);
    }

    const superReady=player.super>=100&&player.alive;
    player.superAura.visible=superReady;
    player.superAura.material.opacity=superReady?.72:0;
    if(superReady){
      player.superAura.rotation.z+=dt*2.8;
      const pulse=1+.12*Math.sin(performance.now()*.012);
      player.superAura.scale.setScalar(pulse);
    }

    if(player.flashTime>0){
      player.primitive.visible=Math.floor(player.flashTime*70)%2===0;
      if(player.realModel)player.modelHost.visible=Math.floor(player.flashTime*70)%2===0;
    }else{
      player.primitive.visible=!player.realModel;
      if(player.realModel)player.modelHost.visible=true;
    }

    if(player.mixer){
      const moving=player.move.lengthSq()>.08;
      if(player.actionTime>0){
        player.actionTime=Math.max(0,player.actionTime-dt);
        if(player.actionTime===0&&player.oneShotAction){
          player.oneShotAction.stop();
          player.oneShotAction.enabled=false;
          player.oneShotAction=null;
        }
      }
      const acting=player.actionTime>0;
      if(player.walkAction){
        player.walkAction.enabled=moving&&!acting;
        player.walkAction.setEffectiveWeight(moving&&!acting?1:0);
      }
      if(player.idleAction){
        player.idleAction.enabled=!moving&&!acting;
        player.idleAction.setEffectiveWeight(!moving&&!acting?1:0);
      }
      player.mixer.update(dt);
    }

    if(player.alive){
      player.root.visible=player.invuln>0?Math.floor(player.invuln*12)%2===0:true;
    }
    if(player.realModel)player.modelHost.scale.setScalar(player.bodyScale*(inBush?.96:1));
  }

  function removePlayers(players){
    players.forEach(player=>scene.remove(player.root));
  }

  function getMuzzlePosition(player,target=new THREE.Vector3()){
    if(!player?.muzzleAnchor)return target.copy(player?.root?.position||new THREE.Vector3());
    player.root.updateMatrixWorld(true);
    return player.muzzleAnchor.getWorldPosition(target);
  }

  return {makePlayer,resetPlayer,flashPlayer,defenseTrail,playPlayerAction,updatePlayerVisuals,removePlayers,getMuzzlePosition};
}
