# Duel Arena 3D

2人対戦のブラウザ向け3Dシューティングゲームです。GitHub Pagesで静的配信します。

## 起動経路

`index.html` → `src/main.js`

Three.jsは`index.html`のimport map経由でjsDelivrから読み込みます。ゲーム用モデル・音声は`assets/`配下に配置しています。

## 構成

- `index.html` — UIとゲームのエントリ
- `src/main.js` — ゲーム本体
- `style.css` — UI・画面レイアウト
- `game-config.json` — ゲーム設定
- `assets/models/` — キャラクター・武器・ステージ素材
- `assets/audio/` — BGM・カウント音声
- `.github/workflows/deploy-pages.yml` — GitHub Pagesデプロイ

## デプロイ

`main`へのpushでGitHub Pagesへデプロイします。デプロイ前に`src/main.js`の構文、主要ランタイムマーカー、`game-config.json`を検証します。

## ライセンス

外部アセットについては`THIRD_PARTY_ASSETS.md`と`BGM_LICENSES.md`を参照してください。
