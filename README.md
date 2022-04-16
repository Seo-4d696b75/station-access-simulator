# ekimemo-access-simulator

![npm version](https://img.shields.io/npm/v/ekimemo-access-simulator.svg)
![npm license](https://img.shields.io/npm/l/ekimemo-access-simulator.svg)
![npm types](https://img.shields.io/npm/types/ekimemo-access-simulator.svg)
![test workflow](https://github.com/Seo-4d696b75/station-access-simulator/actions/workflows/test.yml/badge.svg)


「駅メモ」のアクセスイベントをシミュレーションするJavaScript(TypeScript)ライブラリ

# How to Use

## CDNでWebブラウザから利用
`head`タグ内に追加  

```html
<script language="javascript" type="text/javascript" src="https://cdn.jsdelivr.net/npm/ekimemo-access-simulator@0.1.5/umd/simulator.min.js"></script>
```

利用例：[[CodePen] CDN on Web](https://codepen.io/seo-4d696b75/pen/RwjoWeR)

## node module としてインストール

```bash
$ > npm install ekimemo-access-simulator
```

利用例：[[CodeSandbox] TypeScript + Node.js](https://codesandbox.io/s/yi-memo-akusesusimiyureta-cor73?file=/src/index.ts)

# Release Note
[各バージョンの差分詳細はこちら](https://github.com/Seo-4d696b75/station-access-simulator/releases)  
**v0.1.5**  
- スキルの追加
- スキルプロパティが対応するデータ型を数値以外にも拡張
- スキル状態の更新関数の不具合修正
- アクセス以外のスキル発動時にひいるのスキル発動が正しく記録されない不具合を修正
- アクセスにおける攻撃側農業による相手のHP回復に対応
- コンソール出力のカラー出力など修正
- スキル無効化型のスキルを追加・テスト実施

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
  // case 2: 編成内のレイカのスキルを有効化する (0始まりで数える編成内位置で指定します)
  master1 = activateSkill(context, master1, 0);
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
    offense: { state: master1, carIndex: 0 }, 
    defense: { state: master2, carIndex: 0 },
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
ランダムに駅を選出：品川,鶯谷,大崎
編成を変更します [] -> [reika]
編成を変更します [reika] -> [reika,seria]
編成を変更します [] -> [charlotte]
スキル状態の変更：reika idle -> active
アクセス処理の開始 01:29:04 GMT+0900 (日本標準時)
攻撃：reika
アクティブなスキル(攻撃側): reika
守備：charlotte
アクティブなスキル(守備側):
スキルを評価：フットバースの確認
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルを評価：アクセス開始
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルが発動(攻撃側) name:reika(5) skill:大起動加速度向上薬注入
べ、別にあんたの為じゃないんだからね！ ATK+45%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:260
基本ダメージを計算 ATK:45% DEF:0% 260 * 145% * 1.3 = 490
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ計算が終了：490
守備の結果 HP: 228 > 0 reboot:true
アクセス結果を仮決定
攻撃側のリンク成果：true
守備側のリンク解除：true
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 reika 312 > 312 reboot:false
HP確定 charlotte 228 > 0 reboot:true
攻撃側のリンク成果：true
守備側のリンク解除：true
経験値追加 reika 0 + 100
経験値追加 charlotte 0 + 0
アクセス処理の終了
レベルアップ：charlotte Lv.50->Lv.51
現在の経験値：charlotte 14469/38700
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                      access/connect                      ┃
┃                           品川                           ┃
┃                         しながわ                         ┃
┃  charlotte   ╱────────────────────────────┐    reika     ┃
┃    Lv.50     ╲────────────────────────────┘    Lv.80     ┃
┃    eco🌳                 数秒前                heat🔥    ┃
┠──────────────────────────────────────────────────────────┨
┃charlotteのマスター        user            reikaのマスター  ┃
┠──────────────────────────────────────────────────────────┨
┃-                          skill                     reika┃
┠──────────────────────────────────────────────────────────┨
┃490                       damage                         -┃
┠──────────────────────────────────────────────────────────┨
┃228>>0/228                  hp                     312/312┃
┠──────────────────────────────────────────────────────────┨
┃-                          link                          -┃
┠──────────────────────────────────────────────────────────┨
┃3,775pt                    score                     100pt┃
┠──────────────────────────────────────────────────────────┨
┃3,775pt                     exp                      100pt┃
┠──────────────────────────────────────────────────────────┨
┃                   reikaがリンクを開始                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```
