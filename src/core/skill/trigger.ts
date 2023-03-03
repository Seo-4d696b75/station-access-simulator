import { AccessDencoState, AccessSide, AccessState, AccessWho, DamageCalcState } from "../access"
import { ScoreExpBoostPercent } from "../access/score"
import { Context } from "../context"
import { Denco, DencoState } from "../denco"
import { SkillEventState } from "../event/skill"
import { ReadonlyState } from "../state"
import { WithSkill } from "./logic"

// スキルの発動確率・発動効果を関数から返す時の型
export interface SkillTrigger<T extends string> {
  type: T

  /**
   * スキルの発動確率[%]
   * 
   * 発動確率はフィルム補正の影響を受ける場合があるため、
   * 確率値を直接指定するよりスキルプロパティから読み出す実装をおすすめします
   * 
   * ```js
   * probability: self.skill.property.readNumber("key", 100),
   * ```
   * 
   */
  probability: number
}

export type SkillTriggerState<D extends Denco, T extends SkillTrigger<string>> = T & {
  denco: D
  skillName: string

  /**
   * 確率補正を考慮した発動確率[%]
   * 
   * 確率計算を行う場合に `probability * (1 + ${確率補正%}/100)`の値でセットされます 
   * スキルが無効化`invalidated === true`された場合、確率計算はスキップされ初期値の`0`のままです
   */
  boostedProbability: number

  /**
   * スキルの発動可能性
   * 
   * 確率計算をパス＆無効化されていない
   */
  canTrigger: boolean

  /**
   * 無効化の影響を受けたか
   * 
   * `invalidated === true`ならば`canTrigger === true`
   */
  invalidated: boolean

  /**
   * スキル効果が発動したか
   */
  triggered: boolean

  /**
   * 発動確率の判定失敗時の代替効果（fallback）が発動したか
   */
  fallbackTriggered: boolean
}

export type WithAccessPosition<D extends Denco> = D & {
  which: AccessSide
  who: AccessWho
  carIndex: number
}

export type AccessSkillTriggerState = SkillTriggerState<
  WithAccessPosition<Denco>,
  AccessSkillTrigger
>

export type EventSkillWho = "self" | "other"

export type WithSkillEventPosition<D extends Denco> = D & {
  carIndex: number
  who: EventSkillWho
}

export type EventSkillTriggerState = SkillTriggerState<
  WithSkillEventPosition<DencoState>,
  EventSkillTrigger | SkillProbabilityBoost
>

/**
 * 共通
 */

export interface SkillProbabilityBoost extends SkillTrigger<"probability_boost"> {
  /**
   * 増減させる量を[%]単位で指定
   * 
   * 補正後の確率[%] = 補正前の確率[%] * (1 + percent / 100)
   */
  percent: number
}

/**
 * skill event
 */

export type EventSkillTrigger =
  EventSkillRecipe

export interface EventSkillRecipe extends SkillTrigger<"skill_event"> {
  /**
   * スキル発動時の効果を反映させます
   * 
   * 確率計算（確率補正の考慮あり）・無効化スキルを考慮して発動できる場合のみ実行されます
   * 
   * @param state 現在の状態
   * @returns 現在の状態に直接書き込むか新しい状態変数を返す
   */
  recipe: (state: SkillEventState) => void | SkillEventState

  /**
   * スキル発動に失敗した時の状態変化を指定できます
   * 
   * 確率計算・無効化スキルの判定結果が`false`で`recipe`が実行されない場合は、
   * - `fallbackEffect`が代わりに実行されます
   * - スキル発動の記録は残りません
   * 
   */
  fallbackEffect?: (state: SkillEventState) => void | SkillEventState
}

/*
 * access event
 */


export type AccessSkillTriggerType =
  "pink_check" |
  "probability_boost" |
  "invalidate_skill" |
  "invalidate_damage" |
  "score_delivery" |
  "exp_delivery" |
  "score_boost" |
  "exp_boost" |
  "damage_atk" |
  "damage_def" |
  "damage_special" |
  "damage_fixed" |
  "skill_recipe"

export type AccessSkillTriggerCallback<E extends AccessSkillTrigger> = (context: Context, state: ReadonlyState<AccessState>, self: ReadonlyState<WithSkill<AccessDencoState>>) => E | AccessSkillRecipe | (E | AccessSkillRecipe)[] | void

export interface SkillTriggerCallbacks {
  /**
   * 他のスキルの発動確率を補正する効果をもつスキル発動
   * 
   * @param context  同一のアクセス・イベント処理中は同一のオブジェクトが使用されます
   * @param self 自身の状態
   * @returns 確率補正
   */
  onSkillProbabilityBoost?: (context: Context, self: ReadonlyState<WithSkill<DencoState>>) => SkillProbabilityBoost | void

  /**
   * 相手をフットバース状態に変更するスキル発動
   * 
   * このスキルの発動確率は他スキルの補正を受けません
   */
  onAccessPinkCheck?: AccessSkillTriggerCallback<AccessPinkCheck>

