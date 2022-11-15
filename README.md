# ekimemo-access-simulator

![npm version](https://img.shields.io/npm/v/ekimemo-access-simulator.svg)
![npm license](https://img.shields.io/npm/l/ekimemo-access-simulator.svg)
![npm types](https://img.shields.io/npm/types/ekimemo-access-simulator.svg)
![test workflow](https://github.com/Seo-4d696b75/station-access-simulator/actions/workflows/test.yml/badge.svg)


スマートフォンゲーム「駅メモ」のアクセスイベントをシミュレーションするJavaScript（TypeScript）ライブラリ🚃

# 1. Features

✅ スキル発動のシミュレーション
✅ ダメージ計算のシミュレーション
✅ 経験値獲得・レベルアップのシミュレーション
✅ ゲームタイムライン上のダイアログ表示の再現
✅ オリジナルでんこ No.1〜No.50 までのスキル実装

# 2. How to Use

## CDNでWebブラウザから利用
`head`タグ内に追加  

```html
<script language="javascript" type="text/javascript" src="https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@0.2.0/umd/simulator.min.js"></script>
```

利用例：[[CodePen] CDN on Web](https://codepen.io/seo-4d696b75/pen/RwjoWeR)

## node module としてインストール

```bash
npm install ekimemo-access-simulator
```

利用例：[[CodeSandbox] TypeScript + Node.js](https://codesandbox.io/s/yi-memo-akusesusimiyureta-cor73?file=/src/index.ts)

# 3. Example of Usage

もっとも基本的な使用方法です [コードの詳細・解説](./example/basic.md)
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

[その他の使用方法に関してはこちらで紹介しています](./example/index.md)

# 4. Docs

実装の詳細を解説します

- [アクセス処理の実装](./docs/access.md)
- [ダメージ計算の実装](./docs/damage.md)

**実際のゲームの動作・実装と異なる可能性があります！**  
このライブラリの目的はシミュレーションです。ゲームでの動作に可能な限り近づけるよう配慮されていますが、完全な再現はできていません。

実装の参考

- アクセスにおけるスキルの発動順序：[駅メモ！公式ブログ - 駅メモ！のスキルの発動順序について](https://blog.ekimemo.com/post/179166914454/%E9%A7%85%E3%83%A1%E3%83%A2%E3%81%AE%E3%82%B9%E3%82%AD%E3%83%AB%E3%81%AE%E7%99%BA%E5%8B%95%E9%A0%86%E5%BA%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6)
- 各でんこのスキル動作：[駅メモ！情報Wiki - オリジナルでんこ](https://ek1mem0.wiki.fc2.com/wiki/%E9%A1%94%E7%94%BB%E5%83%8F%E3%83%BB%E3%82%BF%E3%82%A4%E3%83%97%E3%83%BB%E5%B1%9E%E6%80%A7%E3%83%BB%E8%89%B2%E3%83%BB%E3%82%B9%E3%82%AD%E3%83%AB%E5%90%8D%2F%E3%82%AA%E3%83%AA%E3%82%B8%E3%83%8A%E3%83%AB%E3%81%A7%E3%82%93%E3%81%93)


# 5. Release Note
[各バージョンの一覧はこちら](https://github.com/Seo-4d696b75/station-access-simulator/releases)  

**v0.2.0**
- スキルの発動条件・発動処理のコールバック定義を変更
  - アクセス時の発動条件・発動処理を同一のコールバックに統一  
    `canEvaluate, evaluate` => `triggerOnAccess`  
    関数の返り値で発動確率・発動時の処理を同時に指定できます
  - 命名の変更  
    `evaluateOnEvent` => `triggerOnEvent`
- 週末・祝日の判定処理を追加
- ユーザの情報へのアクセスを追加
  - ユーザの駅アクセス情報の定義 `StationStatistics`
  - 当日の移動・アクセス情報の定義 `DailyStatistics`
  - 読み出し方法の追加 `UserPropertyReader`
- スキル状態に発動時刻の記録を追加（アサのスキルが利用）
- スキル状態にカスタムデータ（任意のデータ）を定義可能に  
  - 型安全な読み書き `boolean, number, string, number[], string[]`
  - 状態の複製機能
  - あたるのスキルで利用
- スキルのコールバック関数`onDencoReboot`の実装
- 不具合の修正
  - いろはのスキルの自身より高レベルのでんこにリンクを渡せてしまう
  - レベルアップでスキル状態がリセットされてしまう
- スキルの追加
  - 27 やちよ
  - 28 リオナ
  - 30 レーノ
  - 31 ありす
  - 32 コタン
  - 33 エリア
  - 35 いおり
  - 37 みこと
  - 38 くに
  - 39 るる
  - 41 にちな
  - 42 そら
  - 43 アサ
  - 44 さいか
  - 45 カノン
  - 46 あたる
  - 48 スピカ
  - 49 メイ
  - 50 なほ


**v0.1.6**
- タイポの修正
