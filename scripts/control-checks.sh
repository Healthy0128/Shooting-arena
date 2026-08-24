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
check "camera imports controls mapper" grep -Fq "from './controls.js?v=695';" src/camera.js
check "camera delegates stick mapping" grep -Fq 'return controlMapper.mapStick(player,x,y);' src/camera.js
check "camera exposes TPS basis" grep -Fq 'function getTpsBasis' src/camera.js
check "input uses shared control mapping" grep -Fq 'const mapControl=mapStick||screenVectorToWorld;' src/input.js
check "input maps pointer input" grep -Fq 'const world=mapControl(player,vx,vy);' src/input.js
check "input maps keyboard movement" grep -Fq 'players[player].move.copy(mapControl(player,x,y))' src/input.js

if grep -Fq 'if(player===1){x=-x;y=-y}' src/camera.js; then
  echo '::error::face-to-face inversion returned to camera mapping'
  exit 1
fi

echo "All control checks passed."
