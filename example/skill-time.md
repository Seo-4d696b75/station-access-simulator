# スキルと時刻

スキルの状態・発動の判定には時刻が大きく影響します

## Case 1. 時刻の扱い・指定方法
ルナのスキル効果は時刻に依存し、昼・夜で効果内容が変化します

デフォルトでは`Context.clock: "now" | number`は`"now"`で実行時の現在時刻が参照されますが、UNIXタイム(ms)を指定して特定時刻でシミュレーションを実行できます.

```js
import moment from "moment-timezone";
import { DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);

  // 昼の時間帯に指定
  context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
  context.setClock('2022-01-01T12:00:00+0900') // どっちでもOK

  let reika = DencoManager.getDenco(context, "5", 80);
  let master1 = initUser(context, "master1", [reika]);

  let luna = DencoManager.getDenco(context, "3", 80, 3);
  let master2 = initUser(context, "master2", [luna]);

  let config = {
    offense: { state: master1, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: luna.link[0]
  };
  const result = startAccess(context, config);

  printEvents(context, result.defense, true);
});
```

#### Console Output
![image](https://user-images.githubusercontent.com/25225028/201916070-143297c8-28ea-4c0b-8cdf-6bd6257f3500.png)

<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
編成を変更します [] -> [reika]
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [luna]
アクセス処理の開始 2022-01-01 12:00:00.000
攻撃：reika
アクティブなスキル(攻撃側): 
守備：luna
アクティブなスキル(守備側): luna
スキルを評価：フットバースの確認
アクセスによる追加 reika score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルを評価：アクセス開始
攻守のダメージ計算を開始
フィルムによる補正をスキップ
スキルを評価：ATK&DEFの増減
スキルが発動(守備側) name:luna(3) skill:ナイトエクスプレス
まだ眠いんよ～ DEF-30%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:260 ATK:0% DEF:-30% DamageBase:338 = 260 * 130% * 1
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 reika score:338 exp:338
ダメージ計算が終了：338
守備の結果 HP: 360 > 22 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 reika 312 > 312 reboot:false
HP確定 luna 360 > 22 reboot:false
攻撃側のリンク成果：false
守備側のリンク解除：false
アクセス処理の終了
経験値追加 reika 0(current) + 438 -> 438
経験値詳細 access:438 skill:0 link:0
経験値追加 luna 0(current) + 0 -> 0
経験値詳細 access:0 skill:0 link:0
```
</details>

## Case 2. 有効化したスキルと時間の経過
スキルのタイプによりますが、時間の経過に伴いスキルの状態（"unable","idle","active","cooldown"）が変化することがあります. この例では、有効化したレイカのスキル（１５分間"active"）が時間経過により"cooldown"に変化しスキルは発動しません。

**重要** `Context.clock`を指定しただけでは状態は更新されません. 新しい時刻を指定した`Context`オブジェクトを引数に`refreshState`関数を呼び出す必要があります

```js
import { activateSkill, DencoManager, init, initContext, initUser, printEvents, refreshState, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);

  // デフォルトの設定では現在時刻を参照
  context.clock = "now"

  let reika = DencoManager.getDenco(context, "5", 60);
  let master = initUser(context, "master1", [reika]);
  master = activateSkill(context, master, 0);

  // 特定時刻に設定（20分経過）
  context.clock = context.currentTime + 20 * 60 * 1000
  master = refreshState(context, master)

  let charlotte = DencoManager.getDenco(context, "6", 80, 3);
  let master2 = initUser(context, "master2", [charlotte]);

  let config = {
    offense: { state: master, carIndex: 0 },
    defense: { state: master2, carIndex: 0 },
    station: charlotte.link[0]
  };
  const result = startAccess(context, config);

  printEvents(context, result.offense, true);
});
```

#### Console Output
![image](https://user-images.githubusercontent.com/25225028/201915116-d8438f3f-84ea-4188-a30a-01887eb23acd.png)

## Case 3. 指定時刻に発動するスキル（１）
もえの回復スキルは１時間ごとに発動します.このシミュレーションでは毎時0時0分の時刻にスキル発動処理がスケジュールされます.

**重要** スケジュールされただけでは処理は実行されません. スケジュールされた時刻以降の値を指定した`Context`オブジェクトを引数に`refreshState`関数を呼び出す必要があります. 

```js
import moment from "moment-timezone"
import { DencoManager, init, initContext, initUser, printEvents, refreshState } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true)

  // 時刻を指定
  context.clock = moment('2022-01-01T12:30:00+0900').valueOf()

  let reika = DencoManager.getDenco(context, "5", 80)
  // レイカのHPを最大HP未満に設定
  reika.currentHp = 10
  let moe = DencoManager.getDenco(context, "9", 50)
  let master = initUser(context, "master1", [reika, moe])

  // 発動時刻を指定
  context.clock = moment('2022-01-01T13:00:00+0900').valueOf()
  master = refreshState(context, master)

  printEvents(context, master, true)
})
```

#### Console Output
![image](https://user-images.githubusercontent.com/25225028/201919742-38c48fc9-efdb-4967-8829-77654f328f60.png)


<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
編成を変更します [] -> [reika,moe]
スキル状態の変更：moe unable -> active
待機列中のスキル評価イベントが指定時刻になりました time: 13:00:00.000 type: hour_cycle
スキル評価イベントの開始
moe 定時メンテナンス Lv.4
編成内のみなさまのHPを回復いたしますよ♪ +25%
HPの回復 reika 10 > 88
スキル評価イベントの終了
```
</details>


