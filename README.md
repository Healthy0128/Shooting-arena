# Duel Arena 3D v5

v4にCC0 BGMセットとiPhone向けPWA機能を統合した版。

## BGM

ゲームは以下の順で動作します。

1. `assets/audio/bgm/` に実音源があれば、それを再生
2. 音源が未配置 / 読み込み失敗なら、既存のWeb Audio簡易BGMへ自動フォールバック

割り当て:
- 通常戦: Empacotatron
- サドンデス: Trance Boss Battle
- Hex/SF寄り: Space Boss Battle
- 特別戦用: JRPG Epic Rock Battle Theme #1

音源本体を入れるには:

```bash
python fetch_bgm.py
```

またはGitHub Actionsの `Fetch Game BGM` を実行。

## iPhone / iPad

Safariで公開URLを開き、
「共有」→「ホーム画面に追加」→「Webアプリとして開く」をオン→「追加」。

ホーム画面のDuel Arenaアイコンから起動すると、Safariの通常タブではなくアプリ風のスタンドアロン表示になる。

v5で追加:
- Web App Manifest
- 192 / 512pxアイコン
- Apple Touch Icon
- standalone表示
- landscape指定
- Service Worker
- コアファイルのキャッシュ
- iOS用メタタグ

## 注意

外部CC0キャラクター/武器モデルはランタイムで読み込むため、完全オフライン化にはそれらのローカル同梱も必要。
ゲーム本体のコアUIはService Workerでキャッシュされる。


## v6 local test changes

- 未デプロイ版
- アリーナを 19×12.4 から 29×18 world units に拡張
- P2操作を対面180°基準へ変更（メニューで「画面基準」に切替可能）
- P2スティック表示は指に追従し、ゲーム入力だけ180°回転
- KayKit Prototype Bits 1.1 の実GLTFをステージに使用
  - Wall / Wall Decorated
  - Pillar A/B
  - Ammo Box / Box A/B/C
  - Barrel A/B/C
  - Floor
  - Pallet
- 当たり判定は軽量Box/Circleを維持し、見た目のGLTFと分離
- 8ステージを広いレイアウトへ再設計

## v6.1 projectile collision fix

- 弾対プレイヤー判定を3D距離からXZ平面距離へ修正
- 弾の高さ y=0.82 とプレイヤーroot y=0 の高さ差で命中不能になるバグを修正
- タッチ対戦向けに弾の論理半径を 0.13 → 0.16 に微調整

## v6.2 local camera / controller test

- デプロイしないローカル調整版
- デフォルトカメラを真上Orthographicへ変更
- 画面比率に合わせてアリーナを自動フィット
- 比較用に「3D TILT TEST」も残す
- P2のゲーム入力を180°回転
- P2のコントローラー配置も対面基準へ反転
  - P2 MOVE = 画面右上（P2本人から見て左）
  - P2 AIM = 画面左上（P2本人から見て右）
- P2 SUPER / HUDは180°表示
- スティックのノブは指に追従し、ゲームベクトルのみ180°変換

## v6.3 local visual / hit reaction

- ステージの床・壁・柱・箱・ドラム缶をKayKit Prototype Bits実GLTFへ反映
- 軽量Box/Circle当たり判定はそのまま維持
- 被弾時リアクション追加
  - 白フラッシュ
  - ノックバック
  - 55msヒットストップ
  - ダメージ数値
  - パーティクル
  - 軽いカメラパンチ
  - 対応端末では振動
- 弾対プレイヤー判定はXZ平面のまま
- デプロイなし

## v6.4 local combat prototype

- アリーナを 33 x 21 world units に拡張
- HPを各キャラ頭上に追従表示
- キャラごとの防御アクションを追加
  - RANGER: ROLL
  - CRUSHER: GUARD
  - DASH: STEP
  - MAGE: BARRIER
  - ROGUE: EVADE
  - BONES: PARRY
- BONESパリィ
  - 受付 180ms
  - 成功時 85msヒットストップ
  - 成功時はクールダウン0で連続パリィ可能
  - 弾を反射、速度1.18倍、威力1.12倍
  - 連続成功数 PARRY xN 表示
- ガードは正面のみ大幅軽減、ガードゲージあり
- バリアは耐久値制
- 回避系は無敵時間とクールダウンあり
- デプロイなし

## v0.6.5 local — Custom Loadout

- 固定キャラ選択をCUSTOM LOADOUTへ変更
- BODY / WEAPON / DEFENSE / SUPER / COLORをP1/P2別々に選択可能
- 真上Orthographicカメラをデフォルト化（斜め視点テストも残す）
- アリーナ 33 x 21
- 頭上HPバー
- キャラ別防御：ROLL / GUARD / STEP / BARRIER / EVADE / PARRY
- PARRY成功時は85msヒットストップ、回復時間0、連続パリィ可能、反射強化
- タイトル画面を対戦ゲームのロビー風に刷新
- 開戦時に Kenney Synth Voice の 3 / 2 / 1 / GO を使用
- 音声はCC0。オンライン取得できない場合はシンセ音へフォールバック
- デプロイなし

