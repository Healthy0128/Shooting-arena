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

for file in \
  src/main.js src/game.js src/input.js src/controls.js src/hud-ui.js src/camera.js \
  src/arena.js src/player.js src/combat.js src/arena-config.js src/ui.js \
  src/menu-ui.js src/match-ui.js src/loadout-config.js; do
  check "$file syntax" node --check "$file"
done

check "stable main entry" grep -Eq 'src/main\.js\?v=[0-9]+' index.html
check "camera controller exported" grep -Fq 'export function createCameraController' src/camera.js
check "arena controller exported" grep -Fq 'export function createArenaController' src/arena.js
check "player controller exported" grep -Fq 'export function createPlayerController' src/player.js
check "combat controller exported" grep -Fq 'export function createCombatController' src/combat.js
check "input controller exported" grep -Fq 'export function createInputController' src/input.js
check "control mapper exported" grep -Fq 'export function createControlMapper' src/controls.js
check "HUD controller exported" grep -Fq 'export function createHudUI' src/hud-ui.js
check "loadout renderer exported" grep -Fq 'export function renderLoadoutSummary' src/menu-ui.js
check "loadout summary delegated" grep -Fq 'renderLoadoutSummary(card,cfg,cost,over);' src/game.js
check "defense descriptions centralized" grep -Fq 'export const DEFENSE_INFO=' src/loadout-config.js
check "super descriptions centralized" grep -Fq 'export const SUPER_INFO=' src/loadout-config.js
check "visual menu stylesheet loaded" grep -Fq 'menu-stats.css' index.html
check "stat meters rendered" grep -Fq "meter('HP'" src/menu-ui.js
check "ability cards rendered" grep -Fq 'class="ability-grid"' src/menu-ui.js
check "stage spawn pads visualized" grep -Fq 'function addSpawnPads(theme,type)' src/arena.js
check "stage architecture visualized" grep -Fq 'function addStageArchitecture(type,theme)' src/arena.js
check "stage architecture built" grep -Fq 'addStageArchitecture(type,theme);' src/arena.js

check "countdown generation guard" grep -Fq 'async function battleCountdown(generation)' src/game.js
check "stale countdown abort" grep -Fq 'if(generation!==matchGeneration)return;' src/game.js
check "BGM request guard" grep -Fq 'realBGMRequestId' src/game.js
check "combat projectile update delegated" grep -Fq 'combatController.updateProjectiles(dt);' src/game.js
check "player visuals delegated" grep -Fq 'playerController.updatePlayerVisuals(p,dt,inBush);' src/game.js
check "arena movement delegated" grep -Fq 'const canMoveTo=arenaController.canMoveTo;' src/game.js
check "camera render delegated" grep -Fq 'cameraController.render();' src/game.js
check "input update delegated" grep -Fq 'input.update();' src/game.js

for symbol in \
  projectileGeometryFor muzzleFlash weaponShotSound applyShotRecoil disposeBullet \
  spawnBullet shoot defenseAction sourceFrontDot parryBullet superPulse superFlash \
  superShot activateSuper damageObstacle damage; do
  echo "CHECK: no local $symbol combat implementation in game.js"
  if grep -Eq "^[[:space:]]*(async[[:space:]]+)?function[[:space:]]+${symbol}[[:space:]]*\\(" src/game.js; then
    echo "::error::$symbol combat implementation returned to game.js"
    exit 1
  fi
  echo "PASS: no local $symbol combat implementation in game.js"
done

for symbol in \
  loadCharacterAsset findClip attachWeaponModel attachRealModel makePlayer flashPlayer \
  defenseTrail updateDefenseFx updatePlayerVisuals; do
  echo "CHECK: no local $symbol player implementation in game.js"
  if grep -Eq "^[[:space:]]*(async[[:space:]]+)?function[[:space:]]+${symbol}[[:space:]]*\\(" src/game.js; then
    echo "::error::$symbol player implementation returned to game.js"
    exit 1
  fi
  echo "PASS: no local $symbol player implementation in game.js"
done

for symbol in buildArena canMoveTo hitObstacle renderSplitArena updateTopCamera screenVectorToWorld; do
  echo "CHECK: no local $symbol implementation in game.js"
  if grep -Eq "^[[:space:]]*(async[[:space:]]+)?function[[:space:]]+${symbol}[[:space:]]*\\(" src/game.js; then
    echo "::error::$symbol implementation returned to game.js"
    exit 1
  fi
  echo "PASS: no local $symbol implementation in game.js"
done

check "match result stats host" grep -Fq 'id="match-result-stats"' index.html

if grep -Fq 'id="build-limit-value"' index.html || grep -Fq 'budget-legend' index.html; then
  echo '::error::build limit UI returned after cost restrictions were disabled'
  exit 1
fi
echo 'PASS: build limit UI remains removed'

if grep -Fq "querySelector('#build-limit-value')" src/menu-ui.js || grep -Fq 'buildLimitValue.textContent' src/menu-ui.js; then
  echo '::error::stale build limit DOM access remains in menu-ui.js'
  exit 1
fi
echo 'PASS: no stale build limit DOM access'

if grep -Fq '<option ' index.html; then
  echo '::error::duplicated loadout options returned to HTML'
  exit 1
fi

echo "All runtime checks passed."
