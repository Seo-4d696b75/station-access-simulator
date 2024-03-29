import { DamageCalcState, DamageState, ScoreExpState } from "."
import { DencoState } from "../denco"
import { AccessSkillTriggerState } from "../skill/trigger"
import { ReadonlyState } from "../state"
import { Station } from "../station"
import { UserPropertyReader, UserState } from "../user"
import { ScoreExpBoostPercent } from "./score"

/**
 * アクセスにおけるスキルの評価ステップ
 * 
 * 
 * ### 呼び出しの順序
 * 以下の順序の各ステップでスキルを評価する
 * ただし、フットバース利用など特殊な状態で一部ステップはスキップされる場合あがある
 * 
 * - pink_check フットバース状態にするスキル
 * - probability_check スキル発動などに関わる確率の補正
 * - before_access アクセス開始前の処理（スキル無効化など）
 * - start_access アクセス結果に依らない処理（経験値付与など）
 * - damage_common ATK, DEF の増減
 * - damage_special ATK, DEF以外のダメージ計算
 * - damage_fixed 固定ダメージ値のセット
 * - after_damage ダメージ量やリンク成功などアクセス結果に依存する処理
 * 
 * 各ステップは攻撃側→守備側の順序で評価するため、
 * 1. 攻撃側の pink_check
 * 2. 守備側の pink_check
 * 3. 攻撃側の probability_check
 * 4. 守備側の probability_check
 * 5. .....
 * となる
 * 
 * ### 呼び出しの対象
 * 評価される対象スキルは以下の条件を満たすでんこのスキルを編成順に行われる
 * - スキルを保持している
 * - スキルがactive状態
 * - アクセス処理の途中で無効化スキルの影響を受けていない
 */
export type AccessSkillStep =
  "pink_check" |
  "probability_check" |
  "before_access" |
  "start_access" |
  "damage_common" |
  "damage_special" |
  "damage_fixed" |
  "after_damage"

/**
 * アクセス中における各でんこの立ち位置を表す値
 * 
 * - "defense": アクセスを直接受けている（ただひとり、もしくは存在なし）
 * - "offense": アクセスを直接行っている（ただひとり）
 * - "other": "offense, defense"以外の編成内のでんこ
 */
export type AccessWho =
  "offense" |
  "defense" |
  "other"

/**
 * アクセス処理中の両編成の各でんこの状態
 */
export interface AccessDencoState extends DencoState {

  // TODO 共通型を用意する
  readonly which: AccessSide
  readonly who: AccessWho
  readonly carIndex: number

  /**
   * アクセス開始時のレベル
   */
  readonly levelBefore: number

  /**
   * アクセス開始時の最大HP
   */
  readonly maxHpBefore: number

  /**
   * アクセス開始時のHP
   */
  readonly hpBefore: number

  /**
   * アクセス終了時のHP
   * 
   * `hpAfter === 0`の場合は`reboot === true`となり、
   * `currentHP`は最大HPにセットされる
   * 
   * **Note** アクセス完了までの値は未定義
   */
  hpAfter: number

  /**
   * アクセス処理中のHPの変化を直接指定する
   * 
   * このプロパティでHPを変化させるとダメージ量には加算されない  
   * ダメージ量に加算する場合は
   * - アクセス・被アクセスでんこ間のダメージ計算：{@link AccessState}の各種対応するプロパティ
   * - 直接ダメージを加算する：{@link damage}（まりか反撃スキルなど）
   * 
   * 初期値：アクセス開始時のHP {@link hpBefore}
   */
  currentHp: number

  /**
   * アクセス処理中においてスキル無効化の影響によりこのでんこが保有するスキルが無効化されているか
   * 
   * ### スキル無効化のタイミング
   * 原則として`before_access`の段階で発動します. 
   * 無効化対象のでんこに`skillInvalidated = true`のフラグを設定してください
   * 
   * ### 無効化の対象
   * 同じ編成内の無効化スキル同士は互いに干渉しません. 
   * **すべて無効化スキルが発動して効果が反映されます**
   * 
   * (ex.1)同じ編成にactiveなちとせ・まひるが居る場合
   *  - ちとせ・まひる両方のスキルが発動します
   *  - 両編成のサポーター・ecoでんこ全員のスキルが無効化されます
   * 
   * このとき、まひるのスキルによりちとせのスキルも無効化されますが、
   * **既に発動したスキルの効果は消えません** 
   * ちとせのスキルが発動した記録はそのまま、ちとせによって無効化されたサポータのスキルも無効化されたままです
   * 
   * 一方、`start_access`以降の段階で発動するスキルは発動前に無効化されるので発動しません.
   * 
   * ただし、攻守異なる編成内に複数の無効化スキルがいるとき、場合によっては互いの無効化の影響があります
   * 
   * (ex.2)攻撃側編成にactiveなまひる、守備側にちとせが居る場合
   * - 攻撃側・守備側の順序でスキルが発動判定・発動処理されます
   * - 攻撃側のまひるが先に発動してecoのちとせは無効化されます
   * - 守備側のちとせは発動前に無効化され、サポーターの無効化は発動しません
   */
  skillInvalidated: boolean

