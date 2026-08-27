const EPSILON=1e-8;

export function segmentCircleHit(start,end,center,radius){
  const dx=end.x-start.x;
  const dz=end.z-start.z;
  const lengthSq=dx*dx+dz*dz;
  const rawT=lengthSq>EPSILON
    ?((center.x-start.x)*dx+(center.z-start.z)*dz)/lengthSq
    :0;
  const t=Math.max(0,Math.min(1,rawT));
  const x=start.x+dx*t;
  const z=start.z+dz*t;
  const offsetX=x-center.x;
  const offsetZ=z-center.z;
  return {hit:offsetX*offsetX+offsetZ*offsetZ<=radius*radius,t,x,z};
}

export function assistedAimDirection({aim,origin,target,maxAngleRad=Math.PI/36}){
  const aimLength=Math.hypot(aim.x,aim.z);
  const targetX=target.x-origin.x;
  const targetZ=target.z-origin.z;
  const targetLength=Math.hypot(targetX,targetZ);
  if(aimLength<EPSILON||targetLength<EPSILON){
    return {x:aim.x,z:aim.z,assisted:false};
  }

  const aimX=aim.x/aimLength;
  const aimZ=aim.z/aimLength;
  const directX=targetX/targetLength;
  const directZ=targetZ/targetLength;
  const dot=Math.max(-1,Math.min(1,aimX*directX+aimZ*directZ));
  if(Math.acos(dot)>maxAngleRad){
    return {x:aimX,z:aimZ,assisted:false};
  }
  return {x:directX,z:directZ,assisted:true};
}