  /**
   * 主に他のスキルを無効化するスキル発動
   * 
   * 無効化の対象を指定する関数`isTarget`を返します
   */
  onAccessBeforeStart?: AccessSkillTriggerCallback<AccessSkillInvalidate | AccessDamageInvalidate>

  /**
   * スコア・経験値の増減などアクセス結果と無関係なスキル発動
   */
  onAccessStart?: AccessSkillTriggerCallback<AccessScoreDelivery | AccessExpDelivery | AccessScoreBoost | AccessExpBoost>

  /**
   * ダメージ計算においてATK,DEFを増減させるスキル発動
   */
  onAccessDamagePercent?: AccessSkillTriggerCallback<AccessDamageATK | AccessDamageDEF>

  /**
   * 特殊なダメージ計算を行うスキル発動
   */
  onAccessDamageSpecial?: AccessSkillTriggerCallback<AccessDamageSpecial>

  /**
   * 固定ダメージを増減させるスキル発動
   */
  onAccessDamageFixed?: AccessSkillTriggerCallback<AccessDamageFixed>

  /**
   * ダメージ計算・リンク結果が決定した後でないと発動できないタイプのスキル発動
   */
  onAccessAfterDamage?: AccessSkillTriggerCallback<AccessScoreDelivery | AccessExpDelivery>
}

export type AccessSkillTrigger =
  SkillProbabilityBoost |
  AccessPinkCheck |
  AccessSkillInvalidate |
  AccessDamageInvalidate |
  AccessScoreDelivery |
  AccessExpDelivery |
  AccessScoreBoost |
  AccessExpBoost |
  AccessDamageATK |
  AccessDamageDEF |
  AccessDamageSpecial |
  AccessDamageFixed |
  AccessSkillRecipe

export type AccessSkillTriggerBase<T extends AccessSkillTriggerType> = SkillTrigger<T> & {
  /**
   * スキル発動時の付随的な効果を指定できます
   * 
   * 各種スキル発動効果の本体が発動（確率判定・無効化スキルを考慮）するとき同時に実行されます
   * 
   * @param state 現在の状態
   * @returns 現在の状態に直接書き込むか新しい状態変数を返す
   */
  sideEffect?: (state: AccessState) => void | AccessState
}

export interface AccessPinkCheck extends AccessSkillTriggerBase<"pink_check"> {
  enable: boolean
}

export interface AccessSkillInvalidate extends AccessSkillTriggerBase<"invalidate_skill"> {
  isTarget: (denco: ReadonlyState<WithAccessPosition<Denco>>) => boolean
}

export interface AccessDamageInvalidate extends AccessSkillTriggerBase<"invalidate_damage"> {
  isTarget: (
    denco: ReadonlyState<WithAccessPosition<Denco>>,
    damage: ReadonlyState<AccessDamageATK | AccessDamageDEF | AccessDamageFixed>
  ) => boolean
}

export interface AccessScoreDelivery extends AccessSkillTriggerBase<"score_delivery"> {
  score: number
}

export interface AccessExpDelivery extends AccessSkillTriggerBase<"exp_delivery"> {
  exp: (denco: ReadonlyState<WithAccessPosition<Denco>>) => number
}

export interface AccessScoreBoost extends AccessSkillTriggerBase<"score_boost"> {
  scoreBoost: ScoreExpBoostPercent
}

export interface AccessExpBoost extends AccessSkillTriggerBase<"exp_boost"> {
  expBoost: (denco: ReadonlyState<WithAccessPosition<Denco>>) => ScoreExpBoostPercent | void
}

export interface AccessDamageATK extends AccessSkillTriggerBase<"damage_atk"> {
  percent: number
}

export interface AccessDamageDEF extends AccessSkillTriggerBase<"damage_def"> {
  percent: number
}

export interface AccessDamageSpecial extends AccessSkillTriggerBase<"damage_special"> {
  damageCalc: DamageCalcState
}

export interface AccessDamageFixed extends AccessSkillTriggerBase<"damage_fixed"> {
  damage: number
}

export interface AccessSkillRecipe extends AccessSkillTriggerBase<"skill_recipe"> {
  /**
   * スキル発動時の効果を反映させます
   * 
   * 確率計算（確率補正の考慮あり）・無効化スキルを考慮して発動できる場合のみ実行されます
   * 
   * @param state 現在の状態
   * @returns 現在の状態に直接書き込むか新しい状態変数を返す
   */
  recipe: (state: AccessState) => void | AccessState

  /**
   * 発動確率の判定に失敗した時のスキル効果
   * 
   * 確率計算（確率補正の考慮あり）の結果が`false`でも`fallbackRecipe`が定義済みの場合は、
   * - `fallbackRecipe`が代わりに実行されます
   * - スキルは発動したと記録します
   * 
   * ただし、無効化スキルの影響を受ける場合は確率判定の如何に関わらず`fallbackRecipe`も実行されません
   */
  fallbackRecipe?: (state: AccessState) => void | AccessState
}

