# ekimemo-access-simulator

![npm version](https://img.shields.io/npm/v/ekimemo-access-simulator.svg)
![npm license](https://img.shields.io/npm/l/ekimemo-access-simulator.svg)
![npm types](https://img.shields.io/npm/types/ekimemo-access-simulator.svg)


「駅メモ」のアクセスイベントをシミュレーションするJavaScript(TypeScript)ライブラリ

# How to Use

## CDNでWebブラウザから利用
`head`タグ内に追加  

```html
<script language="javascript" type="text/javascript" src="https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@0.1.0/umd/simulator.min.js"></script>
```

利用例：[[CodePen] CDN on Web](https://codepen.io/seo-4d696b75/pen/RwjoWeR)

## node module としてインストール

```bash
$ > npm install ekimemo-access-simulator
```

利用例：[[CodeSandbox] TypeScript + Node.js](https://codesandbox.io/s/yi-memo-akusesusimiyureta-cor73?file=/src/index.ts)

# Basic Usage
まずはライブラリを初期化してでんこ・スキルのデータをロードします
```js
import { init } from "ekimemo-access-simulator";
// init() は非同期関数です 準備が終わるまで待ちましょう
init().then(() => {
  // your code here
});
// もしくは非同期関数内で init() を呼び出します
async function run() {
  await init();
  // your code here
}
```

次にアクセスを行う編成の状態（マスターの状態）を初期化します
```js
import { DencoManager, initContext, initUser } from "ekimemo-access-simulator"

  // context にはすべての処理に関するログ・疑似乱数・処理時刻の情報が保持されています
  const context = initContext("this is test", "random seed", true);
  // でんこの状態変数を初期化します (例)レイカ:"5" level:80
  let reika = DencoManager.getDenco(context, "5", 80);
  // 編成状態をレイカひとりで初期化します
  let master1 = initUser(context, "master1", [reika]);
```

このライブラリは関数指向で設計されています 現在の状態変数を関数に渡し新しい状態変数を返す、と繰り返して処理を進めます
```js
import { activateSkill, changeFormation, DencoManager } from "ekimemo-access-simulator"

  // case 1: 編成を変える
  let seria = DencoManager.getDenco(context, "1", 50);
  master1 = changeFormation(context, master1, [reika, seria]);
  // case 2: 編成内のレイカのスキルを有効化する (編成内の位置は0始まりで数えます)
  master1 = activateSkill(context, { ...master1, carIndex: 0 });
```

実際にアクセスをシミュレーションします
```js
import { AccessConfig, printEvents, startAccess } from "ekimemo-access-simulator"

  // 相手の編成を用意 このシャルロッテはランダムに選択された３駅のリンクを保持しています
  let charlotte = DencoManager.getDenco(context, "6", 50, 3);
  let master2 = initUser(context, "master2", [charlotte]);
  // アクセスの詳細をオブジェクトで定義して渡します
  let config: AccessConfig = {
    // master1 のレイカが master2 のシャルロッテが保持している0番目の駅にアクセスします
    offense: { ...master1, carIndex: 0 }, 
    defense: { ...master2, carIndex: 0 },
    station: charlotte.link[0]
  };
  // アクセスを実行
  const result = startAccess(context, config);
  // 攻撃側のmaster1のタイムラインの様子を見てみましょう
  master1 = result.offense;
  printEvents(context, master1);
```

ここまでの処理を実行すると Console に次のような詳細な情報が出力されます
```bash
```
