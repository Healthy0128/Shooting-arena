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

check "main.js syntax" node --check src/main.js
check "game.js syntax" node --check src/game.js
check "input.js syntax" node --check src/input.js
check "hud-ui.js syntax" node --check src/hud-ui.js
check "camera.js syntax" node --check src/camera.js
check "arena.js syntax" node --check src/arena.js
check "player.js syntax" node --check src/player.js
check "combat.js syntax" node --check src/combat.js
check "arena-config.js syntax" node --check src/arena-config.js
check "ui.js syntax" node --check src/ui.js
check "menu-ui.js syntax" node --check src/menu-ui.js
check "match-ui.js syntax" node --check src/match-ui.js
check "loadout-config.js syntax" node --check src/loadout-config.js

check "index uses stable main entry" grep -Fq './src/main.js?v=695' index.html
check "split renderer exists in camera module" grep -Fq 'function renderSplitArena' src/camera.js
check "top camera updater exists in camera module" grep -Fq 'function updateTopCamera' src/camera.js
check "countdown is generation guarded" grep -Fq 'async function battleCountdown(generation)' src/game.js
check "countdown aborts stale generation" grep -Fq 'if(generation!==matchGeneration)return;' src/game.js
check "BGM async request is guarded" grep -Fq 'realBGMRequestId' src/game.js

echo "CHECK: ui import count"
test "$(grep -Fc "from './ui.js?v=695'" src/game.js)" -eq 1 || { echo '::error::ui import count'; exit 1; }
echo "PASS: ui import count"
check "ui exposes menu UI" grep -Fq "from './menu-ui.js?v=695';" src/ui.js
check "ui re-exports match UI" grep -Fq "from './match-ui.js?v=695';" src/ui.js

echo "CHECK: camera import count"
test "$(grep -Fc "from './camera.js?v=695'" src/game.js)" -eq 1 || { echo '::error::camera import count'; exit 1; }
echo "PASS: camera import count"
check "camera controller is created" grep -Fq 'const cameraController=createCameraController' src/game.js
check "camera controller is exported" grep -Fq 'export function createCameraController' src/camera.js
check "camera controller initializes" grep -Fq 'cameraController.init();' src/game.js
check "camera controller renders" grep -Fq 'cameraController.render();' src/game.js
check "camera owns screen vector mapping" grep -Fq 'screenVectorToWorld:cameraController.screenVectorToWorld' src/game.js
check "HUD reads projection camera from controller" grep -Fq 'getCamera:()=>cameraController.getProjectionCamera()' src/game.js

for symbol in getLayoutSize updateTopCamera updateChaseCamera renderSplitArena setCameraMode resize screenVectorToWorld; do
  echo "CHECK: no local $symbol camera function in game.js"
  if grep -Fq "function $symbol" src/game.js; then echo "::error::$symbol camera function returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol camera function in game.js"
done

for symbol in topCamera chaseCameras cameraMode _baseRender; do
  echo "CHECK: no local $symbol camera state in game.js"
  if grep -Eq "^(const|let|var) ${symbol}([ =]|$)" src/game.js; then echo "::error::$symbol camera state returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol camera state in game.js"
done

echo "CHECK: arena controller import count"
test "$(grep -Fc "from './arena.js?v=695'" src/game.js)" -eq 1 || { echo '::error::arena controller import count'; exit 1; }
echo "PASS: arena controller import count"
check "arena controller is created" grep -Fq 'const arenaController=createArenaController({scene});' src/game.js
check "arena controller is exported" grep -Fq 'export function createArenaController' src/arena.js
check "arena controller owns stage props" grep -Fq "import { ARENA, PROPS, STAGE_THEMES } from './arena-config.js?v=695';" src/arena.js
check "game uses arena build API" grep -Fq 'const buildArena=arenaController.build;' src/game.js
check "game uses arena movement API" grep -Fq 'const canMoveTo=arenaController.canMoveTo;' src/game.js
check "game uses arena hit API" grep -Fq 'const hitObstacle=arenaController.hitObstacle;' src/game.js
check "game uses arena bush API" grep -Fq 'arenaController.isInBush(p.root.position)' src/game.js

for symbol in getArenaTheme loadProp attachPropVisual clearGroup makeFallbackBox addRealBox addRealPillar addBush addWallRun addCrate addBarrel applyArenaTheme addPaintStripe addStageGlow addArenaPerimeter addArenaAccentLights addArenaScenery addCenterPattern addFloorVisual buildArena canMoveTo hitObstacle; do
  echo "CHECK: no local $symbol arena implementation in game.js"
  if grep -Fq "function $symbol" src/game.js; then echo "::error::$symbol arena implementation returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol arena implementation in game.js"
done

