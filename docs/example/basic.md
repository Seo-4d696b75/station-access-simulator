# 基本的な使用方法


## All Code

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

## Console Output

#### アクセス側

![image](https://user-images.githubusercontent.com/25225028/204131714-46bc4e25-f29a-4367-a2bc-00f2297452d4.png)

#### アクセス相手側

![image](https://user-images.githubusercontent.com/25225028/204131736-09f31b9b-691a-42a4-a67e-4e8752c0a647.png)



<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
編成を変更します [] -> [reika]
スキル状態の変更：reika idle -> active
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [charlotte]
アクセス処理の開始 2022-11-15 11:07:21.559
攻撃：reika
アクティブなスキル(攻撃側): reika
守備：charlotte
アクティブなスキル(守備側): 
スキルを評価：フットバースの確認
アクセスによる追加 reika score:100 exp:100
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
基本ダメージを計算 AP:260 ATK:45% DEF:0% DamageBase:490 = 260 * 145% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 reika score:490 exp:490
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
リンク成功による追加 reika score:100 exp:100
アクセス処理の終了
経験値追加 reika 0(current) + 690 -> 690
経験値詳細 access:690 skill:0 link:0
経験値追加 charlotte 0(current) + 45288 -> 45288
経験値詳細 access:0 skill:0 link:45288
レベルアップ：charlotte Lv.50->Lv.51
現在の経験値：charlotte 7688/38700
```
</details>

## Explanation

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
  printEvents(context, result.offense, true);
  // 守備側のmaster2のタイムラインの様子を見てみましょう
  printEvents(context, result.defense, true);
```