  /**
   * このアクセスにおいてリブートしたか `hpAfter === 0`と必要十分
   */
  reboot: boolean

  /**
   * アクセスによって発生したダメージ値
   * 攻撃側・フットバースの使用などによりダメージ計算自体が発生しない場合は `undefined`
   * 
   * 通常はアクセス開始時の守備側のみダメージが発生するが、
   * 反撃などで初めの攻撃側や編成内他でんこにダメージが発生する場合もある
   */
  damage?: DamageState

  /**
   * アクセス処理中に獲得する経験値  
   * 
   * `access + skill + link`の合計値が経験値の総量です
   */
  exp: ScoreExpState

  /**
   * アクセス処理中に獲得する経験値の増加量[%]
   */
  expPercent: ScoreExpBoostPercent
}

/**
 * アクセスの攻守ふたりの状態
 */
export interface AccessUserState extends UserState {
  
  user: UserPropertyReader

  /**
   * 自身側の編成一覧
   */
  formation: AccessDencoState[]

  /**
   * 直接アクセス・被アクセスするでんこの編成内における位置
   */
  carIndex: number

  probabilityBoostPercent: number
  probabilityBoosted: boolean

  /**
   * アクセス処理中に発生したスコア
   * 
   * でんこ毎に計算される経験値と異なりスコアはユーザ単位で計算される
   */
  score: ScoreExpState

  /**
   * アクセス処理中に発生したスコアの増加量を指定します
   */
  scorePercent: ScoreExpBoostPercent
}

/**
 * アクセス中において攻撃・守備側のどちらの編成か判断する値
 */
export type AccessSide =
  "offense" |
  "defense"

export function invertAccessSide(which: AccessSide): AccessSide {
  return which === "offense" ? "defense" : "offense"
}

export interface AccessState {
  /**
   * アクセス開始時の時刻
   * 
   * ## 重要
   * アクセス処理中の実際の時間経過によらず、処理中有はすべてこの時刻の値を利用します  
   * 処理中に現れる{@link Context}の`clock`はすべてこの時刻で固定されているので, 
   * {@link Context currentTime}で参照した値と一致します
   */
  time: number

  /**
   * このアクセスが発生したリンクの駅
   * 
   * **参照限定** 編集できません
   */
  readonly station: ReadonlyState<Station>

  /**
   * アクセスする側の編成状態
   */
  offense: AccessUserState

  /**
   * アクセスされる側の編成状態
   * 
   * リンクしたでんこの居ない対象にアクセスした場合は`undefined`
   */
  defense?: AccessUserState

  skillTriggers: AccessSkillTriggerState[]

  /**
   * アクセス処理の呼び出しの深さ
   * 
   * カウンター攻撃などを処理する場合は呼び出しが`depth=2`になります  
   * 現行では`depth>2`の処理は実行せずスキップします
   */
  readonly depth: number

  /**
   * `damage_common, damage_special`の段階までにおける被アクセス側の基本ダメージの計算量
   * 
   * `variable + constant`の合計値が計算されたダメージ量として扱われます
   * 
   * ## 基本ダメージの計算
   * `damage_common, damage_special`のスキル評価後のタイミングでこのプロパティが
   * `undefined`の場合（まだ計算されていない場合）、次のように計算され値がセットされます  
   * - AP: 攻撃側のAP
   * - ATK,DEF: ダメージ計算時の増減値% {@link attackPercent} {@link defendPercent}  
   * `variable = AP * (100 + ATK - DEF)/100.0 * damageRation, constant = 0`
   * 
   * ## スキルによる基本ダメージの指定
   * `damage_special`の段階において、スキルがこのダメージ計算を代行することができます.  
   * （例）ミオ：ダメージの肩代わり  
   * （例）チコ：相手HPと同量のダメージ量に上書き  
   * 
   * `damage_special`の段階までにこのプロパティが`undefined`以外にセットされた場合は
   * 上記の計算をスキップし、指定されたダメージ量をそのまま利用します
   * 
   * 
   * ## 注意
   * - `damage_fixed`で計算する固定ダメージ値はここには含まれません  
   * 固定ダメージはプロパティ{@link damageFixed}に加算してください
   * - `damage_special`の段階までは`undefined`で未計算の場合があります. {@link getAccessDenco}を利用して参照してください
   */
  damageBase?: DamageCalcState