for symbol in arenaRoot obstacles bushes propCache arenaBuildId; do
  echo "CHECK: no local $symbol arena state in game.js"
  if grep -Eq "^(const|let|var) ${symbol}([ =]|$)" src/game.js; then echo "::error::$symbol arena state returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol arena state in game.js"
done

echo "CHECK: no stage prop/theme imports in game.js"
if grep -Eq '\b(PROPS|STAGE_THEMES)\b' src/game.js; then echo '::error::stage prop/theme ownership returned to game.js'; exit 1; fi
echo "PASS: no stage prop/theme imports in game.js"

echo "CHECK: player controller import count"
test "$(grep -Fc "from './player.js?v=695'" src/game.js)" -eq 1 || { echo '::error::player controller import count'; exit 1; }
echo "PASS: player controller import count"
check "player controller is created" grep -Fq 'const playerController=createPlayerController({scene});' src/game.js
check "player controller is exported" grep -Fq 'export function createPlayerController' src/player.js
check "player owns character loader" grep -Fq 'const gltfLoader=new GLTFLoader();' src/player.js
check "player owns skeleton cloning" grep -Fq "from 'three/addons/utils/SkeletonUtils.js';" src/player.js
check "game uses player visual updater" grep -Fq 'playerController.updatePlayerVisuals(p,dt,inBush);' src/game.js
check "game uses player reset API" grep -Fq 'playerController.resetPlayer(players[i],i);' src/game.js

for symbol in loadCharacterAsset findClip attachWeaponModel attachRealModel makePlayer flashPlayer defenseTrail updateDefenseFx updatePlayerVisuals; do
  echo "CHECK: no local $symbol player implementation in game.js"
  if grep -Fq "function $symbol" src/game.js; then echo "::error::$symbol player implementation returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol player implementation in game.js"
done

for symbol in gltfLoader assetCache; do
  echo "CHECK: no local $symbol player state in game.js"
  if grep -Eq "^(const|let|var) ${symbol}([ =]|$)" src/game.js; then echo "::error::$symbol player state returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol player state in game.js"
done

echo "CHECK: combat controller import count"
test "$(grep -Fc "from './combat.js?v=695'" src/game.js)" -eq 1 || { echo '::error::combat controller import count'; exit 1; }
echo "PASS: combat controller import count"
check "combat controller is created" grep -Fq 'const combatController=createCombatController({' src/game.js
check "combat controller is exported" grep -Fq 'export function createCombatController' src/combat.js
check "game uses combat projectile updater" grep -Fq 'combatController.updateProjectiles(dt);' src/game.js
check "combat owns XZ bullet collision safeguard" grep -Fq 'Top-down game: hit testing must use the XZ plane only.' src/combat.js

for symbol in projectileGeometryFor muzzleFlash weaponShotSound applyShotRecoil disposeBullet spawnBullet shoot defenseAction sourceFrontDot parryBullet superPulse superFlash superShot activateSuper damageObstacle damage; do
  echo "CHECK: no local $symbol combat implementation in game.js"
  if grep -Fq "function $symbol" src/game.js; then echo "::error::$symbol combat implementation returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol combat implementation in game.js"
done

for symbol in bullets weaponBulletMats bulletMats; do
  echo "CHECK: no local $symbol combat state in game.js"
  if grep -Eq "^(const|let|var) ${symbol}([ =]|$)" src/game.js; then echo "::error::$symbol combat state returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol combat state in game.js"
done

echo "CHECK: input import count"
test "$(grep -Fc "from './input.js?v=695'" src/game.js)" -eq 1 || { echo '::error::input import count'; exit 1; }
echo "PASS: input import count"
check "input controller is created" grep -Fq 'const input=createInputController({' src/game.js
check "input controller is updated" grep -Fq 'input.update();' src/game.js
check "input controller is exported" grep -Fq 'export function createInputController' src/input.js
check "input owns transient reset" grep -Fq 'function clearTransientInput()' src/input.js
check "input handles lost pointer capture" grep -Fq "zone.addEventListener('lostpointercapture',end);" src/input.js
check "input clears transient state on blur" grep -Fq 'clearTransientInput();' src/input.js
check "input clears transient state when hidden" grep -Fq 'if(document.hidden){' src/input.js

for symbol in activePointers keys keyboardInput; do
  echo "CHECK: no local $symbol input state in game.js"
  if grep -Eq "^(const|let|var|function) ${symbol}([ (=]|$)" src/game.js; then echo "::error::$symbol input state returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol input state in game.js"
done

