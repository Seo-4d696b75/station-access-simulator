# 追加のダメージ計算

アクセスでは基本的にダメージ計算は１回行われますが、スキルによっては２回以上ダメージ計算が行われることがあります

## Case 1. 追加でアクセスする
ここではみろくのスキルによるダブルアクセスを紹介します. アクセス開始時の経験値追加などは１回しか処理されませんが、スキルの発動によりダメージ計算が２回行われます. ２回目のダメージ計算は最初と同じ編成・スキルの状態で行われます.

**注意** ダメージ計算の状態は毎回初期化されます！ATK, DEFを増減させるスキルの効果が重複して作用することはありません！

参考：[公式お知らせ -【不具合】特定のスキルが同時に発動した際、意図しない挙動となる](https://ekimemo.com/news/20220922121500_1)

```js
import { activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true)

  // みろくの確率依存のスキルを強制的に発動させる
  context.random.mode = "force"

  let miroku = DencoManager.getDenco(context, "4", 50);
  let reika = DencoManager.getDenco(context, "5", 50);
  let master1 = initUser(context, "master1", [miroku, reika]);
  master1 = activateSkill(context, master1, 1)

  let izuna = DencoManager.getDenco(context, "13", 80, 3);
  let master2 = initUser(context, "master2", [izuna]);

  let config = {
    offense: { state: master1, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: izuna.link[0]
  };
  const result = startAccess(context, config);

  printEvents(context, result.offense, true);
})
```

#### Console Output
![image](https://user-images.githubusercontent.com/25225028/201941226-f8cb942c-28ff-4c83-a847-ecaeba32c5e5.png)


<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
編成を変更します [] -> [miroku,reika]
スキル状態の変更：reika idle -> active
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [izuna]
アクセス処理の開始 2022-11-15 23:11:10.510
攻撃：miroku
アクティブなスキル(攻撃側): miroku,reika
守備：izuna
アクティブなスキル(守備側): izuna
スキルを評価：フットバースの確認
アクセスによる追加 miroku score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルを評価：アクセス開始
攻守のダメージ計算を開始
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルが発動(攻撃側) name:reika(5) skill:起動加速度向上 Lv.4
べ、別にあんたの為じゃないんだからね！ ATK+25%
スキルが発動(守備側) name:izuna(13) skill:私が本務機です♪
編成をディフェンダーで固めるととっても効果的なのよ♪ DEF: 7% * 1(ディフェンダー数) = 7%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:190 ATK:25% DEF:7% DamageBase:224 = 190 * 118% * 1
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 miroku score:224 exp:224
ダメージ計算が終了：224
守備の結果 HP: 336 > 112 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
確率計算は無視されます mode: force
スキルが発動できます miroku 確率:3.5%
スキルが発動(攻撃側) name:miroku(4) skill:ダブルアクセス Lv.4
気合入れて頑張っていこー♪
アクセス処理を再度実行 #1
攻守のダメージ計算を開始
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルが発動(攻撃側) name:reika(5) skill:起動加速度向上 Lv.4
べ、別にあんたの為じゃないんだからね！ ATK+25%
スキルが発動(守備側) name:izuna(13) skill:私が本務機です♪
編成をディフェンダーで固めるととっても効果的なのよ♪ DEF: 7% * 1(ディフェンダー数) = 7%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:190 ATK:25% DEF:7% DamageBase:224 = 190 * 118% * 1
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 miroku score:224 exp:224
ダメージ計算が終了：448
守備の結果 HP: 336 > 0 reboot:true
アクセス処理を終了 #1
スキルの評価中にHPが変化したでんこがいます
denco:izuna HP:112 => 0
スキルを再度評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 miroku 228 > 228 reboot:false
HP確定 izuna 336 > 0 reboot:true
攻撃側のリンク成果：true
守備側のリンク解除：true
リンク成功による追加 miroku score:100 exp:100
アクセス処理の終了
経験値追加 miroku 0(current) + 648 -> 648
経験値詳細 access:648 skill:0 link:0
経験値追加 izuna 0(current) + 51392 -> 51392
経験値詳細 access:0 skill:0 link:51392
```
</details>

## Case 2. カウンター（ダメージ計算あり）
カウンターするシーナのスキルを紹介します. スキルが発動すると攻守を入れ替えて追加でダメージ計算を実行します. 

**注意** 同じカウンターでもまりかのスキルはダメージ計算ではなく、被ダメージ量をそのまま相手に返します

```js
import { activateSkill, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true)

  // シーナの確率依存のスキルを強制的に発動させる
  context.random.mode = "force"

  let charlotte = DencoManager.getDenco(context, "6", 50);
  let master1 = initUser(context, "master1", [charlotte]);

  let sheena = DencoManager.getDenco(context, "7", 80, 3);
  let reika = DencoManager.getDenco(context, "5", 50);
  let master2 = initUser(context, "master2", [sheena, reika]);
  master2 = activateSkill(context, master2, 1)

  let config = {
    offense: { state: master1, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: sheena.link[0]
  };
  const result = startAccess(context, config);

  printEvents(context, result.offense, true);
})
```

#### Console Output
![image](https://user-images.githubusercontent.com/25225028/201942730-bf3be058-7f2d-4630-8e5d-1b347368e72b.png)


<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
編成を変更します [] -> [charlotte]
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [sheena,reika]
スキル状態の変更：reika idle -> active
アクセス処理の開始 2022-11-15 23:19:47.595
攻撃：charlotte
アクティブなスキル(攻撃側): 
守備：sheena
アクティブなスキル(守備側): sheena,reika
スキルを評価：フットバースの確認
アクセスによる追加 charlotte score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルを評価：アクセス開始
攻守のダメージ計算を開始
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:170 ATK:0% DEF:0% DamageBase:170 = 170 * 100% * 1
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 charlotte score:170 exp:170
ダメージ計算が終了：170
守備の結果 HP: 420 > 250 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
確率計算は無視されます mode: force
スキルが発動できます sheena 確率:11%
スキルが発動(守備側) name:sheena(7) skill:レッツトエントリヒ
あら、誰か来たみたい♪ カウンター攻撃
攻守交代、カウンター攻撃を開始
攻守のダメージ計算を開始
攻守の属性によるダメージ補正が適用：1.3
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルが発動(攻撃側) name:reika(5) skill:起動加速度向上 Lv.4
べ、別にあんたの為じゃないんだからね！ ATK+25%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:250 ATK:25% DEF:0% DamageBase:406 = 250 * 125% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 sheena score:406 exp:406
ダメージ計算が終了：406
守備の結果 HP: 228 > 0 reboot:true
カウンター攻撃を終了
最終的なアクセス結果を決定
HP確定 charlotte 228 > 0 reboot:true
HP確定 sheena 420 > 250 reboot:false
攻撃側のリンク成果：false
守備側のリンク解除：false
アクセス処理の終了
経験値追加 charlotte 0(current) + 270 -> 270
経験値詳細 access:270 skill:0 link:0
経験値追加 sheena 0(current) + 406 -> 406
経験値詳細 access:406 skill:0 link:0
```
</details>