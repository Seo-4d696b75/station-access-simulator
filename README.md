# ekimemo-access-simulator

![npm version](https://img.shields.io/npm/v/ekimemo-access-simulator.svg)
![npm license](https://img.shields.io/npm/l/ekimemo-access-simulator.svg)
![npm types](https://img.shields.io/npm/types/ekimemo-access-simulator.svg)
![test workflow](https://github.com/Seo-4d696b75/station-access-simulator/actions/workflows/test.yml/badge.svg)
[![codecov](https://codecov.io/gh/Seo-4d696b75/station-access-simulator/branch/main/graph/badge.svg?token=1JENN8RNOU)](https://codecov.io/gh/Seo-4d696b75/station-access-simulator)


🚃スマートフォンゲーム「駅メモ」のアクセスイベントをシミュレーションするJavaScript（TypeScript）ライブラリ

# 1. Features

✅ スキル発動のシミュレーション  
✅ ダメージ計算のシミュレーション  
✅ 経験値獲得・レベルアップのシミュレーション  
✅ オリジナルでんこ No.1〜No.65 までのスキル実装  
✅ タイムライン上の表示をコンソール出力で再現  

![image](https://user-images.githubusercontent.com/25225028/204131714-46bc4e25-f29a-4367-a2bc-00f2297452d4.png)


# 2. Install

## CDNでWebブラウザから利用
`head`タグ内に追加  

```html
<script language="javascript" type="text/javascript" src="https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@^0.4.0/umd/simulator.min.js"></script>
```

利用例：[[CodePen] CDN on Web](https://codepen.io/seo-4d696b75/pen/RwjoWeR)

## node module としてインストール

```bash
npm install ekimemo-access-simulator
```

利用例１：[CodeSandbox - Webブラウザで簡単に試せます](https://codesandbox.io/s/yi-memo-akusesusimiyureta-cor73?file=/src/index.ts)  

利用例２：[/example サンプルプロジェクト - 実際にローカルで実行できます](https://github.com/Seo-4d696b75/station-access-simulator/blob/main/example/README.md)

# 3. Example of Usage

もっとも基本的な使用方法です  
[/example にあるサンプルプロジェクトで試す](https://github.com/Seo-4d696b75/station-access-simulator/blob/main/example/README.md)
```js
import { AccessConfig, activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);
  
  let reika = DencoManager.getDenco(context, "5", 80);
  let master1 = initUser(context, "master1", [reika]);
  master1 = activateSkill(context, master1, 0);

  let charlotte = DencoManager.getDenco(context, "6", 50, 3);
  let master2 = initUser(context, "master2", [charlotte]);

  let config = {
    offense: { state: master1, carIndex: 0 }, 
    defense: { state: master2, carIndex: 0 },
    station: charlotte.link[0]
  };
  const result = startAccess(context, config);

  printEvents(context, result.offense, true);
  printEvents(context, result.defense, true);
});
```

# 4. Docs

[様々な使用例の紹介・実装の詳細な説明はこちら](https://github.com/Seo-4d696b75/station-access-simulator/blob/main/docs/index.md)

# 5. What's New?
[各バージョンの一覧はこちら](https://github.com/Seo-4d696b75/station-access-simulator/releases)  


**v0.4.0**  
- `SkillLogic` コールバックの追加
  - 編成内のでんこがリンクを開始 `onLinkStarted`
  - スキル状態がunableに変化 `onUnable`
  - スキル状態がcooldownに変化 `onCooldown`
- スキル状態が非アクティブでもコールバックを呼び出す
- 状態のコピー関数を修正
- 発動したスキルの効果内容を確率で変化させる実装を追加
- スキル発動判定に失敗した場合の処理を追加
- スコア・経験値の内訳を細分化、型定義の修正
- でんこの名前を複数種類追加　`name, fullName, firstName`
- スキルの追加
  - 66 みなも
  - 67 まぜ
  - 68 みつる
  - 70 みやび
  - 71 るり
  - 72 ナギサ
  - 73 やまと
  - 74 コヨイ
  - 75 ニナ
  - 77 リト
  - 78 なる
  - 79 シズ
  - 80 ねも
  - 81 ゆう
  - 82 ゆかり
  - 83 くろがね
  - 84 みそら
  - 85 めぐる
- 不具合の修正
  - 61 Chitoseのスキルがアクセス時に影響しないサポーターのスキルも無効化してしまう
  - 65 Hibikiのスキルがレンに無効化されてしまう
  - アクセス直後のスキル発動で発動確率が100%でも確率補正（ひいる）が効いててしまう
  - 特定の場合でカウンターが２回以上発動しない（まりか > みこと・くに）
  - 38 Kuni のスキル発動タイミングが誤っていた
  - スキル発動の呼び出し内から`activate/deactivateSkill`を呼び出せない（型定義が不適当）
  - アクセス以外のスキル発動でEvent記録が破壊される場合がある
  - `UserPropertyReader`の初期化が不適当で関数の呼び出しが正しく機能しない
  - 新駅の判定処理を追加
  

**v0.3.1**
- サンプルプロジェクトの追加
- UMDファイルの分割(Code Splitting)
- 時刻を扱うライブラリの変更 moment.js => [Day.js](https://day.js.org/en/)
- コンソール出力`format`のテスト追加
- コンソール出力での表示の不具合を修正
  - リンク解除されたアクセスでリンク時間が表示されない不具合
  - アクセスでレベルアップ後の最大HP,レベルで表示される不具合
