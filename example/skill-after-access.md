
アクセス終了直後に発動するタイプのスキルがあります

（例）セリアの回復スキル

## All Code

```js
import { AccessConfig, activateSkill, DencoManager, getAccessDenco, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator";

init().then(() => {
  const context = initContext("this is test", "random seed", true);
  context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

  let reika = DencoManager.getDenco(context, "5", 80);
  let master1 = initUser(context, "master1", [reika]);
  master1 = activateSkill(context, master1, 0);

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

  printEvents(context, result.defense, true);

  // 最終的なしいらのHPを見てみる
  let d = getAccessDenco(result, "defense")
  console.log(`しいらのHP: ${d.currentHp}`)
});
```

## Console Output

![image](https://user-images.githubusercontent.com/25225028/201903939-44b3ea44-b54a-447b-be46-9aadd0c7aa0c.png)

<details>
<summary>ログ詳細</summary>

```txt
イブラリを初期化しました
編成を変更します [] -> [reika]
スキル状態の変更：reika idle -> active
ランダムに駅を選出：池袋,西日暮里,高輪ゲートウェイ
編成を変更します [] -> [siira,seria]
スキル状態の変更：seria idle -> active
アクセス処理の開始 2022-11-15 19:58:51.215
攻撃：reika
アクティブなスキル(攻撃側): reika
守備：siira
アクティブなスキル(守備側): siira,seria
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
確率計算は無視されます mode: force
スキルが発動できます siira 確率:30%
スキルが発動(守備側) name:siira(11) skill:ジョイフルガード
わ、わたしのスキルでアクセスされた時にダメージを軽減できます DEF+50%
スキルを評価：特殊なダメージ計算
基本ダメージを計算 AP:260 ATK:45% DEF:50% DamageBase:321 = 260 * 95% * 1.3
スキルを評価：固定ダメージ
固定ダメージの計算：0
ダメージ量による追加 reika score:321 exp:321
ダメージ計算が終了：321
守備の結果 HP: 384 > 63 reboot:false
アクセス結果を仮決定
攻撃側のリンク成果：false
守備側のリンク解除：false
スキルを評価：ダメージ計算完了後
最終的なアクセス結果を決定
HP確定 reika 312 > 312 reboot:false
HP確定 siira 384 > 63 reboot:false
攻撃側のリンク成果：false
守備側のリンク解除：false
アクセス処理の終了
経験値追加 reika 0(current) + 421 -> 421
経験値詳細 access:421 skill:0 link:0
経験値追加 siira 0(current) + 0 -> 0
経験値詳細 access:0 skill:0 link:0
スキル評価イベントの開始
seria 幸せの黄色い検測
確率計算は無視されます mode: force
スキルが発動できます 確率:50%
検測開始しま～す HP+80
スキル評価イベントの終了
しいらのHP: 143
```
</details>