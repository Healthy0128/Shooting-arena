const STORAGE_KEY='duelArena.settings.v1';
const DEFAULTS={
  bgmVolume:1,
  seVolume:1,
  vibration:true,
  screenShake:true,
  graphicsQuality:'auto'
};

function clampVolume(value,fallback){
  const number=Number(value);
  return Number.isFinite(number)?Math.max(0,Math.min(1,number)):fallback;
}

function normalize(value={}){
  const graphicsQuality=['auto','standard','low'].includes(value.graphicsQuality)
    ?value.graphicsQuality
    :DEFAULTS.graphicsQuality;
  return {
    bgmVolume:clampVolume(value.bgmVolume,DEFAULTS.bgmVolume),
    seVolume:clampVolume(value.seVolume,DEFAULTS.seVolume),
    vibration:typeof value.vibration==='boolean'?value.vibration:DEFAULTS.vibration,
    screenShake:typeof value.screenShake==='boolean'?value.screenShake:DEFAULTS.screenShake,
    graphicsQuality
  };
}

function load(){
  try{
    const raw=globalThis.localStorage?.getItem(STORAGE_KEY);
    return raw?normalize(JSON.parse(raw)):normalize();
  }catch{
    return normalize();
  }
}

let settings=load();
const listeners=new Set();

export function getGameSettings(){
  return {...settings};
}

export function updateGameSettings(patch){
  settings=normalize({...settings,...patch});
  try{globalThis.localStorage?.setItem(STORAGE_KEY,JSON.stringify(settings))}catch{}
  listeners.forEach(listener=>listener(getGameSettings()));
  return getGameSettings();
}

export function subscribeGameSettings(listener){
  listeners.add(listener);
  return ()=>listeners.delete(listener);
}
