# 無効化スキル
他スキルを無効化するスキルを使ってみましょう

## 対象のでんこ
2017年秋に登場したちとせを始め、ゲームバランスをぶっ壊してきた彼女らのスキルをシミュレーションします

- 22 レン
- 33 エリア
- 40 ハル
- 61 ちとせ

## Case 1. 基本的なスキル無効化 

アクセスするレンのスキルにより相手のしいらのスキルが無効化されます。  
同時にアクセス相手編成内のちとせのスキルにより、レイカのスキルも無効化されます。

```js
import { AccessConfig, activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);
  context.random.mode = "force" // 確率依存のスキルを強制的に発動させます
  
  let reika = DencoManager.getDenco(context, "5", 80);
  let ren = DencoManager.getDenco(context, "22", 80);
  let master1 = initUser(context, "master1", [ren, reika]);
  master1 = activateSkill(context, master1, 0, 1);

  let siira = DencoManager.getDenco(context, "11", 80, 3);
  let chitose = DencoManager.getDenco(context, "61", 80);
  let master2 = initUser(context, "master2", [siira, chitose]);
  master2 = activateSkill(context, master2, 1)

  let config: AccessConfig = {
    offense: { state: master1, carIndex: 0 }, 
    defense: { state: master2, carIndex: 0 },
    station: siira.link[0]
  };
  const result = startAccess(context, config);

  // アクセス相手のタイムラインを見てみる
  printEvents(context, result.offense, true);
});
```

#### Console Output

![image](https://user-images.githubusercontent.com/25225028/201904259-77f45cf5-a205-43ec-ace8-0719cf5fc471.png)

<details>
<summary>ログ詳細</summary>


```txt
ライブラリを初期化しました
編成を変更します [] -> [ren,reika]
スキル状態の変更：ren idle -> active
スキル状態の変更：reika idle -> active
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [siira,chitose]
スキル状態の変更：chitose idle -> active
アクセス処理の開始 2022-11-15 19:47:28.418
攻撃：ren
アクティブなスキル(攻撃側): ren,reika
守備：siira
アクティブなスキル(守備側): siira,chitose
スキルを評価：フットバースの確認
アクセスによる追加 ren score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルが発動(攻撃側) name:ren(22) skill:はったりかましまくり
ウチのスキルは相手のスキルを無効化するでぇー target:siira
スキルが発動(守備側) name:chitose(61) skill:見果てぬ景色
サポーターのスキルも何のその、ですよ♪ 無効化：reika
スキルを評価：アクセス開始
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:325 ATK:0% DEF:0% DamageBase:422 = 325 * 100% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 ren score:422 exp:422
ダメージ計算が終了：422
守備の結果 HP: 384 > 0 reboot:true
アクセス結果を仮決定
攻撃側のリンク成果：true
守備側のリンク解除：true
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 ren 284 > 284 reboot:false
HP確定 siira 384 > 0 reboot:true
攻撃側のリンク成果：true
守備側のリンク解除：true
リンク成功による追加 ren score:100 exp:100
アクセス処理の終了
経験値追加 ren 0(current) + 622 -> 622
経験値詳細 access:622 skill:0 link:0
経験値追加 siira 0(current) + 45288 -> 45288
経験値詳細 access:0 skill:0 link:45288
```
</details>


## Case 2. アクセス後に影響するスキル無効化

セリアの回復スキルはアクセス終了直後のタイミングで発動しますが、直前のアクセスにおけるスキル無効化の影響を受けます. この例では、アクセス側のちとせのスキルで相手編成内のセリアのスキルが無効化され、発動条件を満たすものの回復はしません.


```js
import { AccessConfig, activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);
  context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

  let miroku = DencoManager.getDenco(context, "4", 70);
  let chitose = DencoManager.getDenco(context, "61", 80);
  let master1 = initUser(context, "master1", [miroku, chitose]);
  master1 = activateSkill(context, master1, 1);

  let siira = DencoManager.getDenco(context, "11", 80, 3);
  let seria = DencoManager.getDenco(context, "1", 80);
  let master2 = initUser(context, "master2", [siira, seria]);
  master2 = activateSkill(context, master2, 1)

  let config: AccessConfig = {
    offense: { state: master1, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: siira.link[0]
  };
  const result = startAccess(context, config);

  // アクセス相手のタイムラインを見てみる
  printEvents(context, result.defense, true);
});
```

### Console Output
![image](https://user-images.githubusercontent.com/25225028/201907967-2f859bc8-415e-4cf1-b3df-69a295364303.png)

<details>
<summary>ログ詳細</summary>


```txt
ライブラリを初期化しました
編成を変更します [] -> [reika,chitose]
スキル状態の変更：chitose idle -> active
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [siira,seria]
スキル状態の変更：seria idle -> active
アクセス処理の開始 2022-11-15 20:24:14.384
攻撃：reika
アクティブなスキル(攻撃側): chitose
守備：siira
アクティブなスキル(守備側): siira,seria
スキルを評価：フットバースの確認
アクセスによる追加 reika score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルが発動(攻撃側) name:chitose(61) skill:見果てぬ景色
サポーターのスキルも何のその、ですよ♪ 無効化：seria
スキルを評価：アクセス開始
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
確率計算は無視されます mode: force
スキルが発動できます siira 確率:30%
スキルが発動(守備側) name:siira(11) skill:ペインガード Lv.5
わ、わたしのスキルでアクセスされた時にダメージを軽減できます DEF+35%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:260 ATK:0% DEF:35% DamageBase:219 = 260 * 65% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 reika score:219 exp:219
ダメージ計算が終了：219
守備の結果 HP: 296 > 77 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 reika 312 > 312 reboot:false
HP確定 siira 296 > 77 reboot:false
攻撃側のリンク成果：false
守備側のリンク解除：false
アクセス処理の終了
経験値追加 reika 0(current) + 319 -> 319
経験値詳細 access:319 skill:0 link:0
経験値追加 siira 0(current) + 0 -> 0
経験値詳細 access:0 skill:0 link:0
スキルが直前のアクセスで無効化されています seria
```
</details>