export function createPauseUI({canPause,onPause,onResume,onRestart,onBackToMenu}){
  const button=document.createElement('button');
  button.id='pause-button';
  button.type='button';
  button.hidden=true;
  button.setAttribute('aria-label','ポーズ');
  button.textContent='Ⅱ';

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
      <div class="pause-actions">
        <button id="pause-resume" class="primary" type="button">対戦に戻る</button>
        <button id="pause-restart" type="button">最初からやり直す</button>
        <button id="pause-back-menu" type="button">設定メニューへ戻る</button>
      </div>
    </div>`;

  document.body.append(button,overlay);

  function show(){
    overlay.hidden=false;
    button.hidden=true;
    document.body.classList.add('game-paused');
    overlay.querySelector('#pause-resume')?.focus();
  }

  function hide(){
    overlay.hidden=true;
    document.body.classList.remove('game-paused');
  }

  function setAvailable(available){
    button.hidden=!available||!overlay.hidden;
  }

  button.addEventListener('click',()=>{
    if(canPause()&&onPause()!==false)show();
  });
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
