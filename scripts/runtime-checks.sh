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
  src/arena.js src/stage-visuals.js src/player.js src/combat.js src/arena-config.js src/ui.js \
  src/menu-ui.js src/match-ui.js src/loadout-config.js src/audio.js src/projectile-visuals.js; do
  check "$file syntax" node --check "$file"
done

check "stable main entry" grep -Eq 'src/main\.js\?v=[0-9]+' index.html
check "camera controller exported" grep -Fq 'export function createCameraController' src/camera.js
check "arena controller exported" grep -Fq 'export function createArenaController' src/arena.js
check "stage visuals exported" grep -Fq 'export function addStageVisuals' src/stage-visuals.js
check "player controller exported" grep -Fq 'export function createPlayerController' src/player.js
check "combat controller exported" grep -Fq 'export function createCombatController' src/combat.js
check "audio controller exported" grep -Fq 'export function createAudioController' src/audio.js
check "projectile visual controller exported" grep -Fq 'export function createProjectileVisualController' src/projectile-visuals.js
check "input controller exported" grep -Fq 'export function createInputController' src/input.js
check "control mapper exported" grep -Fq 'export function createControlMapper' src/controls.js
check "HUD controller exported" grep -Fq 'export function createHudUI' src/hud-ui.js
check "loadout renderer exported" grep -Fq 'export function renderLoadoutSummary' src/menu-ui.js
check "loadout summary delegated" grep -Fq 'renderLoadoutSummary(card,cfg,cost,over);' src/game.js
check "defense descriptions centralized" grep -Fq 'export const DEFENSE_INFO=' src/loadout-config.js
check "super descriptions centralized" grep -Fq 'export const SUPER_INFO=' src/loadout-config.js
check "weapon descriptions centralized" grep -Fq 'export const WEAPON_INFO=' src/loadout-config.js
check "Japanese character names" grep -Fq "name:'レンジャー'" src/loadout-config.js
check "Japanese weapon names" grep -Fq "name:'ショットガン'" src/loadout-config.js
check "long body descriptions" grep -Fq 'longDesc:' src/loadout-config.js
check "body attack tradeoffs defined" grep -Fq 'damageMul:' src/loadout-config.js
check "body defense tradeoffs defined" grep -Fq 'damageTakenMul:' src/loadout-config.js
check "body super tradeoffs defined" grep -Fq 'superGainMul:' src/loadout-config.js
check "scatter has seven pellets" grep -Fq 'pellets:7' src/loadout-config.js
check "rapid has extreme fire rate" grep -Fq 'fireCd:.095' src/loadout-config.js
check "cannon has heavy single hit" grep -Fq 'damage:58' src/loadout-config.js
check "blade ricochet multiplier exists" grep -Fq 'function ricochetMultiplier(bullet)' src/combat.js
check "blade direct hit is discounted" grep -Fq 'if(bullet.bounces<=0)return .8;' src/combat.js
check "blade two bounce bonus" grep -Fq 'if(bullet.bounces===2)return 1.3;' src/combat.js
check "blade three bounce bonus" grep -Fq 'return 2;' src/combat.js
check "arena edge ricochet exists" grep -Fq 'function reflectFromArenaEdge(bullet)' src/combat.js
check "obstacle ricochet exists" grep -Fq 'function reflectFromObstacle(bullet,obstacle)' src/combat.js
check "body damage affects shots" grep -Fq 'const attackMul=bodyDamageMul(player)' src/combat.js
check "body toughness affects incoming damage" grep -Fq 'amount*=bodyIncomingMul(player)' src/combat.js
check "body super gain affects meter" grep -Fq 'superGainMul(players[attacker])' src/combat.js
check "visual menu stylesheet loaded" grep -Fq 'menu-stats.css' index.html
check "Japanese stat meters rendered" grep -Fq "meter('体力'" src/menu-ui.js
check "weapon profile rendered" grep -Fq 'class="weapon-profile detail-target"' src/menu-ui.js
check "ability cards rendered" grep -Fq 'class="ability-grid"' src/menu-ui.js
check "long press detail modal" grep -Fq 'function installDetailInteraction()' src/menu-ui.js
check "detail hold threshold" grep -Fq '},520);' src/menu-ui.js
check "detail modal styled" grep -Fq '.detail-modal{' menu-stats.css
check "Japanese menu labels" grep -Fq '<label>武器<select data-slot="weapon"></select></label>' index.html
check "stage spawn pads visualized" grep -Fq 'function addSpawnPads(arenaRoot,theme,type)' src/stage-visuals.js
check "stage architecture visualized" grep -Fq 'function addStageArchitecture(arenaRoot,type,theme' src/stage-visuals.js
check "stage visuals delegated" grep -Fq 'addStageVisuals({arenaRoot,type,theme,attachPropVisual,buildId});' src/arena.js

check "countdown generation guard" grep -Fq 'async function battleCountdown(generation)' src/game.js
check "stale countdown abort" grep -Fq 'if(generation!==matchGeneration)return;' src/game.js
check "BGM request guard" grep -Fq 'realBGMRequestId' src/audio.js
check "menu BGM delegated" grep -Fq 'playMenuBGM();' src/game.js
check "battle BGM delegated" grep -Fq "playBattleBGM(arenaSelection==='hex'?'space':'normal');" src/game.js
check "projectile visuals delegated" grep -Fq 'projectileVisuals.update(bullet,dt,performance.now());' src/combat.js
check "shoot animation delegated" grep -Fq "playPlayerAction(player,'shoot');" src/combat.js
check "death animation delegated" grep -Fq "playPlayerAction(player,'death');" src/game.js
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

for symbol in createAudioController playBattleBGM playMenuBGM stopAllBGM playCountdownVoice; do
  echo "CHECK: no local $symbol audio implementation in game.js"
  if grep -Eq "^[[:space:]]*(async[[:space:]]+)?function[[:space:]]+${symbol}[[:space:]]*\\(" src/game.js; then
    echo "::error::$symbol audio implementation returned to game.js"
    exit 1
  fi
  echo "PASS: no local $symbol audio implementation in game.js"
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
