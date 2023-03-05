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
✅ オリジナルでんこ No.1〜No.99 のスキル実装  
✅ エクストラでんこ No.2〜No.4 のスキル実装  
✅ タイムライン上の表示をコンソール出力で再現  

![image](https://user-images.githubusercontent.com/25225028/204131714-46bc4e25-f29a-4367-a2bc-00f2297452d4.png)


# 2. Install

## CDNでWebブラウザから利用
`head`タグ内に追加  

```html
<script language="javascript" type="text/javascript" src="https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@^0.5.0/umd/simulator.min.js"></script>
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


**v0.5.0**  
## Change List

- スキル時間延長の実装  
  アサとは異なりactive, cooldown時間を等しく延長するタイプ  
- スキル発動処理の大幅な修正  
  - スキル発動の効果内容を分類して形式化
  - スキル発動の効果に応じたスキル定義（コールバック）を `SkillLogic`に修正
  - 無効化スキルの発動判定を変更  
    - 無効化の対象をフィルターする関数`isTarget`を返す
    - 無効化の対象の有無を厳密に確認する
  - スキル発動の付随的な効果を追加
    - `AccessSkillTriggerBase#sideEffect`
    - スキルが発動したとき一緒に実行される
    - 19 イムラのATK増加と同時にHPを半減させる実装
  - 確率発動の判定失敗時の処理を追加  
     - `AccessSkillRecipe#fallbackRecipe`
     - （無効化を除く）確率判定に失敗した場合に代わりに実行されて発動扱いになる
     -  78 なるの確率でスキル効果が変化する実装
  - スキル発動失敗時のスキル効果を追加
    - `EventSkillRecipe#fallbackEffect`
    - スキル発動に失敗したときに実行される（発動の記録は残らない）
    - 80 ねものリンク成功時にスキル発動失敗した場合の実装（スキル状態がcooldownに遷移する）
  - 既存のスキル実装を修正
- スキル発動確率を動的に計算できる対応  
  94 ゆき の実装対応
- UserPropertyの修正
  型定義を簡略化・前日のアクセス数の定義追加
- AccessStateの修正  
  両編成の型をUserStateのサブタイプに変更
- 不具合の修正
  - assertでundefinedがthrowされる
  - merge関数の不具合 
  - 33 エリアの無効化スキルが正しく作用しない
- でんこ追加
  - 86 ミナト 
  - 87 ひめ
  - 88 たまき
  - 89 ギンカ
  - 90 あい 
  - 91 よしの
  - 92 すばる
  - 93 あさひ
  - 94 ゆき
  - 95 ひな
  - 96 アヤ
  - 97 あまね
  - 98 まふゆ
  - 99 おとめ