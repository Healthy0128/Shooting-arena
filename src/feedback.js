import { getGameSettings } from './game-settings.js?v=6160';

export function vibrate(pattern){
  if(!getGameSettings().vibration||!navigator.vibrate)return false;
  return navigator.vibrate(pattern);
}

export function createFeedbackController({cameraShake}){
  function shake(strength,duration){
    if(!getGameSettings().screenShake)return;
    cameraShake(strength,duration);
  }

  return {vibrate,shake};
}
