import * as THREE from 'three';
import { ARENA } from './arena-config.js?v=695';
import { BODY_META, OVERDRIVE_PROFILES } from './loadout-config.js?v=6180';
import { createProjectileVisualController } from './projectile-visuals.js?v=6170';
import { createWeaponEffectsController } from './weapon-effects.js?v=6280';

export function createCombatController({
  scene,
  getPlayers,
  isRunning,
  canMoveTo,
  hitObstacle,
  damageArenaObstacle,
  showBanner,
  tone,
  particleBurst,
  matchLater,
  flashPlayer,
  defenseTrail,
  playPlayerAction,
  getMuzzlePosition,
  damagePop,
  addHitStop,
  cameraShake,
  shotSfx,
  vibrate,
  consumeFieldWeapon,
  onDamage,
  onKO
}){
  const bullets=[];
  const superEffects=[];
  const projectileVisuals=createProjectileVisualController();
  const weaponEffects=createWeaponEffectsController({scene,matchLater,particleBurst,tone,cameraShake,shotSfx});

  function bodyMeta(player){
    return BODY_META[player?.cfg?.bodyKey]||BODY_META.knight;
  }

  function bodyDamageMul(player){
    return bodyMeta(player).damageMul||1;
  }

  function bodyIncomingMul(player){
    return bodyMeta(player).damageTakenMul||1;
  }

  function superGainMul(player){
    return (bodyMeta(player).superGainMul||1)*(player?.cfg?.superGainMul||1);
  }

  function disposeBullet(bullet){
    scene.remove(bullet.mesh);
    projectileVisuals.dispose(bullet.mesh);
  }

  function activeWeapon(player){
    return player?.fieldWeapon?.stats||player.cfg;
  }

  function applyShotRecoil(player,weapon){
    let recoil=weapon.recoil||0;
    recoil*=THREE.MathUtils.clamp(1-(player.cfg.recoilResist||0),.55,1.15);
    if(recoil<=0)return;
    const dir=new THREE.Vector3(player.aim.x,0,player.aim.y);
    if(dir.lengthSq()<.01)return;
    dir.normalize().multiplyScalar(-recoil);
    const next=player.root.position.clone().add(dir);
    if(canMoveTo(next,player.radius))player.root.position.copy(next);
  }

  function spawnBullet(owner,dir,damage,speed,weapon){
    const players=getPlayers();
    const player=players[owner];
    const style=weapon.weaponStyle||'rifle';
    const radius=weapon.bulletRadius||.16;
    const mesh=projectileVisuals.create(style,radius,player?.powerBuff>0);
    const forward=dir.clone().normalize();
    const launch=forward.clone();
    const curveDirection=style==='boomerang'?(Math.random()<.5?-1:1):0;
    if(curveDirection)launch.applyAxisAngle(new THREE.Vector3(0,1,0),curveDirection*Math.PI*40/180);
    mesh.position.copy(getMuzzlePosition(player,new THREE.Vector3())).addScaledVector(launch,.08);
    scene.add(mesh);

    bullets.push({
      mesh,
      vel:launch.multiplyScalar(speed),
      owner,
      life:weapon.bulletLife||1.45,
      radius,
      damage,
      style,
      bounces:0,
      ricochetMax:style==='bladegun'?3:0,
      homing:weapon.homing||0
      ,curveBase:forward,curveDirection,curveTime:0,curveDelay:style==='boomerang'?1:0
    });
  }

  function bladeAttack(i,player,amount){
    const forward=new THREE.Vector3(player.aim.x,0,player.aim.y).normalize();
    const enemy=1-i, target=getPlayers()[enemy];
    const cosArc=Math.cos(Math.PI*65/180);
    if(target?.alive){
      const to=target.root.position.clone().sub(player.root.position).setY(0);
      const distance=to.length();
      if(distance<=1.55&&distance>.01&&forward.dot(to.normalize())>=cosArc){
        damage(enemy,amount,i,'katana',target.root.position.clone().setY(.75),0,{grantAttackerSuper:true});
      }
    }
    for(let n=bullets.length-1;n>=0;n--){
      const bullet=bullets[n];
      if(bullet.owner===i)continue;
      const to=bullet.mesh.position.clone().sub(player.root.position).setY(0);
      if(to.length()<=1.8&&to.length()>.01&&forward.dot(to.normalize())>=cosArc){
        particleBurst(bullet.mesh.position.clone().setY(.65),0xffe5a1,8,.06);
        disposeBullet(bullet);bullets.splice(n,1);
      }
    }
    weaponEffects.slash(player.root.position.clone().addScaledVector(forward,.68),forward,player.cfg.color);
    particleBurst(player.root.position.clone().addScaledVector(forward,.85).setY(.75),0xffe5a1,18,.08);
    tone(620,.06,'sawtooth',.028,-240);
  }

  function shoot(i){
    const player=getPlayers()[i];
    if(!isRunning()||!player?.alive||player.fireCd>0||player.recovery>0||player.overheated||player.guarding||player.aim.lengthSq()<.12)return;
    const weapon=activeWeapon(player);
    player.fireCd=weapon.fireCd;
    player.recovery=weapon.recovery||0;
    player.stats.shots++;
    playPlayerAction(player,'shoot');
    const heatGain=weapon.heatGain??(weapon.pellets>1?30:weapon.fireCd<.12?9:weapon.fireCd>.75?42:18);
    player.heat=Math.min(100,(player.heat||0)+heatGain);
    if(player.heat>=100&&!player.overheated){
      player.overheated=true;
      showBanner(`P${i+1} OVERHEAT!`,420);
      tone(120,.11,'sawtooth',.03,-45);
      vibrate([20,30,20]);
    }
    const base=new THREE.Vector3(player.aim.x,0,player.aim.y).normalize();
    const attackMul=bodyDamageMul(player)*(player.powerBuff>0?1.18:1);
    if(weapon.weaponStyle==='katana'){
      bladeAttack(i,player,weapon.damage*attackMul);
      return;
    }
    if(weapon.pattern==='radial'){
      const count=weapon.radialCount||12;
      for(let n=0;n<count;n++){
        const angle=Math.PI*2*n/count;
        spawnBullet(i,new THREE.Vector3(Math.sin(angle),0,Math.cos(angle)),weapon.damage*attackMul,weapon.bulletSpeed,weapon);
      }
    }else{
      const count=weapon.pellets||1;
      for(let n=0;n<count;n++){
        const ang=count===1
          ?(Math.random()-.5)*(weapon.spread||0)
          :THREE.MathUtils.lerp(-weapon.spread,weapon.spread,n/(count-1));
        const dir=base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),ang);
        spawnBullet(i,dir,weapon.damage*attackMul,weapon.bulletSpeed,weapon);
      }
    }
    weaponEffects.muzzle(weapon.weaponStyle||'rifle',getMuzzlePosition(player,new THREE.Vector3()),base,player.powerBuff>0);
    applyShotRecoil(player,weapon);
    weaponEffects.shotSound(weapon.weaponStyle||'rifle');
    vibrate(weapon.vibration??(weapon.weaponStyle==='cannon'?24:weapon.weaponStyle==='scatter'?14:8));
    consumeFieldWeapon?.(player);
  }

  function defenseAction(i){
    const player=getPlayers()[i];
    if(!isRunning()||!player?.alive)return;

    const type=player.cfg.defense;
    player.stats.defenses++;

    if(type==='guard'){
      if(player.guard<=0||player.defenseCd>0)return;
      player.guarding=!player.guarding;
      playPlayerAction(player,'defense');
      tone(player.guarding?170:240,.045,'square',.022,player.guarding?-20:60);
      return;
    }
    if(player.defenseCd>0)return;

    let dir;
    if(player.move.lengthSq()>.05)dir=new THREE.Vector3(player.move.x,0,player.move.y);
    else dir=new THREE.Vector3(player.aim.x,0,player.aim.y);
    if(dir.lengthSq()<.01)dir.set(0,0,i===0?-1:1);
    dir.normalize();

    if(type==='roll'){
      playPlayerAction(player,'defense');
      player.defenseCd=2.4;
      player.invuln=Math.max(player.invuln,.26);
      for(let k=0;k<7;k++){
        const next=player.root.position.clone().addScaledVector(dir,.34*(player.cfg.dashMul||1));
        if(canMoveTo(next,player.radius))player.root.position.copy(next);
      }
      defenseTrail(player);
      particleBurst(player.root.position.clone().setY(.45),player.cfg.color,10,.07);
      tone(280,.05,'triangle',.025,120);
    }else if(type==='step'){
      playPlayerAction(player,'defense');
      player.defenseCd=1.7;
      player.invuln=Math.max(player.invuln,.17);
      for(let k=0;k<9;k++){
        const next=player.root.position.clone().addScaledVector(dir,.38*(player.cfg.dashMul||1));
        if(canMoveTo(next,player.radius))player.root.position.copy(next);
      }
      defenseTrail(player);
      particleBurst(player.root.position.clone().setY(.35),player.cfg.color,8,.06);
      tone(350,.045,'triangle',.022,160);
    }else if(type==='evade'){
      playPlayerAction(player,'defense');
      player.defenseCd=3.2;
      player.invuln=Math.max(player.invuln,.38);
      if(player.move.lengthSq()<=.05)dir.set(-player.aim.y,0,player.aim.x).normalize();
      for(let k=0;k<8;k++){
        const next=player.root.position.clone().addScaledVector(dir,.36*(player.cfg.dashMul||1));
        if(canMoveTo(next,player.radius))player.root.position.copy(next);
      }
      defenseTrail(player);
      particleBurst(player.root.position.clone().setY(.4),player.cfg.color,12,.075);
      tone(320,.06,'triangle',.028,180);
    }else if(type==='barrier'){
      playPlayerAction(player,'defense');
      player.defenseCd=7.5;
      player.barrier=30;
      particleBurst(player.root.position.clone().setY(.9),0x8fefff,18,.08);
      tone(520,.09,'sine',.03,-120);
    }else if(type==='parry'){
      playPlayerAction(player,'defense');
      player.defenseCd=.95;
      player.parryActive=.18;
      tone(720,.035,'square',.018,-90);
    }
  }

  function sourceFrontDot(player,sourcePos){
    const forward=new THREE.Vector3(
      Math.sin(player.root.rotation.y-Math.PI),0,
      Math.cos(player.root.rotation.y-Math.PI)
    ).normalize();
    const to=sourcePos.clone().sub(player.root.position);
    to.y=0;
    if(to.lengthSq()<.0001)return 1;
    to.normalize();
    return forward.dot(to);
  }

  function parryBullet(victim,bullet){
    const player=getPlayers()[victim];
    player.parryActive=0;
    player.parryChain++;
    player.stats.parries++;
    player.defenseCd=0;
    addHitStop(.085);

    bullet.owner=victim;
    bullet.vel.multiplyScalar(-1.18);
    bullet.damage*=1.12;

    flashPlayer(player,.08);
    particleBurst(player.root.position.clone().setY(.9),0xffffff,22,.09);
    tone(940,.065,'square',.045,-280);
    showBanner(`PARRY! x${player.parryChain}`,320);
    vibrate([12,18,12]);
  }

  function superPulse(player,color=0xffffff,scale=1){
    const ring=new THREE.Mesh(
      new THREE.RingGeometry(.65*scale,1.0*scale,48),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false})
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.copy(player.root.position);
    ring.position.y=.06;
    scene.add(ring);
    const born=performance.now();
    const life=360;
    function tick(){
      const t=(performance.now()-born)/life;
      if(t>=1){
        scene.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
        return;
      }
      ring.scale.setScalar(1+t*1.8);
      ring.material.opacity=.9*(1-t);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function superFlash(player,color=0xffffff){
    flashPlayer(player,.16);
    particleBurst(player.root.position.clone().setY(.9),color,28,.11);
    addHitStop(.045);
  }

  function disposeSuperEffect(effect){
    effect.mesh?.removeFromParent?.();
    effect.mesh?.traverse?.(child=>{child.geometry?.dispose?.();child.material?.dispose?.()});
  }

  function makeGroundRing(position,inner,outer,color,opacity=.72){
    const mesh=new THREE.Mesh(
      new THREE.RingGeometry(inner,outer,48),
      new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false})
    );
    mesh.rotation.x=-Math.PI/2;
    mesh.position.copy(position).setY(.07);
    scene.add(mesh);
    return mesh;
  }

  function createNovaField(owner){
    const player=getPlayers()[owner];
    const position=player.root.position.clone();
    const fill=new THREE.Mesh(new THREE.CircleGeometry(3.35,64),new THREE.MeshBasicMaterial({color:player.cfg.color,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));
    fill.rotation.x=-Math.PI/2;fill.position.y=.055;
    const border=new THREE.Mesh(new THREE.RingGeometry(2.85,3.35,64),new THREE.MeshBasicMaterial({color:player.cfg.color,transparent:true,opacity:.9,side:THREE.DoubleSide,depthWrite:false}));
    border.rotation.x=-Math.PI/2;border.position.y=.07;
    const mesh=new THREE.Group();mesh.position.copy(position);mesh.add(fill);mesh.add(border);
    scene.add(mesh);
    superEffects.push({type:'novaField',owner,position,radius:3.35,life:6,tick:.05,mesh,fill,border});
  }

  function queueBoneStrike(owner,position,delay){
    superEffects.push({type:'boneStrike',owner,position:position.clone(),delay,mesh:makeGroundRing(position,.78,1.15,0xff6a54,.78)});
  }

  function updateSuperEffects(dt){
    const players=getPlayers();
    for(let i=superEffects.length-1;i>=0;i--){
      const effect=superEffects[i];
      let remove=false;
      if(effect.type==='novaField'){
        effect.life-=dt;
        effect.tick-=dt;
        effect.mesh.rotation.z+=dt*.8;
        effect.fill.material.opacity=.2+.08*Math.sin(effect.life*7);
        effect.border.material.opacity=.72+.2*Math.sin(effect.life*7);
        const owner=players[effect.owner],enemy=players[1-effect.owner];
        if(!owner?.alive)remove=true;
        while(!remove&&effect.tick<=0){
          effect.tick+=.5;
          const ownerDistance=owner.root.position.distanceTo(effect.position);
          if(ownerDistance<=effect.radius)owner.hp=Math.min(owner.maxHp,owner.hp+3);
          if(enemy?.alive&&enemy.root.position.distanceTo(effect.position)<=effect.radius){
            damage(1-effect.owner,3,effect.owner,'arcane',enemy.root.position.clone().setY(.9),0,{grantAttackerSuper:false});
          }
        }
        if(effect.life<=0)remove=true;
      }else if(effect.type==='boneStrike'){
        effect.delay-=dt;
        effect.mesh.rotation.z+=dt*2.5;
        effect.mesh.material.opacity=THREE.MathUtils.clamp(.25+(1-effect.delay/.9)*.65,.25,.9);
        if(effect.delay<=0){
          const enemy=players[1-effect.owner];
          particleBurst(effect.position.clone().setY(.8),0xff765f,24,.095);
          weaponEffects.impact('cannon',effect.position.clone().setY(.1),'obstacle');
          tone(82,.09,'square',.032,-30);
          if(enemy?.alive&&enemy.root.position.distanceTo(effect.position)<=1.15){
            damage(1-effect.owner,30,effect.owner,'cannon',effect.position.clone().setY(.9),0,{grantAttackerSuper:false});
          }
          remove=true;
        }
      }
      if(remove){
        disposeSuperEffect(effect);
        superEffects.splice(i,1);
      }
    }
  }

  function superShot(owner,dir,damage,speed,style,radius=.18,life=1.4,options={}){
    const player=getPlayers()[owner];
    const mesh=projectileVisuals.create(style,radius,true);
    const forward=dir.clone().normalize();
    mesh.position.copy(getMuzzlePosition(player,new THREE.Vector3())).addScaledVector(forward,.08);
    scene.add(mesh);
    bullets.push({
      mesh,vel:forward.multiplyScalar(speed),owner,life,radius,
      damage:damage*bodyDamageMul(player),style,bounces:0,
      ricochetMax:options.ricochetMax||0,
      homing:options.homing||0,
      isSuper:true
    });
  }

  function activateOverdrive(i,player){
    const profile=OVERDRIVE_PROFILES[player.cfg.weaponStyle]||OVERDRIVE_PROFILES.rifle;
    for(let burst=0;burst<profile.bursts;burst++){
      matchLater(()=>{
        if(!isRunning()||!player.alive)return;
        const base=new THREE.Vector3(player.aim.x,0,player.aim.y);
        if(base.lengthSq()<.01)base.set(0,0,i===0?-1:1);
        base.normalize();
        for(let pellet=0;pellet<profile.pellets;pellet++){
          const ratio=profile.pellets===1?0:pellet/(profile.pellets-1)*2-1;
          const randomSpread=profile.pellets===1?(Math.random()-.5)*profile.spread:ratio*profile.spread;
          const dir=base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),randomSpread);
          superShot(i,dir,profile.damage,profile.speed,profile.style,profile.radius,profile.life,{homing:profile.homing,ricochetMax:profile.ricochetMax});
        }
        weaponEffects.muzzle(profile.style,getMuzzlePosition(player,new THREE.Vector3()),base,player.powerBuff>0);
        weaponEffects.shotSound(profile.style);
      },burst*profile.interval);
    }
  }

  function activateBlastRing(i,player){
    const radius=5.2;
    for(let b=bullets.length-1;b>=0;b--){
      const bullet=bullets[b];
      if(bullet.owner===i||bullet.mesh.position.distanceTo(player.root.position)>radius)continue;
      particleBurst(bullet.mesh.position.clone().setY(.65),0xffd08a,5,.04);
      disposeBullet(bullet);
      bullets.splice(b,1);
    }
    const enemy=getPlayers()[1-i];
    if(!enemy?.alive||enemy.invuln>0||enemy.root.position.distanceTo(player.root.position)>4.6)return;
    damage(1-i,42,i,'scatter',enemy.root.position.clone().setY(.9),0,{grantAttackerSuper:false});
    if(!enemy.alive)return;
    const away=enemy.root.position.clone().sub(player.root.position).setY(0);
    if(away.lengthSq()<.01)away.set(i===0?1:-1,0,0);
    const next=enemy.root.position.clone().addScaledVector(away.normalize(),1.35);
    if(canMoveTo(next,enemy.radius))enemy.root.position.copy(next);
  }

  function activateSuper(i){
    const player=getPlayers()[i];
    if(!isRunning()||!player?.alive||player.super<100)return;

    player.super=0;
    player.stats.supers++;
    playPlayerAction(player,'super');
    player.fireHeld=false;
    player.heat=Math.max(0,player.heat-35);
    player.overheated=false;
    const type=player.cfg.super;

    if(type==='rapid'){
      superPulse(player,0x8fd7ff,1.0);
      superFlash(player,0x8fd7ff);
      showBanner(`P${i+1} OVERDRIVE!`,520);
      tone(360,.08,'square',.035,280);
      activateOverdrive(i,player);
    }else if(type==='blast'){
      superPulse(player,0xffb05a,1.25);
      superFlash(player,0xffb05a);
      showBanner(`P${i+1} REPULSE RING!`,520);
      tone(105,.12,'sawtooth',.045,80);
      activateBlastRing(i,player);
    }else if(type==='dash'){
      const dir=new THREE.Vector3(player.aim.x,0,player.aim.y);
      if(dir.lengthSq()<.01)dir.set(0,0,i===0?-1:1);
      dir.normalize();
      superPulse(player,0xa98cff,1.05);
      showBanner(`P${i+1} PHANTOM DASH!`,520);
      tone(250,.08,'triangle',.035,420);
      player.invuln=Math.max(player.invuln,.65);
      for(let k=0;k<13;k++){
        matchLater(()=>{
          if(!isRunning()||!player.alive)return;
          defenseTrail(player,0xa98cff);
          const next=player.root.position.clone().addScaledVector(dir,.48*(player.cfg.dashMul||1));
          if(canMoveTo(next,player.radius))player.root.position.copy(next);
        },k*22);
      }
      matchLater(()=>particleBurst(player.root.position.clone().setY(.6),0xa98cff,22,.09),260);
    }else if(type==='nova'){
      superPulse(player,0x5be0d0,1.35);
      superFlash(player,0x5be0d0);
      tone(460,.12,'sine',.04,360);
      createNovaField(i);
    }else if(type==='fan'){
      const base=new THREE.Vector3(player.aim.x,0,player.aim.y);
      if(base.lengthSq()<.01)base.set(0,0,i===0?-1:1);
      base.normalize();
      superPulse(player,0xff7fb5,1.0);
      superFlash(player,0xff7fb5);
      showBanner(`P${i+1} BLADE WALL!`,520);
      tone(290,.07,'triangle',.035,240);
      for(let k=-4;k<=4;k++){
        superShot(i,base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),k*.14),18,8.8,'bladegun',.16,2.8,{ricochetMax:2});
      }
    }else if(type==='boneStorm'){
      superPulse(player,0xff6a54,1.25);
      superFlash(player,0xff6a54);
      showBanner(`P${i+1} BONE RAIN!`,520);
      tone(120,.1,'square',.04,210);
      const enemy=getPlayers()[1-i];
      const center=enemy.root.position.clone();
      for(let k=0;k<7;k++){
        const position=center.clone();
        if(k>0){
          const angle=Math.PI*2*(k-1)/6;
          position.x+=Math.cos(angle)*1.7;
          position.z+=Math.sin(angle)*1.7;
        }
        queueBoneStrike(i,position,.48+k*.12);
      }
    }

    vibrate([20,18,35]);
  }

  function damageObstacle(obstacle,amount,pos,style='rifle',bounces=0){
    const {handled,destroyed}=damageArenaObstacle(obstacle,amount);
    if(!handled)return false;
    weaponEffects.impact(style,pos,'obstacle',bounces);
    if(destroyed){
      particleBurst(pos.clone().setY(.6),0xc58b4a,18,.09);
      tone(70,.12,'sawtooth',.035,-25);
    }
    return true;
  }

  function damage(victim,amount,attacker,style='rifle',impactPosition=null,bounces=0,options={}){
    const players=getPlayers();
    const player=players[victim];
    if(!player.alive||player.invuln>0)return;

    if(player.cfg.defense==='barrier'&&player.barrier>0){
      const absorbed=Math.min(player.barrier,amount);
      player.barrier-=absorbed;
      amount-=absorbed;
      addHitStop(.03);
      particleBurst(player.root.position.clone().setY(.9),0x8fefff,8,.06);
      tone(470,.045,'sine',.022,-80);
      if(amount<=0)return;
    }

    if(player.cfg.defense==='guard'&&player.guarding&&player.guard>0){
      const source=players[attacker]?.root.position;
      if(source&&sourceFrontDot(player,source)>.05){
        player.guard=Math.max(0,player.guard-amount*1.1);
        amount*=.35;
        addHitStop(.04);
        tone(170,.05,'square',.028,-60);
        if(player.guard<=0){
          player.guarding=false;
          player.defenseCd=1;
          showBanner(`P${victim+1} GUARD BREAK!`,480);
          flashPlayer(player,.18);
          particleBurst(player.root.position.clone().setY(.8),0xff8a55,18,.1);
        }
      }
    }

    amount*=bodyIncomingMul(player)*(player.cfg.damageTakenMul||1);
    const finalDamage=amount;
    player.stats.damageTaken+=finalDamage;
    if(players[attacker]){
      players[attacker].stats.damageDealt+=finalDamage;
      players[attacker].stats.hits++;
    }
    player.hp=Math.max(0,player.hp-finalDamage);
    onDamage?.(finalDamage);
    damagePop(finalDamage);
    if(players[attacker]&&options.grantAttackerSuper!==false){
      players[attacker].super=Math.min(100,players[attacker].super+finalDamage*.9*superGainMul(players[attacker]));
    }
    player.super=Math.min(100,player.super+finalDamage*.35*superGainMul(player));

    flashPlayer(player,.11);
    playPlayerAction(player,'hit');
    weaponEffects.impact(style,impactPosition||player.root.position.clone().setY(.9),'player',bounces);
    const src=players[attacker]?.root.position;
    if(src){
      const away=player.root.position.clone().sub(src);
      away.y=0;
      if(away.lengthSq()>.001){
        away.normalize();
        const baseKnock=THREE.MathUtils.clamp(.18+amount*.008,.22,.48);
        const resist=THREE.MathUtils.clamp(player.cfg.knockbackResist||0,-.15,.45);
        const knock=baseKnock*(1-resist);
        const next=player.root.position.clone().addScaledVector(away,knock);
        if(canMoveTo(next,player.radius))player.root.position.copy(next);
      }
    }

    addHitStop(.045);
    tone(85,.07,'sawtooth',.04,-30);
    vibrate(18);
    if(player.hp<=0)onKO(victim,attacker);
  }

  function ricochetMultiplier(bullet){
    if(bullet.style!=='bladegun')return 1;
    if(bullet.bounces<=0)return .8;
    if(bullet.bounces===1)return 1;
    if(bullet.bounces===2)return 1.3;
    return 2;
  }

  function registerRicochet(bullet){
    bullet.bounces++;
    projectileVisuals.ricochet(bullet);
    particleBurst(bullet.mesh.position.clone().setY(.65),0xff9fd0,7,.045);
    tone(340+bullet.bounces*90,.035,'triangle',.018,70);
    bullet.mesh.position.addScaledVector(bullet.vel.clone().normalize(),.10);
  }

  function reflectFromObstacle(bullet,obstacle){
    if(bullet.style!=='bladegun'||bullet.bounces>=bullet.ricochetMax||obstacle.destructible)return false;
    if(obstacle.circle){
      const normal=new THREE.Vector3(
        bullet.mesh.position.x-obstacle.x,
        0,
        bullet.mesh.position.z-obstacle.z
      );
      if(normal.lengthSq()<.001)normal.set(1,0,0);
      normal.normalize();
      bullet.vel.reflect(normal);
    }else{
      const dx=bullet.mesh.position.x-obstacle.x;
      const dz=bullet.mesh.position.z-obstacle.z;
      const nx=Math.abs(dx)/Math.max(.01,obstacle.hw);
      const nz=Math.abs(dz)/Math.max(.01,obstacle.hd);
      if(nx>nz)bullet.vel.x*=-1;
      else bullet.vel.z*=-1;
    }
    registerRicochet(bullet);
    return true;
  }

  function reflectFromArenaEdge(bullet){
    const limitX=ARENA.halfW-bullet.radius;
    const limitZ=ARENA.halfH-bullet.radius;
    const hitX=Math.abs(bullet.mesh.position.x)>limitX;
    const hitZ=Math.abs(bullet.mesh.position.z)>limitZ;
    if(!hitX&&!hitZ)return false;
    if(bullet.style!=='bladegun'||bullet.bounces>=bullet.ricochetMax)return false;
    if(hitX){
      bullet.mesh.position.x=THREE.MathUtils.clamp(bullet.mesh.position.x,-limitX,limitX);
      bullet.vel.x*=-1;
    }
    if(hitZ){
      bullet.mesh.position.z=THREE.MathUtils.clamp(bullet.mesh.position.z,-limitZ,limitZ);
      bullet.vel.z*=-1;
    }
    registerRicochet(bullet);
    return true;
  }

  function updateProjectiles(dt){
    updateSuperEffects(dt);
    const players=getPlayers();
    for(let i=bullets.length-1;i>=0;i--){
      const bullet=bullets[i];
      if(bullet.homing){
        const target=players[1-bullet.owner];
        if(target?.alive){
          const speed=bullet.vel.length();
          const desired=target.root.position.clone().sub(bullet.mesh.position).setY(0).normalize();
          const current=bullet.vel.clone().normalize();
          current.lerp(desired,THREE.MathUtils.clamp(bullet.homing*dt,0,1)).normalize();
          bullet.vel.copy(current.multiplyScalar(speed));
        }
      }
      if(bullet.curveBase){
        bullet.curveTime+=dt;
        if(bullet.curveTime>bullet.curveDelay){
          const speed=bullet.vel.length();
          const current=bullet.vel.clone().normalize();
          current.lerp(bullet.curveBase,THREE.MathUtils.clamp((bullet.curveTime-bullet.curveDelay)*2.2*dt,0,1)).normalize();
          bullet.vel.copy(current.multiplyScalar(speed));
        }
      }
      bullet.life-=dt;
      bullet.mesh.position.addScaledVector(bullet.vel,dt);
      projectileVisuals.update(bullet,dt,performance.now());

      let remove=bullet.life<=0;
      if(!remove){
        const obstacle=hitObstacle(bullet.mesh.position,bullet.radius);
        if(obstacle){
          if(!reflectFromObstacle(bullet,obstacle)){
            damageObstacle(obstacle,bullet.damage,bullet.mesh.position,bullet.style,bullet.bounces);
            remove=true;
          }
        }else if(
          Math.abs(bullet.mesh.position.x)>ARENA.halfW-bullet.radius||
          Math.abs(bullet.mesh.position.z)>ARENA.halfH-bullet.radius
        ){
          if(!reflectFromArenaEdge(bullet))remove=true;
        }
      }

      if(!remove){
        const enemy=1-bullet.owner;
        const player=players[enemy];
        const dx=bullet.mesh.position.x-player.root.position.x;
        const dz=bullet.mesh.position.z-player.root.position.z;
        if(player.alive&&dx*dx+dz*dz<(player.radius+bullet.radius)**2){
          if(player.cfg.defense==='parry'&&player.parryActive>0&&sourceFrontDot(player,bullet.mesh.position)>-.15){
            parryBullet(enemy,bullet);
            remove=false;
          }else{
            damage(enemy,bullet.damage*ricochetMultiplier(bullet),bullet.owner,bullet.style,bullet.mesh.position,bullet.bounces,{grantAttackerSuper:!bullet.isSuper});
            remove=true;
          }
        }
      }

      if(remove){
        disposeBullet(bullet);
        bullets.splice(i,1);
      }
    }
  }

  function clearProjectiles(){
    bullets.forEach(disposeBullet);
    bullets.length=0;
    superEffects.forEach(disposeSuperEffect);
    superEffects.length=0;
    weaponEffects.clear();
  }

  return {shoot,defenseAction,activateSuper,updateProjectiles,clearProjectiles};
}
