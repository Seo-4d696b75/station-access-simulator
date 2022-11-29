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
<script language="javascript" type="text/javascript" src="https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@^0.3.1/umd/simulator.min.js"></script>
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

**v0.3.1**
- サンプルプロジェクトの追加
- UMDファイルの分割(Code Splitting)
- 時刻を扱うライブラリの変更 moment.js => [Day.js](https://day.js.org/en/)
- コンソール出力`format`のテスト追加
- コンソール出力での表示の不具合を修正
  - リンク解除されたアクセスでリンク時間が表示されない不具合
  - アクセスでレベルアップ後の最大HP,レベルで表示される不具合

**v0.3.0**
- Docsの追加
- サンプルコードの追加
- アクセス中のスキル処理`after_damage`の修正
- カスタムErrorの追加 `SimulationError`
- フィルムの追加
  - スキルの`active, cooldown`時間にフィルム補正を反映
  - アクセスのダメージ計算にATK,DEFを増減させるフィルム補正を反映
  - アクセスの獲得経験値を増加させるフィルム補正の反映
  - スキル処理におけるプロパティ読み出しにフィルム補正を反映  
  - スキルの発動確率にフィルム補正を反映
- スキル処理の型定義`SkillLogic`を刷新
  - スキル状態の遷移タイプ`always, manual, auto...`に応じて必要なプロパティを型で明示的に定義
  - `SkillLogic`に状態遷移タイプのプロパティ`transitionType`を追加
  - スキルの`active,cooldown`時間の指定方法を変更
  - スキルの発動確率の指定方法を変更
  - プロパティ`canTriggerPink`削除
- 編成内のでんこのリンク解除を伝達するコールバック`onLinkDisconnected`の追加
- スキルの追加
  - 51 Himegi
  - 52 Noa
  - 53 Malin
  - 54 Nayori
  - 55 Himari
  - 56 Rara
  - 57 Mizuho
  - 58 Marika
  - 59 Momiji
  - 60 Shiori
  - 62 Mako
  - 63 Tsumugi
  - 64 Akehi
  - 65 Hibiki
- 不具合の修正
  - 関数`fixClock`を使用しても時間差のある処理で時刻が正しく記録されない不具合
  - でんこ最大レベル80のとき経験値を追加した場合の不具合
  - タイムラインの出力関数`printEvents`で0駅リンクのリブートイベントの表示
  - アクセスイベントのデータ`AccessEventData`にレベルアップが反映されてない不具合
  - アクセス以外のスキル発動で発動確率をブーストするひいるのスキルが正しく記録されない不具合
  - セリアの回復スキルの回復量が固定値で計算されていた不具合
