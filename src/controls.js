import * as THREE from 'three';

export function createControlMapper({getMode,getTpsBasis,getPortrait}){
  function normalizeFaceToFace(player,x,y){
    if(player===1)return {x:-x,y:-y};
    return {x,y};
  }

  function mapTopDown(player,x,y){
    const local=normalizeFaceToFace(player,x,y);
    if(getPortrait())return new THREE.Vector2(-local.y,local.x);
    return new THREE.Vector2(local.x,local.y);
  }

  function mapTps(player,x,y){
    const local=normalizeFaceToFace(player,x,y);
    const basis=getTpsBasis(player);
    const forward=basis.forward;
    const right=basis.right;
    const worldX=right.x*local.x+forward.x*(-local.y);
    const worldZ=right.y*local.x+forward.y*(-local.y);
    const result=new THREE.Vector2(worldX,worldZ);
    if(result.lengthSq()>1)result.normalize();
    return result;
  }

  function mapStick(player,x,y){
    return getMode()==='arena'
      ?mapTps(player,x,y)
      :mapTopDown(player,x,y);
  }

  return {mapStick};
}