## v0.6.5.1 local — World Status UI

今回の変更は1つだけです。

- キャラ頭上にHPバーを追従表示
- HPの下にHEATゲージを表示
- 射撃でHEATが増え、時間で冷却
- この版ではHEATはまだ表示だけで、100になっても射撃停止しません
- 次段階でオーバーヒート挙動を実装予定
- デプロイなし

## v0.6.5.2 local — Overheat

今回の変更はオーバーヒートだけです。

- HEAT 100でOVERHEAT
- OVERHEAT中は射撃不可
- HEAT 35まで冷えるとREADYになり射撃復帰
- 発熱・冷却は頭上HEATゲージへ反映
- OVERHEAT中はHEATゲージが点滅
- リスポーン時はHEAT / OVERHEATをリセット
- デプロイなし

## v0.6.5.3 local — Post-shot Recovery

今回の変更は攻撃後硬直だけです。

- 射撃直後に武器ごとの硬直を追加
- 硬直中は再射撃不可
- 硬直中は移動速度58%
- RANGER 0.08s
- CRUSHER 0.34s
- DASH 0.035s
- MAGE 0.18s
- ROGUE 0.07s
- BONES 0.42s
- デプロイなし

## v0.6.5.4 local — Held Autofire

今回の変更は右スティック長押し射撃だけです。

- 右スティックを一定以上倒している間は自動射撃
- スティックを中央へ戻すと停止
- 指を離すと停止
- fireCd / 攻撃後硬直 / OVERHEAT を尊重
- デプロイなし

## v0.6.5.5 local — POWER CORE

今回の変更は中央の取り合い要素だけです。

- 試合開始7秒後、ステージ中央にPOWER CORE出現
- 触れたプレイヤーが取得
- 8秒間、与ダメージ1.18倍
- SUPERゲージ +25
- 取得後12秒で再出現
- POWER中は頭上HPバーが発光
- リスポーン時はPOWER効果リセット
- デプロイなし

## v0.6.5.6 local — POWER CORE Warning

今回の変更は出現予告だけです。

- POWER CORE出現3秒前から中央に予告リング表示
- 出現が近づくほどリングが明るく・大きく脈動
- 残り1秒でオレンジ色へ変化
- 残り1秒で `CORE IN 1!` 表示
- POWER CORE出現時にリング消滅
- デプロイなし

## v0.6.5.7 local — Match Polish & Stability

今回は少しまとめて改善。

- 真のSUDDEN DEATH
  - 90秒終了時に同点なら延長
  - 延長中は次の1KOで即勝利
- POWER CORE取得演出を強化
  - 二段パーティクル
  - 二段SE
  - 60msヒットストップ
  - 振動強化
- KO演出を強化
  - 110msヒットストップ
  - 二段パーティクル
  - SUDDEN DEATH時は FINAL K.O!
- matchGenerationを追加
  - 前の試合のSUPER / KO / リスポーン用タイマーが新しい試合へ残らないように保護
- プレイヤー同士の簡易押し戻しを追加
  - 同じ位置へ完全に重ならない
- デプロイなし

## v0.6.5.8 local — Defensive Actions

今回は防御をまとめて実コードへ統合。

- RANGER: ROLL
  - CD 2.4秒
  - 0.26秒無敵
- CRUSHER: GUARD
  - ON/OFF式
  - 前方からのダメージを22%へ軽減
  - GUARD 100、非ガード時に自然回復
  - ガード中は移動42%、射撃不可
  - 0になるとGUARD BREAK
- DASH: STEP
  - CD 1.7秒
  - 長めの高速移動
  - 0.17秒無敵
- MAGE: BARRIER
  - 55ダメージ吸収
  - CD 6秒
- ROGUE: EVADE
  - CD 3.2秒
  - 0.38秒無敵
- BONES: PARRY
  - 受付0.18秒
  - 成功時85msヒットストップ
  - 弾を反射
  - 反射弾 速度1.18倍 / ダメージ1.12倍
  - 成功後の硬直0で連続パリィ可能
- DEFボタンへ各防御名を表示
- 頭上に防御状態 / CDを表示
- デプロイなし

## v0.6.5.8-debug1 local
デバッグ修正版。新機能追加ではなく、UIと実コードの不整合を修復。
- CUSTOM LOADOUTを実戦設定へ接続
- 3D asset-status参照クラッシュを修正
- TOP-DOWN Orthographicを実装
- ARENA 33x21 / SPAWN 8.3へ統一
- 3,2,1,GOカウントダウンを実コードへ復旧