echo "CHECK: HUD import count"
test "$(grep -Fc "from './hud-ui.js?v=695'" src/game.js)" -eq 1 || { echo '::error::HUD import count'; exit 1; }
echo "PASS: HUD import count"
check "HUD controller is created" grep -Fq 'createHudUI({' src/game.js
check "HUD controller is exported" grep -Fq 'export function createHudUI' src/hud-ui.js
for symbol in ensureWorldStatus updateWorldStatus clearWorldStatus updateHUD; do
  echo "CHECK: no local $symbol HUD implementation in game.js"
  if grep -Fq "function $symbol" src/game.js; then echo "::error::$symbol HUD implementation returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol HUD implementation in game.js"
done

echo "CHECK: loadout import count"
test "$(grep -Fc "from './loadout-config.js?v=695'" src/game.js)" -eq 1 || { echo '::error::loadout import count'; exit 1; }
echo "PASS: loadout import count"

check "ARENA is exported" grep -Fq 'export const ARENA=' src/arena-config.js
check "SPAWN_X is exported" grep -Fq 'export const SPAWN_X=' src/arena-config.js
check "PROPS is exported" grep -Fq 'export const PROPS=' src/arena-config.js
check "STAGE_THEMES is exported" grep -Fq 'export const STAGE_THEMES=' src/arena-config.js
check "ARENA_OPTIONS is exported" grep -Fq 'export const ARENA_OPTIONS=' src/arena-config.js
check "arena module uses arena config" grep -Fq "from './arena-config.js?v=695';" src/arena.js
check "player module uses arena config" grep -Fq "from './arena-config.js?v=695';" src/player.js
check "combat module uses arena config" grep -Fq "from './arena-config.js?v=695';" src/combat.js
check "menu UI uses ARENA_OPTIONS" grep -Fq 'ARENA_OPTIONS' src/menu-ui.js
check "arena button host exists" grep -Fq 'class="arena-buttons"' index.html

echo "CHECK: no HTML-owned arena options"
if grep -Fq 'data-arena=' index.html; then echo '::error::HTML-owned arena options returned'; exit 1; fi
echo "PASS: no HTML-owned arena options"

for symbol in PROP_BASE PROPS STAGE_THEMES; do
  echo "CHECK: no local $symbol stage config in game.js"
  if grep -Eq "^(const|let|var) ${symbol}([ =]|$)" src/game.js; then echo "::error::$symbol stage config returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol stage config in game.js"
done

check "match result stats host exists" grep -Fq 'id="match-result-stats"' index.html
check "build limit host exists" grep -Fq 'id="build-limit-value"' index.html

echo "CHECK: no HTML-owned loadout defaults"
test "$(grep -Fo 'data-default=' index.html | wc -l | tr -d ' ')" -eq 0 || { echo '::error::HTML-owned loadout defaults returned'; exit 1; }
echo "PASS: no HTML-owned loadout defaults"

check "menu UI reads loadout config" grep -Fq "from './loadout-config.js?v=695';" src/menu-ui.js
check "menu UI uses BUILD_LIMIT" grep -Fq 'BUILD_LIMIT' src/menu-ui.js
check "menu UI uses LOADOUT_OPTIONS" grep -Fq 'LOADOUT_OPTIONS' src/menu-ui.js
check "menu UI uses DEFAULT_LOADOUTS" grep -Fq 'DEFAULT_LOADOUTS' src/menu-ui.js
check "loadout options are exported" grep -Fq 'export const LOADOUT_OPTIONS=' src/loadout-config.js
check "default loadouts are exported" grep -Fq 'export const DEFAULT_LOADOUTS=' src/loadout-config.js

echo "CHECK: no hard-coded build limit in HTML"
if grep -Fq 'BUILD LIMIT <strong>10</strong>' index.html; then echo '::error::hard-coded build limit returned'; exit 1; fi
echo "PASS: no hard-coded build limit in HTML"

echo "CHECK: no duplicated loadout options in HTML"
if grep -Fq '<option ' index.html; then echo '::error::duplicated loadout options returned to HTML'; exit 1; fi
echo "PASS: no duplicated loadout options in HTML"

echo "CHECK: no retired result card implementation"
if grep -Fq 'match-result-card' src/match-ui.js || grep -Fq '.match-result-card' style.css; then echo '::error::retired result card implementation returned'; exit 1; fi
echo "PASS: no retired result card implementation"

for symbol in hitWall showBanner renderMatchResult hideMatchResult; do
  echo "CHECK: no local $symbol in game.js"
  if grep -Fq "function $symbol" src/game.js; then echo "::error::$symbol returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol in game.js"
done

for symbol in CHARACTERS BODY_SOURCE BODY_META WEAPON_SOURCE COLOR_VALUES BUILD_LIMIT PASSIVES BUILD_COSTS; do
  echo "CHECK: no local $symbol config in game.js"
  if grep -Eq "^(const|let|var) ${symbol}([ =]|$)" src/game.js; then echo "::error::$symbol config returned to game.js"; exit 1; fi
  echo "PASS: no local $symbol config in game.js"
done

echo "All runtime checks passed."
