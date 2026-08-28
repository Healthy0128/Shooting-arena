import * as THREE from 'three';

export function createParticleSystem({scene,getQualityProfile}){
  const particles=[];
  const available=[];
  const geometry=new THREE.SphereGeometry(1,6,6);

  function acquireParticle(){
    if(available.length)return available.pop();
    const mesh=new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({transparent:true,opacity:1})
    );
    mesh.visible=false;
    scene.add(mesh);
    return {mesh,velocity:new THREE.Vector3(),life:0,maxLife:.28};
  }

  function releaseParticle(particle){
    particle.mesh.visible=false;
    available.push(particle);
  }

  function burst(position,color=0xffffff,count=9,scale=.08){
    const quality=getQualityProfile();
    const requested=Math.max(1,Math.round(count*quality.particleScale));
    const allowed=Math.max(0,Math.min(requested,quality.maxParticles-particles.length));
    for(let i=0;i<allowed;i++){
      const particle=acquireParticle();
      const {mesh,velocity}=particle;
      mesh.material.color.set(color);
      mesh.material.opacity=1;
      mesh.scale.setScalar(scale);
      mesh.position.copy(position);
      mesh.visible=true;
      velocity.set((Math.random()-.5)*4,Math.random()*2.8,(Math.random()-.5)*4);
      particle.life=particle.maxLife;
      particles.push(particle);
    }
  }

  function update(dt){
    for(let i=particles.length-1;i>=0;i--){
      const particle=particles[i];
      particle.life-=dt;
      particle.mesh.position.addScaledVector(particle.velocity,dt);
      particle.velocity.y-=6*dt;
      particle.mesh.material.opacity=Math.max(0,particle.life/particle.maxLife);
      if(particle.life<=0){
        particles.splice(i,1);
        releaseParticle(particle);
      }
    }
  }

  function clear(){
    particles.forEach(releaseParticle);
    particles.length=0;
  }

  return {burst,update,clear,count:()=>particles.length};
}
