import { getGameSettings, updateGameSettings } from './game-settings.js?v=6390';

export function createPauseUI({canPause,onPause,onResume,onRestart,onBackToMenu}){
  const buttons=[0,1].map(player=>{
    const button=document.createElement('button');
    button.id=`pause-button-p${player+1}`;
    button.className=`pause-button p${player+1}`;
    button.type='button';
    button.hidden=true;
    button.setAttribute('aria-label',`プレイヤー${player+1} ポーズ`);
    button.textContent='Ⅱ';
    return button;
  });

  const overlay=document.createElement('section');
  overlay.id='pause-menu';
  overlay.className='overlay pause-overlay';
  overlay.hidden=true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-labelledby','pause-title');
  overlay.innerHTML=`
    <div class="panel pause-panel">
      <div class="eyebrow">BATTLE PAUSED</div>
      <h1 id="pause-title">ポーズ</h1>
      <p>対戦時間・弾・演出タイマーを停止しています。</p>
      <div class="pause-settings" aria-label="サウンド・振動・画質の設定">
        <label class="volume-setting"><span>BGM音量 <output id="bgm-volume-value">100%</output></span><input id="bgm-volume" type="range" min="0" max="100" step="5"></label>
        <label class="volume-setting"><span>SE音量 <output id="se-volume-value">100%</output></span><input id="se-volume" type="range" min="0" max="100" step="5"></label>
        <label class="toggle-setting"><span>振動</span><input id="vibration-setting" type="checkbox"><i aria-hidden="true"></i></label>
        <label class="toggle-setting"><span>画面振動</span><input id="screen-shake-setting" type="checkbox"><i aria-hidden="true"></i></label>
        <label class="quality-setting"><span>画質</span><select id="graphics-quality"><option value="auto">自動</option><option value="standard">標準</option><option value="low">軽量</option></select></label>
      </div>
      <div class="pause-actions">
        <button id="pause-resume" class="primary" type="button">対戦に戻る</button>
        <button id="pause-restart" type="button">最初からやり直す</button>
        <button id="pause-back-menu" type="button">設定メニューへ戻る</button>
      </div>
    </div>`;

  document.body.append(...buttons,overlay);

  const bgmInput=overlay.querySelector('#bgm-volume');
  const seInput=overlay.querySelector('#se-volume');
  const vibrationInput=overlay.querySelector('#vibration-setting');
  const screenShakeInput=overlay.querySelector('#screen-shake-setting');
  const graphicsQualityInput=overlay.querySelector('#graphics-quality');

  function syncSettings(){
    const settings=getGameSettings();
    const bgm=Math.round(settings.bgmVolume*100),se=Math.round(settings.seVolume*100);
    bgmInput.value=String(bgm);
    seInput.value=String(se);
    overlay.querySelector('#bgm-volume-value').value=`${bgm}%`;
    overlay.querySelector('#se-volume-value').value=`${se}%`;
    vibrationInput.checked=settings.vibration;
    screenShakeInput.checked=settings.screenShake;
    graphicsQualityInput.value=settings.graphicsQuality;
  }

  function show(){
    syncSettings();
    overlay.hidden=false;
    buttons.forEach(button=>{button.hidden=true});
    document.body.classList.add('game-paused');
    overlay.querySelector('#pause-resume')?.focus();
  }

  function hide(){
    overlay.hidden=true;
    document.body.classList.remove('game-paused');
  }

  function setAvailable(available){
    buttons.forEach(button=>{button.hidden=!available||!overlay.hidden});
  }

  buttons.forEach(button=>button.addEventListener('click',()=>{
    if(canPause()&&onPause()!==false)show();
  }));
  bgmInput.addEventListener('input',()=>{
    const value=Number(bgmInput.value);
    overlay.querySelector('#bgm-volume-value').value=`${value}%`;
    updateGameSettings({bgmVolume:value/100});
  });
  seInput.addEventListener('input',()=>{
    const value=Number(seInput.value);
    overlay.querySelector('#se-volume-value').value=`${value}%`;
    updateGameSettings({seVolume:value/100});
  });
  vibrationInput.addEventListener('change',()=>updateGameSettings({vibration:vibrationInput.checked}));
  screenShakeInput.addEventListener('change',()=>updateGameSettings({screenShake:screenShakeInput.checked}));
  graphicsQualityInput.addEventListener('change',()=>updateGameSettings({graphicsQuality:graphicsQualityInput.value}));
  overlay.querySelector('#pause-resume').addEventListener('click',()=>onResume());
  overlay.querySelector('#pause-restart').addEventListener('click',()=>onRestart());
  overlay.querySelector('#pause-back-menu').addEventListener('click',()=>onBackToMenu());
  addEventListener('keydown',event=>{
    if(event.key!=='Escape')return;
    if(!overlay.hidden){event.preventDefault();onResume();return}
    if(canPause()){event.preventDefault();if(onPause()!==false)show()}
  });

  return {show,hide,setAvailable,isOpen:()=>!overlay.hidden};
}
