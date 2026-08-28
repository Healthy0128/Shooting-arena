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
  src/menu-ui.js src/match-ui.js src/loadout-config.js src/audio.js src/projectile-visuals.js \
  src/pause-ui.js src/match-scheduler.js src/weapon-effects.js src/game-settings.js src/feedback.js \
  src/field-weapons.js src/help-ui.js src/floating-stick.js src/match-rules.js src/hit-detection.js \
  src/quality-controller.js src/particle-system.js; do
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
check "weapon effects controller exported" grep -Fq 'export function createWeaponEffectsController' src/weapon-effects.js
check "boomerang remembers horizontal input" grep -Fq 'player.lastMoveSide' src/combat.js
check "boomerang turns sharply after delay" grep -Fq 'bullet.curveComplete=true;' src/combat.js
check "katana slash effects are pooled" grep -Fq 'const slashEffects=new Map();' src/weapon-effects.js
check "pause UI controller exported" grep -Fq 'export function createPauseUI' src/pause-ui.js
check "match scheduler exported" grep -Fq 'export function createMatchScheduler' src/match-scheduler.js
check "match rules controller exported" grep -Fq 'export function createMatchRulesController' src/match-rules.js
check "match rule behavior" node scripts/match-rules-check.mjs
check "swept hit and aim assist behavior" node scripts/hit-detection-check.mjs
check "game settings exported" grep -Fq 'export function updateGameSettings' src/game-settings.js
check "quality controller exported" grep -Fq 'export function createQualityController' src/quality-controller.js
check "quality controller behavior" node scripts/quality-controller-check.mjs
check "quality reacts to WebGL context loss" grep -Fq "addEventListener('webglcontextlost'" src/quality-controller.js
check "graphics quality persists through settings" grep -Fq "graphicsQuality:'auto'" src/game-settings.js
check "pause UI exposes graphics quality" grep -Fq 'id="graphics-quality"' src/pause-ui.js
check "renderer quality is delegated" grep -Fq 'createQualityController({renderer})' src/game.js
check "particle system exported" grep -Fq 'export function createParticleSystem' src/particle-system.js
check "particle geometry is shared" grep -Fq 'const geometry=new THREE.SphereGeometry(1,6,6);' src/particle-system.js
check "particle meshes are pooled" grep -Fq 'if(available.length)return available.pop();' src/particle-system.js
check "particle count follows quality cap" grep -Fq 'quality.maxParticles-particles.length' src/particle-system.js
check "particle burst is delegated" grep -Fq 'particleSystem.burst(pos,color,count,scale);' src/game.js
check "particle updates are delegated" grep -Fq 'particleSystem.update(dt);' src/game.js
check "automatic background pause remains centralized" grep -Fq 'if(document.hidden&&pauseBattle())pauseUI.show();' src/game.js
check "feedback controller exported" grep -Fq 'export function createFeedbackController' src/feedback.js
check "impact tiers centralized" grep -Fq 'export const IMPACT_FEEDBACK=' src/feedback.js
check "impact tier behavior" node --input-type=module -e "const {impactTier:t}=await import('./src/feedback.js');if(t({style:'rapid',damage:7})!=='light'||t({style:'rifle',damage:19})!=='normal'||t({style:'scatter',damage:11})!=='heavy'||t({style:'bladegun',damage:25,bounces:2})!=='heavy'||t({style:'rifle',damage:19,lethal:true})!=='ko')process.exit(1)"
check "combat delegates impact feedback" grep -Fq 'const feedback=impactFeedback?.({' src/combat.js
check "projectiles use swept collision" grep -Fq 'const hit=segmentCircleHit(' src/combat.js
check "hitbox receives restrained forgiveness" grep -Fq 'player.radius*1.1+bullet.radius' src/combat.js
check "aim assist capped by weapon" grep -Fq "weapon.weaponStyle==='sniper'?3.5:5" src/combat.js
check "weapon faces final shot direction before muzzle lookup" grep -Fq 'player.root.rotation.y=Math.atan2(base.x,base.z)+Math.PI;' src/combat.js
check "shot denominator counts projectiles" grep -Fq 'player.stats.shots++;' src/combat.js
check "accuracy excludes super damage" grep -Fq 'countAccuracy:!bullet.isSuper' src/combat.js
check "result shows fired shots" grep -Fq "statRow('SHOTS'" src/match-ui.js
check "hit confirmation delegated" grep -Fq 'feedbackController.hitConfirm' src/game.js
check "KO feedback delegated" grep -Fq 'feedbackController.ko({' src/game.js
check "KO slow motion supported" grep -Fq 'slowMotionUntil=Math.max' src/game.js
check "impact audio controller" grep -Fq 'function playImpactSfx' src/audio.js
check "KO BGM ducking" grep -Fq 'duckBGM?.(' src/feedback.js
check "field weapon controller exported" grep -Fq 'export function createFieldWeaponController' src/field-weapons.js
check "help UI exported" grep -Fq 'export function initHelpUI' src/help-ui.js
check "floating stick controller exported" grep -Fq 'export function createFloatingStickController' src/floating-stick.js
check "floating stick is delegated through input" grep -Fq 'createFloatingStickController({' src/input.js
check "floating stick logic stays out of game orchestrator" bash -c '! grep -Fq "MOVE_THRESHOLD" src/game.js'
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
check "match presentation phases centralized" grep -Fq "function setMatchPhase(phase)" src/game.js
check "VS intro uses rule and resolved stage" grep -Fq 'showVsIntro(players,matchRules.getState(),ARENA_OPTIONS[activeArenaSelection]' src/game.js
check "entrance effect delegated to player" grep -Fq 'playSpawnEffect(player);' src/game.js
check "presentation keeps scheduler moving" grep -Fq 'matchScheduler.update(dt);' src/game.js
check "gameplay stops after presentation update" grep -Fq 'if(!running){' src/game.js
check "KO locks match phase" grep -Fq "setMatchPhase('ko');" src/game.js
check "KO clears projectiles after collision iteration" grep -Fq 'matchLater(()=>combatController.clearProjectiles(),0);' src/game.js
check "respawn has protected phase" grep -Fq "setMatchPhase('respawn');" src/game.js
check "time finish uses presentation" grep -Fq 'finishByTime(ruleEvent.winner,ruleEvent.state);' src/game.js
check "input controller accepts phase gate" grep -Fq 'isEnabled=()=>true' src/input.js
check "game provides input phase gate" grep -Fq "isEnabled:()=>matchPhase==='battle'&&!paused" src/game.js
check "spawn invulnerability is visible" grep -Fq 'player.invulnerabilityRing.visible=protectedSpawn;' src/player.js
check "victory animation has primitive fallback" grep -Fq "if(name==='victory')player.victoryTime=1.4;" src/player.js
check "result achievements rendered" grep -Fq 'result-award winner' src/match-ui.js
check "BGM request guard" grep -Fq 'realBGMRequestId' src/audio.js
check "menu BGM delegated" grep -Fq 'playMenuBGM();' src/game.js
check "battle BGM delegated" grep -Fq "playBattleBGM(activeArenaSelection==='hex'?'space':'normal');" src/game.js
check "projectile visuals delegated" grep -Fq 'projectileVisuals.update(bullet,dt,performance.now());' src/combat.js
check "shoot animation delegated" grep -Fq "playPlayerAction(player,'shoot');" src/combat.js
check "death animation delegated" grep -Fq "playPlayerAction(player,'death');" src/game.js
check "hit reaction always triggered" grep -Fq "if(name==='hit')" src/player.js
check "hit reaction moves visual rig" grep -Fq 'player.visualRig.position.z=.24*hitImpulse' src/player.js
check "shot recoil animates weapon" grep -Fq 'player.weaponPivot.position.z=.22*shotImpulse' src/player.js
check "projectiles start at muzzle anchor" grep -Fq 'getMuzzlePosition(player,new THREE.Vector3())' src/combat.js
check "weapon impacts delegated" grep -Fq 'weaponEffects.impact(style' src/combat.js
check "directional projectile planes" grep -Fq 'root.add(horizontal,vertical);' src/projectile-visuals.js
check "directional projectile follows velocity" grep -Fq 'Math.atan2(-bullet.vel.z,bullet.vel.x)' src/projectile-visuals.js
check "combat projectile update delegated" grep -Fq 'combatController.updateProjectiles(dt);' src/game.js
check "player visuals delegated" grep -Fq 'playerController.updatePlayerVisuals(player,dt,inBush);' src/game.js
check "arena movement delegated" grep -Fq 'const canMoveTo=arenaController.canMoveTo;' src/game.js
check "camera render delegated" grep -Fq 'cameraController.render();' src/game.js
check "input update delegated" grep -Fq 'input.update();' src/game.js
check "pause UI delegated" grep -Fq 'createPauseUI({' src/game.js
check "pause freezes match scheduler" grep -Fq 'isPaused:()=>paused' src/game.js
check "audio follows BGM setting" grep -Fq 'realBGMBaseVolume*settings.bgmVolume' src/audio.js
check "synth BGM uses BGM channel" grep -Fq "0,'bgm'" src/audio.js
check "feedback setting gates vibration" grep -Fq '!getGameSettings().vibration' src/feedback.js
check "feedback setting gates screen shake" grep -Fq '!getGameSettings().screenShake' src/feedback.js
check "combat vibration delegated" grep -Fq 'vibrate(weapon.vibration??' src/combat.js
check "legacy uniform hit feedback removed" bash -c '! grep -Fq "tone(85,.07" src/combat.js'
check "pause settings persist through controller" grep -Fq 'updateGameSettings({bgmVolume:value/100})' src/pause-ui.js
check "two pause buttons are created" grep -Fq 'const buttons=[0,1].map' src/pause-ui.js
check "split HUD uses camera projection" grep -Fq 'projectWorldToScreen(p.i,q)' src/hud-ui.js
check "HUD no longer hidden in split mode" bash -c '! grep -Fq "classList.contains(\x27split-arena\x27)" src/hud-ui.js'
check "field weapons updated by orchestrator" grep -Fq 'fieldWeaponController.update(dt);' src/game.js
check "field weapon ammo consumed by combat" grep -Fq 'consumeFieldWeapon?.(player);' src/combat.js
check "field weapon radial pattern exists" grep -Fq "weapon.pattern==='radial'" src/combat.js
check "field weapon homing exists" grep -Fq 'if(bullet.homing)' src/combat.js
check "field projectiles have unique styles" grep -Fq "seeker:{color:" src/projectile-visuals.js
check "stalemate accelerates pickup" grep -Fq 'quietTime>=7?2.5:1' src/field-weapons.js
check "field weapon is shown over player" grep -Fq 'class="world-field-weapon"' src/hud-ui.js
check "field direction rotates on the stage plane" grep -Fq 'indicator.group.rotation.y=Math.atan2(dx,dz)' src/field-weapons.js
check "field direction stretches toward the pickup" grep -Fq 'indicator.ring.position.z=(stretch-1)*.54' src/field-weapons.js
check "world status avoids ability buttons" grep -Fq 'keepWorldStatusClearOfButtons(el,p.i,screen.y)' src/hud-ui.js
check "world status panel is translucent" grep -Fq 'background:#07101c73' style.css
check "tutorial opens from initial menu" grep -Fq 'id="open-help"' index.html
check "tutorial screenshot has annotations" grep -Fq 'help-pin pin-6' src/help-ui.js
check "tutorial has four focused pages" grep -Fq "const HELP_PAGES=['controls','gauges','field','supers'];" src/help-ui.js
check "tutorial logic stays out of game orchestrator" bash -c '! grep -Fq "initHelpUI" src/game.js'
check "tutorial screenshot frame follows image ratio" grep -Fq '.help-shot-frame{width:100%;height:auto;aspect-ratio:707/1436' help-ui.css
check "overdrive weapon profiles are centralized" grep -Fq 'export const OVERDRIVE_PROFILES=' src/loadout-config.js
check "overdrive ignores temporary field weapon" grep -Fq 'OVERDRIVE_PROFILES[player.cfg.weaponStyle]' src/combat.js
check "overdrive cannon total is normalized" grep -Fq "cannon:{bursts:2,pellets:1,interval:260,damage:85" src/loadout-config.js
check "all overdrive totals are approximately 170" node --input-type=module -e "const {OVERDRIVE_PROFILES:p}=await import('./src/loadout-config.js');for(const v of Object.values(p)){if(Math.abs(v.bursts*v.pellets*v.damage-170)>.1)process.exit(1)}"
check "repulse ring clears hostile bullets" grep -Fq 'if(bullet.owner===i||bullet.mesh.position.distanceTo(player.root.position)>radius)continue;' src/combat.js
check "sanctuary is a persistent field" grep -Fq "type:'novaField'" src/combat.js
check "blade wall ricochets" grep -Fq "2.8,{ricochetMax:2}" src/combat.js
check "bone rain uses telegraphed strikes" grep -Fq 'queueBoneStrike(i,position,.48+k*.12);' src/combat.js
check "super projectiles are tagged" grep -Fq 'isSuper:true' src/combat.js
check "super damage cannot refund attacker meter" grep -Fq 'grantAttackerSuper:!bullet.isSuper' src/combat.js

