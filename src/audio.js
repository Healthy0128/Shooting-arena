import { getGameSettings, subscribeGameSettings } from './game-settings.js?v=6160';

const BGM_FILES={
  menu:'./assets/audio/bgm/00_menu_pulse.ogg',
  normal:'./assets/audio/bgm/01_empacotatron_loop.ogg',
  sudden:'./assets/audio/bgm/02_trance_boss_battle.ogg',
  space:'./assets/audio/bgm/03_space_boss_battle.ogg'
};

const COUNTDOWN_BASE='./assets/audio/voice/';
const BATTLE_NOTES=[110,138.59,164.81,138.59,123.47,155.56,185,155.56];
const MENU_NOTES=[220,277.18,329.63,415.3,329.63,277.18,246.94,329.63];

export function createAudioController(){
  let audioCtx=null;
  let realBGM=null;
  let realBGMMode=null;
  let realBGMRequestId=0;
  let synthTimer=null;
  let synthMode=null;
  let synthStep=0;
  let desiredMode='menu';
  let bgmPaused=false;
  let realBGMBaseVolume=0;

  function unlock(){
    try{
      if(!audioCtx)audioCtx=new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtx.state==='suspended')audioCtx.resume();
    }catch{}
  }

  function tone(freq,dur=.06,type='square',gain=.025,slide=0,channel='se'){
    try{
      const gainScale=channel==='bgm'?getGameSettings().bgmVolume:getGameSettings().seVolume;
      if(gainScale<=0)return;
      unlock();
      const c=audioCtx;
      if(!c)return;
      const oscillator=c.createOscillator();
      const volume=c.createGain();
      oscillator.type=type;
      oscillator.frequency.setValueAtTime(freq,c.currentTime);
      if(slide){
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(40,freq+slide),
          c.currentTime+dur
        );
      }
      volume.gain.setValueAtTime(gain*gainScale,c.currentTime);
      volume.gain.exponentialRampToValueAtTime(.0001,c.currentTime+dur);
      oscillator.connect(volume);
      volume.connect(c.destination);
      oscillator.start();
      oscillator.stop(c.currentTime+dur);
    }catch{}
  }

  function stopSynthBGM(){
    if(synthTimer)clearInterval(synthTimer);
    synthTimer=null;
    synthMode=null;
    synthStep=0;
  }

  function startSynthBGM(mode){
    if(synthMode===mode&&synthTimer)return;
    stopSynthBGM();
    synthMode=mode;
    synthStep=0;
    const menu=mode==='menu';
    const notes=menu?MENU_NOTES:BATTLE_NOTES;
    const interval=menu?520:240;
    synthTimer=setInterval(()=>{
      if(bgmPaused||desiredMode!==mode)return;
      const freq=notes[synthStep++%notes.length];
      tone(freq,menu?.34:.16,menu?'sine':'triangle',menu?.0045:.008,0,'bgm');
      if(synthStep%4===1){
        tone(freq/2,menu?.28:.11,'sine',menu?.0025:.006,0,'bgm');
      }
    },interval);
  }

  function stopRealBGM(){
    realBGMRequestId++;
    if(realBGM){
      realBGM.pause();
      realBGM.currentTime=0;
      realBGM=null;
    }
    realBGMMode=null;
    realBGMBaseVolume=0;
  }

  function playRealTrack(mode,volume){
    desiredMode=mode;
    bgmPaused=false;
    stopSynthBGM();
    if(realBGMMode===mode&&realBGM&&!realBGM.paused)return;
    const src=BGM_FILES[mode]||BGM_FILES.normal;
    const requestId=++realBGMRequestId;
    if(realBGM){
      realBGM.pause();
      realBGM=null;
    }
    const audio=new Audio(src);
    audio.loop=true;
    realBGMBaseVolume=volume;
    audio.volume=volume*getGameSettings().bgmVolume;
    audio.preload='auto';
    const fallback=()=>{
      if(requestId===realBGMRequestId&&desiredMode===mode)startSynthBGM(mode);
    };
    audio.addEventListener('error',fallback,{once:true});
    audio.play().then(()=>{
      if(requestId!==realBGMRequestId||desiredMode!==mode){
        audio.pause();
        audio.currentTime=0;
        return;
      }
      stopSynthBGM();
      audio.volume=volume*getGameSettings().bgmVolume;
      realBGM=audio;
      realBGMMode=mode;
    }).catch(fallback);
  }

  function playBattleBGM(mode='normal'){
    playRealTrack(mode,.28);
  }

  function playMenuBGM(){
    playRealTrack('menu',.16);
  }

  function stopAllBGM(){
    desiredMode=null;
    bgmPaused=false;
    stopSynthBGM();
    stopRealBGM();
  }

  function pauseBGM(){
    bgmPaused=true;
    realBGM?.pause();
  }

  function resumeBGM(){
    if(!bgmPaused)return;
    bgmPaused=false;
    if(realBGM){
      realBGM.play().catch(()=>startSynthBGM(desiredMode||'normal'));
    }else if(desiredMode){
      playRealTrack(desiredMode,desiredMode==='menu'?.16:.28);
    }
  }

  function synthKO(){
    tone(150,.16,'sawtooth',.055,-100);
    setTimeout(()=>tone(72,.22,'square',.04,-20),90);
  }

  function playCountdownVoice(name){
    const audio=new Audio(COUNTDOWN_BASE+name+'.ogg');
    audio.volume=.9*getGameSettings().seVolume;
    audio.play().catch(()=>{
      tone(name==='go'?700:440,.1,'square',.03,name==='go'?200:0);
    });
  }

  function unlockAndRetry(){
    unlock();
    if(desiredMode==='menu'&&!realBGM)playMenuBGM();
  }

  window.addEventListener('pointerdown',unlockAndRetry,{once:true,capture:true});
  window.addEventListener('keydown',unlockAndRetry,{once:true,capture:true});
  subscribeGameSettings(settings=>{
    if(realBGM)realBGM.volume=realBGMBaseVolume*settings.bgmVolume;
  });

  return {unlock,tone,playBattleBGM,playMenuBGM,stopAllBGM,pauseBGM,resumeBGM,synthKO,playCountdownVoice};
}
