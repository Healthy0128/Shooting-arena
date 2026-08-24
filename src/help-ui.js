const HELP_PAGES=['controls','gauges','field','supers'];

export function initHelpUI(){
  const trigger=document.querySelector('#open-help');
  if(!trigger)return;

  const overlay=document.createElement('section');
  overlay.id='help-guide';
  overlay.className='help-overlay';
  overlay.hidden=true;
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-labelledby','help-title');
  overlay.innerHTML=`
    <div class="help-panel">
      <header class="help-head">
        <div><small>HOW TO PLAY</small><h1 id="help-title">遊び方</h1></div>
        <button class="help-close" type="button" aria-label="遊び方を閉じる">×</button>
      </header>
      <nav class="help-tabs" role="tablist" aria-label="説明ページ">
        <button type="button" role="tab" data-help-page="controls">基本操作</button>
        <button type="button" role="tab" data-help-page="gauges">画面とゲージ</button>
        <button type="button" role="tab" data-help-page="field">フィールド武器</button>
        <button type="button" role="tab" data-help-page="supers">必殺技</button>
      </nav>
      <div class="help-pages">
        <article class="help-page controls-page" data-help-content="controls">
          <div class="help-shot-layout">
            <figure class="help-shot-frame">
              <img src="./assets/tutorial/battle-3d.jpeg" alt="3D分割対戦画面。番号で操作場所を示しています">
              <i class="help-pin pin-1">1</i><i class="help-pin pin-2">2</i><i class="help-pin pin-3">3</i>
              <i class="help-pin pin-4">4</i><i class="help-pin pin-5">5</i><i class="help-pin pin-6">6</i>
            </figure>
            <ol class="help-legend">
              <li><b>1　P2ステータス</b><span>上側のプレイヤーは画面を反対向きに見ます。</span></li>
              <li><b>2　移動ぷにコン</b><span>画面をスワイプすると、触れた位置に移動スティックが現れます。</span></li>
              <li><b>3　中央タイマー</b><span>先に3ポイント取るか、時間終了時に優勢なら勝利です。</span></li>
              <li><b>4　P1移動</b><span>下側もスワイプで移動。指を離すとスティックが消えます。</span></li>
              <li><b>5　防御・必殺</b><span>青が防御、紫が必殺。必殺はゲージ100で発動できます。</span></li>
              <li><b>6　P1ステータス</b><span>HP、必殺ゲージ、取得ポイントを確認できます。</span></li>
            </ol>
          </div>
          <p class="help-tip">タッチ操作は「スワイプで移動＋タップした地点へ射撃」です。動かさず押し続けると、その地点を狙って連射します。</p>
        </article>

        <article class="help-page" data-help-content="gauges" hidden>
          <div class="help-card-grid gauge-grid">
            <section><em class="guide-color hp-color"></em><h2>HP</h2><p>0になるとK.O.。先に3回K.O.したプレイヤーが勝利します。</p></section>
            <section><em class="guide-color heat-color"></em><h2>HEAT</h2><p>撃つほど増加。100でオーバーヒートし、35まで冷えると再射撃できます。</p></section>
            <section><em class="guide-color super-color"></em><h2>SUPER</h2><p>攻撃を当てる・受けると増加。100になったら紫の必殺ボタンが光ります。</p></section>
            <section><em class="guide-color defense-color"></em><h2>防御状態</h2><p>ガード耐久、バリア残量、パリィ回数、再使用までの時間を頭上に表示します。</p></section>
            <section><em class="guide-color core-color"></em><h2>パワーコア</h2><p>中央に出る黄色いコアを取ると、一時的に攻撃強化と必殺ゲージ25を得ます。</p></section>
            <section><em class="guide-color timer-color"></em><h2>タイマー</h2><p>同点ならサドンデス。次のK.O.を取ったプレイヤーの勝利です。</p></section>
          </div>
          <p class="help-tip">キャラ頭上の小さいゲージなら、相手から目を離さずHP・HEAT・防御状態を確認できます。</p>
        </article>

        <article class="help-page" data-help-content="field" hidden>
          <div class="field-guide-head"><div class="pickup-demo"><i></i><b>歩いて取得</b></div><p>対戦開始から約8秒後、ステージへ一時武器が出現します。弾を使い切ると元の武器へ自動復帰します。</p></div>
          <div class="help-card-grid field-grid">
            <section class="seeker-card"><h2>誘導ランチャー</h2><strong>5発</strong><p>相手を追う弾。回避を強制し、逃げ続ける相手へ圧力をかけます。</p><small>弱点：単発火力は控えめ</small></section>
            <section class="shock-card"><h2>全周ショック</h2><strong>2発</strong><p>自分の周囲へ16発。接近されたときの切り返しやエリア確保向けです。</p><small>弱点：遠距離では当たりにくい</small></section>
            <section class="rail-card"><h2>レールキャノン</h2><strong>3発</strong><p>高速・高威力の直線弾。相手の移動先を読めば試合を一気に動かせます。</p><small>弱点：外すと弾数を大きく失う</small></section>
          </div>
          <p class="help-tip">7秒間ダメージが発生しないと、次のフィールド武器の出現タイマーが2.5倍速になります。</p>
        </article>

        <article class="help-page" data-help-content="supers" hidden>
          <div class="help-card-grid super-guide-grid">
            <section><h2>オーバードライブ</h2><b>集中攻撃</b><p>元の武器特性を継承。基礎総火力は約170で統一。</p><small>弱点：射線から外れると空振り</small></section>
            <section><h2>リパルスリング</h2><b>迎撃</b><p>敵弾を消し、近距離の相手を吹き飛ばします。</p><small>弱点：遠距離には届かない</small></section>
            <section><h2>ファントムダッシュ</h2><b>無敵移動</b><p>0.65秒無敵で高速突進。離脱や場所取りに特化。</p><small>弱点：直接ダメージなし</small></section>
            <section><h2>サンクチュアリ</h2><b>陣地維持</b><p>4秒間の回復・制圧領域を設置します。</p><small>弱点：回復には領域内に留まる</small></section>
            <section><h2>ブレードウォール</h2><b>進路封鎖</b><p>長く残る低速反射刃9発で移動先を狭めます。</p><small>弱点：即効性が低い</small></section>
            <section><h2>ボーンレイン</h2><b>予告攻撃</b><p>相手の現在位置と周囲へ時間差落下攻撃。</p><small>弱点：予告円を見て回避できる</small></section>
          </div>
          <p class="help-tip">長押しすると、メニューのキャラ・武器・防御・必殺・パッシブの詳しい説明を確認できます。</p>
        </article>
      </div>
      <footer class="help-footer"><button class="help-prev" type="button">← 前へ</button><span class="help-page-count">1 / 4</span><button class="help-next" type="button">次へ →</button></footer>
    </div>`;
  document.body.appendChild(overlay);

  const tabs=[...overlay.querySelectorAll('[data-help-page]')];
  const pages=[...overlay.querySelectorAll('[data-help-content]')];
  const previous=overlay.querySelector('.help-prev');
  const next=overlay.querySelector('.help-next');
  let pageIndex=0;

  function setPage(index){
    pageIndex=(index+HELP_PAGES.length)%HELP_PAGES.length;
    const key=HELP_PAGES[pageIndex];
    tabs.forEach(tab=>{
      const active=tab.dataset.helpPage===key;
      tab.classList.toggle('selected',active);
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
    });
    pages.forEach(page=>{page.hidden=page.dataset.helpContent!==key});
    overlay.querySelector('.help-page-count').textContent=`${pageIndex+1} / ${HELP_PAGES.length}`;
    previous.disabled=pageIndex===0;
    next.textContent=pageIndex===HELP_PAGES.length-1?'閉じる':'次へ →';
  }

  function open(){
    setPage(0);
    overlay.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    overlay.querySelector('.help-close').focus();
  }

  function close(){
    overlay.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    trigger.focus();
  }

  trigger.addEventListener('click',open);
  overlay.querySelector('.help-close').addEventListener('click',close);
  tabs.forEach((tab,index)=>tab.addEventListener('click',()=>setPage(index)));
  previous.addEventListener('click',()=>setPage(pageIndex-1));
  next.addEventListener('click',()=>pageIndex===HELP_PAGES.length-1?close():setPage(pageIndex+1));
  overlay.addEventListener('click',event=>{if(event.target===overlay)close()});
  addEventListener('keydown',event=>{if(event.key==='Escape'&&!overlay.hidden)close()});
  setPage(0);
}