if grep -Fq 'player.cfg.damage*.78' src/combat.js; then
  echo '::error::overdrive raw damage still depends on base weapon damage'
  exit 1
fi
echo 'PASS: overdrive raw damage is normalized'

if grep -Fq 'navigator.vibrate' src/game.js src/combat.js src/menu-ui.js; then
  echo '::error::direct vibration bypasses feedback settings'
  exit 1
fi
echo 'PASS: vibration is centralized'

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
check "match rules stay out of game orchestrator" bash -c '! grep -Fq "players[attacker].score++" src/game.js'
check "match score state is centralized" bash -c '! grep -Fq "score:0" src/player.js'
check "KO rule selector exists" grep -Fq 'data-rule="ko"' index.html
check "stock rule selector exists" grep -Fq 'data-rule="stock"' index.html
check "random stage resolver exported" grep -Fq 'export function resolveArenaSelection' src/arena-config.js
check "random stage resolver behavior" node --input-type=module -e "const m=await import('./src/arena-config.js');if(m.resolveArenaSelection('random',()=>0)!=='square'||m.resolveArenaSelection('random',()=>.999)!=='crates'||m.resolveArenaSelection('hex')!=='hex'||m.resolveArenaSelection('missing')!=='square')process.exit(1)"
check "random stage selector rendered" grep -Fq "randomArenaButton.dataset.arena='random'" src/menu-ui.js
check "random stage resolved before arena build" grep -Fq 'activeArenaSelection=resolveArenaSelection(arenaSelection);' src/game.js
check "menu respects top safe area" grep -Fq 'padding-top:max(54px,var(--ui-safe-top),env(safe-area-inset-top,0px))' menu-stats.css
for impact_file in \
  impactGeneric_light_000.ogg impactGeneric_light_002.ogg \
  impactPunch_medium_000.ogg impactPunch_medium_003.ogg \
  impactPunch_heavy_001.ogg impactPunch_heavy_003.ogg impactBell_heavy_001.ogg; do
  check "impact asset $impact_file" test -s "assets/audio/sfx/$impact_file"
done
check "impact asset license documented" grep -Fq 'Kenney Impact Sounds' THIRD_PARTY_ASSETS.md

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