## Case 4. 指定時刻に発動するスキル（２）
シャルロッテのスキルは有効化したタイミングから一定時間後に効果が発動します. この例では90分後にスキルが発動してランダムな駅にアクセスします.

```js
import moment from "moment-timezone"
import { activateSkill, DencoManager, init, initContext, initUser, printEvents, refreshState } from "ekimemo-access-simulator"

init().then(() => {
  const context = initContext("this is test", "random seed", true)

  // 時刻を指定
  context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
  context.setClock('2022-01-01T12:00:00+0900')

  let charlotte = DencoManager.getDenco(context, "6", 80)
  let master = initUser(context, "master1", [charlotte])

  // スキルを有効化
  master = activateSkill(context, master, 0)

  // 90分後
  context.clock = moment('2022-01-01T13:30:00+0900').valueOf()
  master = refreshState(context, master)

  printEvents(context, master, true)
})
```

#### Console Output
![image](https://user-images.githubusercontent.com/25225028/201932222-6a31b5fe-636d-407c-b832-dfb2d8d9aea3.png)


<details>
<summary>ログ詳細</summary>

```txt
ライブラリを初期化しました
編成を変更します [] -> [charlotte]
スキル状態の変更：charlotte idle -> active
スキル状態の変更：charlotte active -> cooldown (timeout:12:00:00.000)
スキル状態の変更：charlotte cooldown -> idle (timeout:13:30:00.000)
待機列中のスキル評価イベントが指定時刻になりました time: 13:00:00.000 type: hour_cycle
待機列中のスキル評価イベントが指定時刻になりました time: 13:30:00.000 type: skill
スキル評価イベントの開始
charlotte 風の吹くまま気の向くまま
アクセス処理の開始 2022-01-01 13:30:00.000
攻撃：charlotte
アクティブなスキル(攻撃側): 
守備側はいません
アクセスによる追加 charlotte score:100 exp:100
スキルを評価：確率ブーストの確認
スキルを評価：アクセス開始前
スキルを評価：アクセス開始
アクセス結果を仮決定
攻撃側のリンク成果：true
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 charlotte 324 > 324 reboot:false
攻撃側のリンク成果：true
守備側のリンク解除：false
リンク成功による追加 charlotte score:100 exp:100
アクセス処理の終了
経験値追加 charlotte 0(current) + 200 -> 200
経験値詳細 access:200 skill:0 link:0
スキル評価イベントの終了
```
</details>