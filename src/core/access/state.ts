import { DamageCalcState, DamageState, ScoreExpState } from "."
import { UserParam } from "../.."
import { Denco, DencoState } from "../denco"
import { Station } from "../station"

/**
 * アクセスにおけるスキルの評価ステップ
 * 
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
 * 評価される対象スキルは以下の条件を満たすでんこのスキルを編成順に行われる
 * - スキルを保持している
 * - スキルがactive状態
 * - アクセス処理の途中で無効化スキルの影響を受けていない
 */
export type AccessEvaluateStep =
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
  readonly which: AccessSide
  readonly who: AccessWho
  readonly carIndex: number

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
   * このアクセス時に発生する経験値  
   * 
   * `access + skill`の合計値が経験値総量
   * 
   * - アクセス開始時に付与される経験値
   * - リンク成功時に付与される経験値
   * - スキルによる経験値付与
   * - リブートした場合を除くリンク解除時の経験値付与
   * 
   * **アクセスによってリブートしたリンクの経験値は含まない**
   * 
   * 通常はアクセス開始時の攻守ふたりのみ経験値が付与されるが、
   * 反撃・スキルなど編成内他でんこに経験値が付与される場合もある  
   * そのためスコアと異なり経験値はでんこ毎に計算される
   * see: {@link AccessState score}
   */
  exp: ScoreExpState
}


export interface AccessTriggeredSkill extends Denco {
  readonly step: AccessEvaluateStep
}


/**
 * アクセスの攻守ふたりの状態
 */
export interface AccessSideState {
  user: UserParam
  /**
   * 自身側の編成一覧
   */
  formation: AccessDencoState[]

  /**
   * 直接アクセス・被アクセスするでんこの編成内における位置
   */
  carIndex: number

  /**
   * アクセス中にスキルが発動した編成内でんこの一覧
   */
  triggeredSkills: AccessTriggeredSkill[]

  probabilityBoostPercent: number
  probabilityBoosted: boolean

  /**
   * アクセス中に発生したスコア
   * 
   * でんこ毎に計算される経験値と異なりスコアはユーザ単位で計算される
   */
  score: ScoreExpState

  /**
   * アクセス表示用のスコア値
   * 
   * アクセスで発生したスコア（リンクスコア除く） + 守備側のリンクが解除された場合のその駅のリンクスコア
   */
  displayedScore: number

  /**
   * アクセス表示用の経験値値
   * 
    * アクセス・被アクセスするでんこがアクセス中に得た経験値（リンクスコア除く） + 守備側のリンクが解除された場合のその駅のリンクスコア
   */
  displayedExp: number
}

/**
 * アクセス中において攻撃・守備側のどちらの編成か判断する値
 */
export type AccessSide =
  "offense" |
  "defense"


export interface AccessState {
  time: number
  station: Station
  offense: AccessSideState
  defense?: AccessSideState

  depth: number

  /**
   * `damage_common`の段階までにおける被アクセス側のダメージ計算量
   * 
   * `variable + constant`の合計値が計算されたダメージ量
   * 
   * `damage_common, damage_special`のスキル評価後のタイミングで原則次のように計算され値がセットされる  
   * - AP: 攻撃側のAP
   * - ATK,DEF: ダメージ計算時の増減値% {@link attackPercent} {@link defendPercent}  
   * `variable = AP * (100 + ATK - DEF)/100.0 * damageRation, constant = 0`
   * 
   * `damage_fixed`で計算する固定ダメージ値はここには含まれない
   * 個体ダメージもスキップする場合は {@link skipDamageFixed}
   * 
   * ただし`damage_special`のスキル発動による特殊な計算など、
   * `damage_special`の段階までにこの`damageBase`の値が`undefined`以外にセットされた場合は
   * 上記の計算はスキップされる
   */
  damageBase?: DamageCalcState

  /**
   * 固定値で加減算されるダメージ値
   */
  damageFixed: number

  /**
   * `damage_common`の段階までに評価された`ATK`累積値 単位：%
   */
  attackPercent: number

  /**
   * `damage_common`の段階までに評価された`DEF`累積値 単位：%
   */
  defendPercent: number

  /**
   * `damage_common`の直後に計算される基本ダメージにおける倍率
   * 
   * 現状ではでんこ属性による`1.3`の倍率のみ発生する
   */
  damageRatio: number

  linkSuccess: boolean
  linkDisconnected: boolean

  pinkMode: boolean
  pinkItemSet: boolean
  pinkItemUsed: boolean
}