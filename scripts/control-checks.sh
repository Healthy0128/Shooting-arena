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
check "controls mapper is exported" grep -Fq 'export function createControlMapper' src/controls.js
check "controls normalizes face-to-face input" grep -Fq 'function normalizeFaceToFace' src/controls.js
check "controls separates top-down mapping" grep -Fq 'function mapTopDown' src/controls.js
check "controls separates TPS mapping" grep -Fq 'function mapTps' src/controls.js
check "controls switches by camera mode" grep -Fq "getMode()==='arena'" src/controls.js
check "TPS uses camera basis" grep -Fq 'const basis=getTpsBasis(player);' src/controls.js
check "TPS normalizes P2 physical orientation once" bash -c 'sed -n "/function mapTps/,/function mapStick/p" src/controls.js | grep -Fq "const local=normalizeFaceToFace(player,x,y);"'
check "TPS maps normalized local axes" grep -Fq 'right.x*local.x+forward.x*(-local.y)' src/controls.js
check "camera uses correct ground-plane right basis" grep -Fq 'new THREE.Vector3(-forward3.z,0,forward3.x)' src/camera.js
check "camera imports controls mapper" grep -Eq "from './controls.js\\?v=[0-9]+';" src/camera.js
check "camera delegates stick mapping" grep -Fq 'return controlMapper.mapStick(player,x,y);' src/camera.js
check "camera exposes TPS basis" grep -Fq 'function getTpsBasis' src/camera.js
check "input uses shared control mapping" grep -Fq 'const mapControl=mapStick||screenVectorToWorld;' src/input.js
check "input maps pointer input" grep -Fq 'const world=mapControl(player,vx,vy);' src/input.js
check "input maps keyboard movement" grep -Fq 'players[player].move.copy(mapControl(player,x,y))' src/input.js
check "TPS mode detected in input" grep -Fq "document.body.classList.contains('split-arena')" src/input.js
check "TPS aim does not hold fire" grep -Fq 'players[player].fireHeld=false;' src/input.js
check "TPS tap fires from canvas" grep -Fq "canvas?.addEventListener('pointerdown'" src/input.js
check "split viewport uses logical renderer size" grep -Fq 'renderer.getSize(size);' src/camera.js
check "split reacts to visual viewport resize" grep -Fq "visualViewport?.addEventListener('resize',resize)" src/camera.js
check "iOS layout considers window inner height" grep -Fq 'Math.round(globalThis.innerHeight||0)' src/camera.js
check "iOS layout considers visual viewport height" grep -Fq 'Math.round(vv?.height||0)' src/camera.js
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
