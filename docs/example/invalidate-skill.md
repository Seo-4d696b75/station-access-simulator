# 無効化スキル
他スキルを無効化するスキルを使ってみましょう

## 対象のでんこ
2017年秋に登場したちとせを始め、ゲームバランスをぶっ壊してきた彼女らのスキルをシミュレーションします

- 22 レン
- 33 エリア
- 40 ハル
- 61 ちとせ
- EX02 まひる
- EX03 すすぐ
- EX04 てすと

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

![image](https://user-images.githubusercontent.com/25225028/204132241-bb7db12b-c699-424f-b9c6-747b4a2fd78e.png)


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
アクセス処理の開始 2022-11-27 20:09:25.853
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
フィルムによるダメージ計算の補正
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
経験値追加 ren 68000(current) + 622 -> 68622
経験値詳細 access:622 skill:0 link:0
経験値追加 siira 68000(current) + 45288 -> 113288
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

![image](https://user-images.githubusercontent.com/25225028/204132447-29d7a58f-4254-4c8b-ae50-76063363323f.png)


<details>
<summary>ログ詳細</summary>


```txt
ライブラリを初期化しました
編成を変更します [] -> [miroku,chitose]
スキル状態の変更：chitose idle -> active
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [siira,seria]
スキル状態の変更：seria idle -> active
アクセス処理の開始 2022-11-27 20:18:11.030
攻撃：miroku
アクティブなスキル(攻撃側): miroku,chitose
守備：siira
アクティブなスキル(守備側): siira,seria
スキルを評価：フットバースの確認
アクセスによる追加 miroku score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルが発動(攻撃側) name:chitose(61) skill:見果てぬ景色
サポーターのスキルも何のその、ですよ♪ 無効化：seria
スキルを評価：アクセス開始
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによるダメージ計算の補正
スキルを評価：ATK&DEFの増減
確率計算は無視されます mode: force
スキルが発動できます siira 確率:30%
スキルが発動(守備側) name:siira(11) skill:ジョイフルガード
わ、わたしのスキルでアクセスされた時にダメージを軽減できます DEF+50%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:263 ATK:0% DEF:50% DamageBase:170 = 263 * 50% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 miroku score:170 exp:170
ダメージ計算が終了：170
守備の結果 HP: 384 > 214 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
確率計算は無視されます mode: force
スキルが発動できます miroku 確率:4.5%
スキルが発動(攻撃側) name:miroku(4) skill:ダブルアクセス Lv.6
気合入れて頑張っていこー♪
アクセス処理を再度実行 #1
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによるダメージ計算の補正
スキルを評価：ATK&DEFの増減
確率計算は無視されます mode: force
スキルが発動できます siira 確率:30%
スキルが発動(守備側) name:siira(11) skill:ジョイフルガード
わ、わたしのスキルでアクセスされた時にダメージを軽減できます DEF+50%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:263 ATK:0% DEF:50% DamageBase:170 = 263 * 50% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 miroku score:170 exp:170
ダメージ計算が終了：340
守備の結果 HP: 384 > 44 reboot:false
アクセス処理を終了 #1
スキルの評価中にHPが変化したでんこがいます
denco:siira HP:214 => 44
スキルを再度評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 miroku 316 > 316 reboot:false
HP確定 siira 384 > 44 reboot:false
攻撃側のリンク成果：false
守備側のリンク解除：false
アクセス処理の終了
経験値追加 miroku 0(current) + 440 -> 440
経験値詳細 access:440 skill:0 link:0
経験値追加 siira 68000(current) + 0 -> 68000
経験値詳細 access:0 skill:0 link:0
スキルが直前のアクセスで無効化されています seria
```
</details>

<a name="case3"></a>

## Case 3. 無効化スキルどうしの影響

それぞれactiveな状態で、攻撃側にまひる＆守備側にちとせが居る場合、攻撃側のまひるが先に発動してeco属性であるちとせのスキルを無効化します. 結果、ちとせのスキルは発動せずサポーターであるレイカのスキルは発動します. 

```js
import { AccessConfig, activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);
  context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

  let reika = DencoManager.getDenco(context, "5", 50)
  let mahiru = DencoManager.getDenco(context, "EX02", 50)
  let chitose = DencoManager.getDenco(context, "61", 80, 1)
  let offense = initUser(context, "とあるマスター", [reika, mahiru])
  offense = activateSkill(context, offense, 0, 1)
  let defense = initUser(context, "とあるマスター２", [chitose])
  defense = activateSkill(context, defense, 0)
  
  let config: AccessConfig = {
    offense: { state: master1, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: chitose.link[0]
  };
  const result = startAccess(context, config);

  // アクセス相手のタイムラインを見てみる
  printEvents(context, result.defense, true);
});
```


### Console Output

<img width="420" alt="image" src="https://user-images.githubusercontent.com/25225028/210316191-fe722860-3973-4049-ad9c-21a7e73df95c.png">



<details>
<summary>ログ詳細</summary>


```txt
ライブラリを初期化しました
ランダムに駅を選出：池袋
編成を変更します [] -> [reika,mahiru]
スキル状態の変更：reika idle -> active
スキル状態の変更：mahiru idle -> active
編成を変更します [] -> [chitose]
スキル状態の変更：chitose idle -> active
アクセス処理の開始 16:37:17.651
攻撃：reika
アクティブなスキル(攻撃側): reika,mahiru
守備：chitose
アクティブなスキル(守備側): chitose
スキルを評価：フットバースの確認
アクセスによる追加 reika score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
確率計算は無視されます mode: force
スキルが発動できます mahiru 確率:85%
スキルが発動(攻撃側) name:mahiru(EX02) skill:ゴーイングマイレール Lv.4
通れない道はあたいに任せな！ 無効化：chitose
スキルを評価：アクセス開始
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによるダメージ計算の補正
スキルを評価：ATK&DEFの増減
スキルが発動(攻撃側) name:reika(5) skill:起動加速度向上 Lv.4
べ、別にあんたの為じゃないんだからね！ ATK+25%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:200 ATK:25% DEF:0% DamageBase:325 = 200 * 125% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 reika score:325 exp:325
ダメージ計算が終了：325
守備の結果 HP: 333 > 8 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 reika 192 > 192 reboot:false
HP確定 chitose 333 > 8 reboot:false
攻撃側のリンク成果：false
守備側のリンク解除：false
アクセス処理の終了
経験値追加 reika 0(current) + 425 -> 425
経験値詳細 access:[object Object] skill:0 link:0
経験値追加 chitose 68000(current) + 0 -> 68000
経験値詳細 access:[object Object] skill:0 link:0
```
</details>


<a name="case4"></a>

## Case 4. 無効化スキルどうしの影響

それぞれactiveな状態で、攻撃側にちとせ＆守備側にまひるが居る場合、攻撃側のちとせが先に発動してサポーターであるふぶのスキルを無効化します. 後から発動するまひるのスキルはeco属性であるちとせのスキルを無効化しますが、**すでに発動したちとせのスキルの効果には影響ありません.** ちとせのスキルが発動した記録はそのままで、無効化されたふぶのスキルは復活しません. 

```js
import { AccessConfig, activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);
  context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

  let fubu = DencoManager.getDenco(context, "14", 50)
  let mahiru = DencoManager.getDenco(context, "EX02", 50, 1)
  let chitose = DencoManager.getDenco(context, "61", 80)
  let offense = initUser(context, "とあるマスター", [chitose])
  offense = activateSkill(context, offense, 0)
  let defense = initUser(context, "とあるマスター２", [mahiru, fubu])
  defense = activateSkill(context, defense, 0, 1)
  
  let config: AccessConfig = {
    offense: { state: master1, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: mahiru.link[0]
  };
  const result = startAccess(context, config);

  // アクセス相手のタイムラインを見てみる
  printEvents(context, result.defense, true);
});
```


### Console Output

<img width="424" alt="image" src="https://user-images.githubusercontent.com/25225028/210317751-7791d3a6-9070-43d5-ae29-20a26cac42ef.png">



<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
ランダムに駅を選出：池袋
編成を変更します [] -> [chitose]
スキル状態の変更：chitose idle -> active
編成を変更します [] -> [mahiru,fubu]
スキル状態の変更：mahiru idle -> active
スキル状態の変更：fubu idle -> active
アクセス処理の開始 16:48:43.730
攻撃：chitose
アクティブなスキル(攻撃側): chitose
守備：mahiru
アクティブなスキル(守備側): mahiru,fubu
スキルを評価：フットバースの確認
アクセスによる追加 chitose score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルが発動(攻撃側) name:chitose(61) skill:見果てぬ景色
サポーターのスキルも何のその、ですよ♪ 無効化：fubu
確率計算は無視されます mode: force
スキルが発動できます mahiru 確率:85%
スキルが発動(守備側) name:mahiru(EX02) skill:ゴーイングマイレール Lv.4
通れない道はあたいに任せな！ 無効化：chitose
スキルを評価：アクセス開始
攻守のダメージ計算を開始
フィルムによるダメージ計算の補正
スキルを評価：ATK&DEFの増減
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:252 ATK:0% DEF:0% DamageBase:252 = 252 * 100% * 1
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 chitose score:252 exp:252
ダメージ計算が終了：252
守備の結果 HP: 224 > 0 reboot:true
アクセス結果を仮決定
攻撃側のリンク成果：true
守備側のリンク解除：true
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 chitose 333 > 333 reboot:false
HP確定 mahiru 224 > 0 reboot:true
攻撃側のリンク成果：true
守備側のリンク解除：true
リンク成功による追加 chitose score:100 exp:100
アクセス処理の終了
経験値追加 chitose 68000(current) + 452 -> 68452
経験値詳細 access:[object Object] skill:0 link:0
経験値追加 mahiru 0(current) + 22496 -> 22496
経験値詳細 access:[object Object] skill:0 link:22496
```
</details>