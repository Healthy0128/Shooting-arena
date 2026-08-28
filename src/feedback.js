import { getGameSettings } from './game-settings.js?v=6390';

export const IMPACT_FEEDBACK=Object.freeze({
  light:Object.freeze({rank:0,hitStop:0,shake:.35,shakeMs:45,vibration:0,flash:.07}),
  normal:Object.freeze({rank:1,hitStop:.022,shake:1.15,shakeMs:70,vibration:10,flash:.11}),
  heavy:Object.freeze({rank:2,hitStop:.055,shake:3.1,shakeMs:105,vibration:[18,10,28],flash:.16}),
  ko:Object.freeze({rank:3,hitStop:.08,shake:4.4,shakeMs:125,vibration:[28,14,42],flash:.2})
});

const STYLE_TIERS=Object.freeze({
  rapid:'light',rifle:'normal',arcane:'normal',boomerang:'normal',seeker:'normal',
  scatter:'heavy',cannon:'heavy',sniper:'heavy',katana:'heavy',shock:'heavy',rail:'heavy'
});

export function vibrate(pattern){
  if(!getGameSettings().vibration||!navigator.vibrate)return false;
  return navigator.vibrate(pattern);
}

export function impactTier({damage=0,style='rifle',bounces=0,lethal=false}={}){
  if(lethal)return 'ko';
  if(style==='bladegun')return bounces>=2||damage>=30?'heavy':'normal';
  if(STYLE_TIERS[style])return STYLE_TIERS[style];
  if(damage>=32)return 'heavy';
  if(damage<=10)return 'light';
  return 'normal';
}

function ensureKOFlash(){
  let flash=document.querySelector('#ko-impact-flash');
  if(flash)return flash;
  flash=document.createElement('div');
  flash.id='ko-impact-flash';
  flash.className='ko-impact-flash';
  document.body.appendChild(flash);
  return flash;
}

function showHitConfirm({x,y,player=0,tier='normal'}){
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  const marker=document.createElement('div');
  marker.className=`hit-confirm ${tier}`;
  marker.textContent='×';
  marker.setAttribute('aria-hidden','true');
  marker.style.left=`${x}px`;
  marker.style.top=`${y}px`;
  if(player===1)marker.style.setProperty('--hit-rotation','180deg');
  document.body.appendChild(marker);
  requestAnimationFrame(()=>marker.classList.add('show'));
  setTimeout(()=>marker.remove(),220);
}

export function createFeedbackController({cameraShake,addHitStop,slowMotion,playImpactSfx,playKOSfx,duckBGM}){
  let lastImpactAt=0;
  let lastImpactRank=-1;
  let flashToken=0;

  function shake(strength,duration){
    if(!getGameSettings().screenShake)return;
    cameraShake(strength,duration);
  }

  function impact(event={}){
    const tier=impactTier(event);
    const profile=IMPACT_FEEDBACK[tier];
    addHitStop?.(profile.hitStop);
    shake(profile.shake,profile.shakeMs);

    const now=performance.now();
    if(now-lastImpactAt>42||profile.rank>lastImpactRank){
      playImpactSfx?.(tier==='ko'?'heavy':tier);
      if(profile.vibration)vibrate(profile.vibration);
      lastImpactAt=now;
      lastImpactRank=profile.rank;
    }
    return {tier,...profile};
  }

  function ko({final=false,color='#ffffff'}={}){
    addHitStop?.(final?.15:.12);
    slowMotion?.(final?360:250,final?.22:.30);
    shake(final?7:5.5,final?220:170);
    duckBGM?.(final?.14:.28,final?420:280);
    playKOSfx?.(final);
    vibrate(final?[55,28,95]:[45,24,72]);

    const flash=ensureKOFlash();
    const token=++flashToken;
    flash.style.setProperty('--ko-color',color);
    flash.classList.toggle('final',final);
    flash.classList.remove('show');
    requestAnimationFrame(()=>flash.classList.add('show'));
    setTimeout(()=>{
      if(token===flashToken)flash.classList.remove('show','final');
    },final?430:300);
  }

  return {vibrate,shake,impact,ko,hitConfirm:showHitConfirm};
}