## v0.6.5.9 local — Combat Feedback

- GUARD: 前方シールド表示
- BARRIER: 球状ワイヤーフレーム表示
- PARRY: 足元リング表示
- ROLL / STEP / EVADE: 残像リング
- 被弾フラッシュ
- ダメージ量に応じたノックバック
- GUARD BREAK / PARRY演出強化
- デプロイなし

## v0.6.6.0 local — Weapon Identity
- RIFLE: 青い長射程標準弾
- SCATTER: オレンジ散弾・短射程・強反動
- RAPID: 緑の小型高速弾・低反動
- ARCANE: 紫の多面体魔法弾・回転/脈動
- BLADE GUN: ピンク系中距離弾
- CANNON: 大型赤弾・強反動・重いSE
- 全武器マズルフラッシュ
- 武器別発射SE
- 武器別弾サイズ / 射程 / 反動
- bullet geometry/materialを破棄時にdispose
- デプロイなし

## v0.6.6.1 local — SUPER Identity + v6.6.0 Repair

### v6.6.0 repair
- weapon-specific SE / recoil callsがmatchLaterのreturn後に入っていた不具合を修正
- muzzleFlash二重定義を解消
- 武器別SE / 反動を実際のshoot()へ接続

### SUPER
- OVERDRIVE: 12発高速バースト
- BLAST RING: 18方向全周弾
- PHANTOM DASH: 0.65秒無敵の高速突進
- NOVA: 20方向魔法弾 + HP24回復
- BLADE FAN: 前方11方向扇状弾
- STORM: 220ms差の16方向×2波
- SUPER専用リング / パーティクル / SE / 振動
- SUPER READYボタン発光
- SUPER使用時HEAT -35、OVERHEAT解除
- デプロイなし

## v0.6.6.2 local — Build Budget
- BODY / WEAPON / DEFENSE / SUPERにコスト設定
- 合計10ポイント制
- 10を超えるとSTART不可
- COSTをリアルタイム表示
- P1/P2ロードアウトをlocalStorageへ保存
- 次回起動時に自動復元
- P1/P2それぞれRANDOM BUILD追加
- RANDOMは10ポイント以内になるまで自動生成
- デプロイなし

## v0.6.6.3 local — BODY Identity
- BODYがHP / 移動速度 / 当たり判定 / ノックバック耐性 / 反動耐性 / ダッシュ距離へ影響
- HEAVYは高耐久・高耐性だが遅く大きい
- LIGHTは高速・小型・ダッシュ長めだが吹き飛ばされやすい
- BALANCED / TECH / AGILE / ARMOREDも個別補正
- キャラメイク画面にBODY CLASS / HIT / KB RES表示
- デプロイなし

## v0.6.6.4 local — PASSIVE

キャラメイクにPASSIVE枠を追加。

- COOLANT
  - COST 1
  - HEAT冷却 +25%
- STABILIZER
  - COST 1
  - 武器反動 -35%
- SPRINTER
  - COST 1
  - 移動速度 +6%
- ARMOR PLATE
  - COST 2
  - 被ダメージ -8%
- CHARGER
  - COST 2
  - SUPERゲージ増加量 +18%
- CORE HUNTER
  - COST 1
  - POWER CORE効果 8秒 → 11秒
- 10ポイント制にPASSIVEコストも含める
- RANDOM BUILD / localStorage保存もPASSIVE対応
- デプロイなし

## v0.6.6.5 local — VS Intro & Match Result
- 開始前にP1 vs P2ビルド紹介
- 与ダメ / 被ダメ / 発射 / 命中 / 命中率 / SUPER / DEFENSE / CORE / PARRYを記録
- 試合終了時にWINNER + MATCH STATS表示
- リマッチは同じビルドを維持
- フルリマッチで戦績リセット
- デプロイなし

## v0.6.6.6 local — Stage Graphics Pass

ステージの見た目を大幅強化。

- 8アリーナそれぞれに専用カラーテーマ
  - 背景色 / fog / 床色 / 発光色
- 床を多層構造化
  - 下地ベース
  - メイン床
  - 外周リム
  - 内側ライン
  - 中央パターン
- 外周の境界ビジュアル追加
  - 低いフレーム壁
  - 発光ストリップ
  - 四隅ビーコン
- ステージライト追加
  - コーナーのポイントライト
  - 上方スポット
- アリーナ別デコ追加
  - industrial系：locker / workbench / pallet
  - hex：発光タワー
  - bush：外周ブッシュ群
  - ring / pillars：外周パッド
- 既存の対戦ルールは変更なし
- デプロイなし