  /**
   * 固定値で加減算されるダメージ値
   * 
   * ## 利用方法
   * `damage_fixed`の段階においてスキル効果内容に応じてプロパティに加算してください
   * - 固定のダメージを与える場合：正数
   * - 固定のダメージを軽減する場合：負数
   * 
   * ## 固定ダメージの計算
   * `damage_fixed`の段階が終了したら`damage_common, damage_special`の段階までに
   * 計算された通常ダメージ量に加算され最終的なダメージを算出します. 
   * ただし、固定ダメージ量の軽減によりダメージ計算が負数になることはありません
   * 
   * `damage = max(baseDamage + fixedDamage, 0)`
   * 
   * ## ダメージ計算の詳細
   * より詳細には、通常ダメージ{@link damageBase}には変更不可なダメージ量が指定される場合があります。  
   * （例）チコのスキルによるダメージはるるのスキルでは軽減不可  
   * `damage = max(baseDamage.variable + fixedDamage, 0) + baseDamage.constant`
   */
  damageFixed: number

  /**
   * `damage_common`の段階までに評価されたATK累積値 単位：%
   * 
   * - ATKを増減するスキル
   * - AKTのフィルム補正
   * 
   * ## 利用方法
   * ATKを増減させるスキルでは、`damage_common`の段階でこのプロパティに値を加算してください  
   * **値を直接代入すると他スキル・フィルム補正が反映されません！**
   */
  attackPercent: number

  /**
   * `damage_common`の段階までに評価されたDEF累積値 単位：%
   * 
   * - DEFを増減するスキル
   * - DEFのフィルム補正
   * 
   * ## 利用方法
   * DEFを増減させるスキルでは、`damage_common`の段階でこのプロパティに値を加算してください  
   * **値を直接代入すると他スキル・フィルム補正が反映されません！**
   */
  defendPercent: number

  /**
   * `damage_common`の直後に計算される基本ダメージにおける倍率
   * 
   * 現状ではでんこ属性による`1.3`の倍率のみ発生する
   */
  damageRatio: number

  /**
   * アクセスする側のリンクが成功したか
   * 
   * 以下すべての条件を満たす場合で`true`です
   * - リンク保持するでんこがリブートorフットバースで相手のリンクが解除される
   * - アクセスしたでんこがリブートしていない
   * 
   * ## 値の有効性
   * - `after_damage`より前：未定義
   * - `after_damage`：`fixed_damage`までの段階で計算されたダメージ（通常＋固定）によって仮決定された結果
   * - アクセス処理終了後：最終的なリンク成否
   * 
   * ## 注意
   * 一旦はリンクを保持する相手をリブートさせリンク成功したがカウンター攻撃の発生で攻撃側がリブートする、
   * など`after_damage`の段階の仮決定から最終結果が変化する場合もあります  
   * （例）まりかのスキル
   */
  linkSuccess: boolean

  /**
   * 被アクセスでんこのリンクが解除されたか
   * 
   * 以下のいずれかの条件を満たす場合で`true`です  
   * - フットバースでリンク解除
   * - ダメージ計算orスキル効果でリンクを保持していたでんこがリブート
   * 
   * ## 値の有効性
   * - `after_damage`より前：未定義
   * - `after_damage`：`fixed_damage`までの段階で計算されたダメージ（通常＋固定）によって仮決定された結果
   * - アクセス処理終了後：最終的な解除結果
   * 
   * 
   * ## 注意
   * {@link linkSuccess}と関係はしますが、完全には対応しません  
   * `linkDisconnected === !linkSuccess`は常には成り立ちません  
   * （例）まりかのスキルでアクセス・被アクセス双方がリブート
   */
  linkDisconnected: boolean

  /**
   * フットバース状態の有無
   * 
   * スキル効果orアイテムの使用
   */
  pinkMode: boolean

  /**
   * フットバース状態にするアイテムのセット有無
   */
  pinkItemSet: boolean

  /**
   * セットされたフットバース状態にするアイテムの消費有無
   */
  pinkItemUsed: boolean
}
