import * as THREE from 'three';
import { ARENA } from './arena-config.js?v=695';
import { BODY_META } from './loadout-config.js?v=6120';
import { createProjectileVisualController } from './projectile-visuals.js?v=6141';

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
  damagePop,
  addHitStop,
  onKO
}){
  const bullets=[];
  const projectileVisuals=createProjectileVisualController();

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

  function muzzleFlash(player){
    const flash=new THREE.Mesh(
      new THREE.SphereGeometry(.12,6,4),
      new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.9,depthWrite:false})
    );
    const dir=new THREE.Vector3(player.aim.x,0,player.aim.y);
    if(dir.lengthSq()<.01)dir.set(0,0,player.i===0?-1:1);
    dir.normalize();
    flash.position.copy(player.root.position).addScaledVector(dir,.9);
    flash.position.y=.86;
    scene.add(flash);
    matchLater(()=>{
      scene.remove(flash);
      flash.geometry.dispose();
      flash.material.dispose();
    },45);
  }

  function weaponShotSound(style){
    if(style==='scatter'){
      tone(92,.065,'square',.03,35);
      matchLater(()=>tone(138,.04,'square',.018,-25),24);
    }else if(style==='rapid'){
      tone(245,.028,'square',.016,95);
    }else if(style==='arcane'){
      tone(410,.07,'sine',.028,180);
      matchLater(()=>tone(620,.045,'sine',.016,-100),30);
    }else if(style==='bladegun'){
      tone(215,.04,'triangle',.02,120);
    }else if(style==='cannon'){
      tone(68,.11,'sawtooth',.04,22);
      matchLater(()=>tone(105,.065,'square',.022,-35),36);
    }else{
      tone(180,.04,'square',.02,85);
    }
  }

  function applyShotRecoil(player){
    let recoil=player.cfg.recoil||0;
    recoil*=THREE.MathUtils.clamp(1-(player.cfg.recoilResist||0),.55,1.15);
    if(recoil<=0)return;
    const dir=new THREE.Vector3(player.aim.x,0,player.aim.y);
    if(dir.lengthSq()<.01)return;
    dir.normalize().multiplyScalar(-recoil);
    const next=player.root.position.clone().add(dir);
    if(canMoveTo(next,player.radius))player.root.position.copy(next);
  }

  function spawnBullet(owner,dir,damage,speed){
    const players=getPlayers();
    const player=players[owner];
    const style=player?.cfg.weaponStyle||'rifle';
    const radius=player?.cfg.bulletRadius||.16;
    const mesh=projectileVisuals.create(style,radius,player?.powerBuff>0);
    mesh.position.copy(player.root.position);
    mesh.position.y=.82;
    const forward=dir.clone().normalize();
    mesh.position.addScaledVector(forward,.82);
    scene.add(mesh);

    bullets.push({
      mesh,
      vel:forward.multiplyScalar(speed),
      owner,
      life:player?.cfg.bulletLife||1.45,
      radius,
      damage,
      style,
      bounces:0,
      ricochetMax:style==='bladegun'?3:0
    });
  }

  function shoot(i){
    const player=getPlayers()[i];
    if(!isRunning()||!player?.alive||player.fireCd>0||player.recovery>0||player.overheated||player.guarding||player.aim.lengthSq()<.12)return;
    player.fireCd=player.cfg.fireCd;
    player.recovery=player.cfg.recovery||0;
    player.stats.shots++;
    playPlayerAction(player,'shoot');
    player.heat=Math.min(100,(player.heat||0)+(player.cfg.pellets>1?30:player.cfg.fireCd<.12?9:player.cfg.fireCd>.75?42:18));
    if(player.heat>=100&&!player.overheated){
      player.overheated=true;
      showBanner(`P${i+1} OVERHEAT!`,420);
      tone(120,.11,'sawtooth',.03,-45);
      if(navigator.vibrate)navigator.vibrate([20,30,20]);
    }
    const base=new THREE.Vector3(player.aim.x,0,player.aim.y).normalize();
    const count=player.cfg.pellets||1;
    const attackMul=bodyDamageMul(player)*(player.powerBuff>0?1.18:1);
    for(let n=0;n<count;n++){
      const ang=count===1
        ?(Math.random()-.5)*(player.cfg.spread||0)
        :THREE.MathUtils.lerp(-player.cfg.spread,player.cfg.spread,n/(count-1));
      const dir=base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),ang);
      spawnBullet(i,dir,player.cfg.damage*attackMul,player.cfg.bulletSpeed);
    }
    muzzleFlash(player);
    applyShotRecoil(player);
    weaponShotSound(player.cfg.weaponStyle||'rifle');
    if(navigator.vibrate)navigator.vibrate(player.cfg.weaponStyle==='cannon'?24:player.cfg.weaponStyle==='scatter'?14:8);
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
      showBanner(player.guarding?`P${i+1} GUARD`:`P${i+1} RELEASE`,240);
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
      showBanner(`P${i+1} ROLL!`,260);
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
      showBanner(`P${i+1} STEP!`,240);
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
      showBanner(`P${i+1} EVADE!`,260);
    }else if(type==='barrier'){
      playPlayerAction(player,'defense');
      player.defenseCd=6;
      player.barrier=55;
      particleBurst(player.root.position.clone().setY(.9),0x8fefff,18,.08);
      tone(520,.09,'sine',.03,-120);
      showBanner(`P${i+1} BARRIER!`,320);
    }else if(type==='parry'){
      playPlayerAction(player,'defense');
      player.defenseCd=.85;
      player.parryActive=.18;
      tone(720,.035,'square',.018,-90);
      showBanner(`P${i+1} PARRY`,220);
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
    if(navigator.vibrate)navigator.vibrate([12,18,12]);
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

  function superShot(owner,dir,damage,speed,style,radius=.18,life=1.4){
    const player=getPlayers()[owner];
    const mesh=projectileVisuals.create(style,radius,true);
    mesh.position.copy(player.root.position);
    mesh.position.y=.9;
    const forward=dir.clone().normalize();
    mesh.position.addScaledVector(forward,.9);
    scene.add(mesh);
    bullets.push({mesh,vel:forward.multiplyScalar(speed),owner,life,radius,damage:damage*bodyDamageMul(player),style,bounces:0,ricochetMax:0});
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
      const baseDamage=Math.max(8,player.cfg.damage*.78);
      for(let k=0;k<12;k++){
        matchLater(()=>{
          if(!isRunning()||!player.alive)return;
          const dir=new THREE.Vector3(player.aim.x,0,player.aim.y).normalize();
          superShot(i,dir,baseDamage,16.5,'rapid',.11,1.4);
          muzzleFlash(player);
          tone(285,.025,'square',.014,80);
        },k*62);
      }
    }else if(type==='blast'){
      superPulse(player,0xffb05a,1.25);
      superFlash(player,0xffb05a);
      showBanner(`P${i+1} BLAST RING!`,520);
      tone(105,.12,'sawtooth',.045,80);
      for(let k=0;k<18;k++){
        const a=(Math.PI*2*k)/18;
        superShot(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),17,11.2,'scatter',.14,1.15);
      }
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
      showBanner(`P${i+1} NOVA!`,520);
      tone(460,.12,'sine',.04,360);
      player.hp=Math.min(player.maxHp,player.hp+24);
      for(let k=0;k<20;k++){
        const a=Math.PI*2*k/20;
        superShot(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),19,9.6,'arcane',.21,2.0);
      }
    }else if(type==='fan'){
      const base=new THREE.Vector3(player.aim.x,0,player.aim.y);
      if(base.lengthSq()<.01)base.set(0,0,i===0?-1:1);
      base.normalize();
      superPulse(player,0xff7fb5,1.0);
      superFlash(player,0xff7fb5);
      showBanner(`P${i+1} BLADE FAN!`,520);
      tone(290,.07,'triangle',.035,240);
      for(let k=-5;k<=5;k++){
        superShot(i,base.clone().applyAxisAngle(new THREE.Vector3(0,1,0),k*.105),18,15.5,'bladegun',.14,1.5);
      }
    }else if(type==='boneStorm'){
      superPulse(player,0xff6a54,1.25);
      superFlash(player,0xff6a54);
      showBanner(`P${i+1} STORM!`,520);
      tone(120,.1,'square',.04,210);
      for(let wave=0;wave<2;wave++){
        matchLater(()=>{
          if(!isRunning()||!player.alive)return;
          superPulse(player,wave===0?0xff6a54:0xffffff,1.0+wave*.18);
          for(let k=0;k<16;k++){
            const a=Math.PI*2*k/16+wave*.095;
            superShot(i,new THREE.Vector3(Math.sin(a),0,Math.cos(a)),20,10.5,'cannon',.19,1.75);
          }
          tone(wave===0?125:165,.07,'square',.03,90);
        },wave*220);
      }
    }

    if(navigator.vibrate)navigator.vibrate([20,18,35]);
  }

  function damageObstacle(obstacle,amount,pos){
    const {handled,destroyed}=damageArenaObstacle(obstacle,amount);
    if(!handled)return false;
    particleBurst(pos.clone().setY(.55),0xd6a05d,7,.065);
    if(destroyed){
      particleBurst(pos.clone().setY(.6),0xc58b4a,18,.09);
      tone(70,.12,'sawtooth',.035,-25);
    }
    return true;
  }

  function damage(victim,amount,attacker){
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
        player.guard=Math.max(0,player.guard-amount*1.25);
        amount*=.22;
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
    damagePop(finalDamage);
    if(players[attacker])players[attacker].super=Math.min(100,players[attacker].super+finalDamage*.9*superGainMul(players[attacker]));
    player.super=Math.min(100,player.super+finalDamage*.35*superGainMul(player));

    flashPlayer(player,.11);
    playPlayerAction(player,'hit');
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
    particleBurst(player.root.position.clone().setY(.9),0xffffff,10,.075);
    if(navigator.vibrate)navigator.vibrate(18);
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
    const players=getPlayers();
    for(let i=bullets.length-1;i>=0;i--){
      const bullet=bullets[i];
      bullet.life-=dt;
      bullet.mesh.position.addScaledVector(bullet.vel,dt);
      projectileVisuals.update(bullet,dt,performance.now());

      let remove=bullet.life<=0;
      if(!remove){
        const obstacle=hitObstacle(bullet.mesh.position,bullet.radius);
        if(obstacle){
          if(!reflectFromObstacle(bullet,obstacle)){
            damageObstacle(obstacle,bullet.damage,bullet.mesh.position);
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
            damage(enemy,bullet.damage*ricochetMultiplier(bullet),bullet.owner);
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
  }

  return {shoot,defenseAction,activateSuper,updateProjectiles,clearProjectiles};
}
