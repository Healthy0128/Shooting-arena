import { getGameSettings, subscribeGameSettings } from './game-settings.js?v=6390';

export const QUALITY_PROFILES=Object.freeze({
  standard:Object.freeze({key:'standard',pixelRatioCap:1.5,particleScale:1,maxParticles:220}),
  reduced:Object.freeze({key:'reduced',pixelRatioCap:1.2,particleScale:.76,maxParticles:160}),
  low:Object.freeze({key:'low',pixelRatioCap:1,particleScale:.56,maxParticles:100})
});

const AUTO_LEVELS=['low','reduced','standard'];

export function qualityProfileFor(mode='auto',autoLevel='standard'){
  if(mode==='low')return QUALITY_PROFILES.low;
  if(mode==='standard')return QUALITY_PROFILES.standard;
  return QUALITY_PROFILES[autoLevel]||QUALITY_PROFILES.standard;
}

export function shiftedAutoLevel(level,direction){
  const index=Math.max(0,AUTO_LEVELS.indexOf(level));
  return AUTO_LEVELS[Math.max(0,Math.min(AUTO_LEVELS.length-1,index+Math.sign(direction)))];
}

export function createQualityController({renderer,getDevicePixelRatio=()=>globalThis.devicePixelRatio||1}){
  let autoLevel='standard';
  let profile=qualityProfileFor(getGameSettings().graphicsQuality,autoLevel);
  let sampleStarted=0;
  let sampledFrames=0;
  let lowStreak=0;
  let highStreak=0;
  let contextOverlay=null;

  function apply(next=qualityProfileFor(getGameSettings().graphicsQuality,autoLevel)){
    profile=next;
    renderer.setPixelRatio(Math.min(getDevicePixelRatio(),profile.pixelRatioCap));
    document.body.dataset.quality=profile.key;
    return profile;
  }

  function resetSample(now=0){
    sampleStarted=now;
    sampledFrames=0;
  }

  function sampleFrame(now,active=true){
    if(!active||document.hidden){resetSample(now);return profile}
    if(!sampleStarted)sampleStarted=now;
    sampledFrames++;
    const elapsed=now-sampleStarted;
    if(elapsed<1000)return profile;
    const fps=sampledFrames*1000/Math.max(1,elapsed);
    resetSample(now);
    if(getGameSettings().graphicsQuality!=='auto')return profile;

    if(fps<42){lowStreak++;highStreak=0}
    else if(fps>56){highStreak++;lowStreak=0}
    else{lowStreak=0;highStreak=0}

    if(lowStreak>=2){
      const next=shiftedAutoLevel(autoLevel,-1);
      lowStreak=0;
      if(next!==autoLevel){autoLevel=next;apply()}
    }else if(highStreak>=6){
      const next=shiftedAutoLevel(autoLevel,1);
      highStreak=0;
      if(next!==autoLevel){autoLevel=next;apply()}
    }
    return profile;
  }

  function ensureContextOverlay(){
    if(contextOverlay)return contextOverlay;
    contextOverlay=document.createElement('section');
    contextOverlay.className='render-recovery overlay';
    contextOverlay.hidden=true;
    contextOverlay.innerHTML='<div class="panel"><div class="eyebrow">DISPLAY RECOVERY</div><h1>描画を復旧しています</h1><p>画面が戻らない場合は、ゲームを再読み込みしてください。</p><button type="button">再読み込み</button></div>';
    contextOverlay.querySelector('button').addEventListener('click',()=>location.reload());
    document.body.appendChild(contextOverlay);
    return contextOverlay;
  }

  function onContextLost(event){
    event.preventDefault();
    ensureContextOverlay().hidden=false;
  }

  function onContextRestored(){
    if(contextOverlay)contextOverlay.hidden=true;
    apply();
  }

  const canvas=renderer.domElement;
  canvas?.addEventListener('webglcontextlost',onContextLost,false);
  canvas?.addEventListener('webglcontextrestored',onContextRestored,false);
  const unsubscribe=subscribeGameSettings(()=>{
    lowStreak=0;
    highStreak=0;
    apply();
  });
  apply();

  return {
    sampleFrame,
    getProfile:()=>profile,
    destroy(){
      unsubscribe();
      canvas?.removeEventListener('webglcontextlost',onContextLost,false);
      canvas?.removeEventListener('webglcontextrestored',onContextRestored,false);
      contextOverlay?.remove();
    }
  };
}
