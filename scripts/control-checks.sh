#!/usr/bin/env bash
set -euo pipefail

check() {
  local name="$1"
  shift
  echo "CHECK: $name"
  if "$@"; then
    echo "PASS: $name"
  else
    echo "::error::$name"
    exit 1
  fi
}

check "controls.js syntax" node --check src/controls.js
check "camera.js syntax" node --check src/camera.js
check "input.js syntax" node --check src/input.js
check "controls mapper is exported" grep -Fq 'export function createControlMapper' src/controls.js
check "controls normalizes face-to-face input" grep -Fq 'function normalizeFaceToFace' src/controls.js
check "controls separates top-down mapping" grep -Fq 'function mapTopDown' src/controls.js
check "controls separates TPS mapping" grep -Fq 'function mapTps' src/controls.js
check "controls switches by camera mode" grep -Fq "getMode()==='arena'" src/controls.js
check "TPS uses camera basis" grep -Fq 'const basis=getTpsBasis(player);' src/controls.js
check "TPS normalizes P2 physical orientation once" bash -c 'sed -n "/function mapTps/,/function mapStick/p" src/controls.js | grep -Fq "const local=normalizeFaceToFace(player,x,y);"'
check "TPS maps normalized local axes" grep -Fq 'right.x*local.x+forward.x*(-local.y)' src/controls.js
check "camera uses correct ground-plane right basis" grep -Fq 'new THREE.Vector3(-forward3.z,0,forward3.x)' src/camera.js
check "camera delegates stick mapping" grep -Fq 'return controlMapper.mapStick(player,x,y);' src/camera.js
check "camera owns tap raycaster" grep -Fq 'const tapRaycaster=new THREE.Raycaster();' src/camera.js
check "camera raycasts against ground plane" grep -Fq 'tapRaycaster.ray.intersectPlane(groundPlane,hit)' src/camera.js
check "camera mapping exposes ground projection" grep -Fq "if(projection==='ground')return screenPointToGround(player,x,y);" src/camera.js
check "top-down tap uses shared top camera" grep -Fq 'camera=topCamera;' src/camera.js
check "input uses shared control mapping" grep -Fq 'const mapControl=mapStick||screenVectorToWorld;' src/input.js
check "input separates touch and keyboard modes" grep -Fq "let inputMode=matchMedia('(pointer:coarse)').matches?'touch':'keyboard';" src/input.js
check "touch hides aim sticks in both camera modes" grep -Fq "const hideAim=mode==='touch';" src/input.js
check "tap assigns player by screen half" grep -Fq 'const player=localY<half?1:0;' src/input.js
check "TPS tap computes split-view NDC" grep -Fq 'ndcY=1-viewportY/half*2;' src/input.js
check "top-down tap computes full-view NDC" grep -Fq 'ndcY=1-localY/Math.max(1,r.height)*2;' src/input.js
check "tap requests ground projection" grep -Fq "const target=mapControl(player,ndcX,ndcY,'ground');" src/input.js
check "tap aims from player to ground point" grep -Fq 'fighter.aim.set(dx/len,dz/len);' src/input.js
check "tap shows aim feedback" grep -Fq 'showTapMarker(e.clientX,e.clientY,player);' src/input.js
check "tap fires from canvas" grep -Fq "canvas?.addEventListener('pointerdown'" src/input.js
check "keyboard aim always shoots" grep -Fq 'shoot(player);' src/input.js
check "split viewport uses logical renderer size" grep -Fq 'renderer.getSize(size);' src/camera.js
check "split reacts to visual viewport resize" grep -Fq "visualViewport?.addEventListener('resize',resize)" src/camera.js
check "renderer measures actual canvas bounds" grep -Fq 'getBoundingClientRect' src/camera.js
check "renderer uses dynamic viewport height" grep -Fq "canvas.style.height='100dvh'" src/camera.js
check "3D framing target is lowered on screen" grep -Fq 'a.x*.62+b.x*.38,1.15,a.z*.62+b.z*.38' src/camera.js

if grep -Fq 'if(player===1){x=-x;y=-y}' src/camera.js; then
  echo '::error::face-to-face inversion returned to camera mapping'
  exit 1
fi

if sed -n '/function renderSplitArena/,/function setMode/p' src/camera.js | grep -Fq 'getDrawingBufferSize'; then
  echo '::error::split viewport returned to drawing-buffer coordinates'
  exit 1
fi

echo "All control checks passed."
