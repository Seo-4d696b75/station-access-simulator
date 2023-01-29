import { AccessDencoState, AccessSide, AccessState, AccessWho, DamageCalcState } from "../access"
import { ScoreExpBoostPercent } from "../access/score"
import { Context } from "../context"
import { Denco, DencoState } from "../denco"
import { SkillEventState } from "../event/_skill"
import { ReadonlyState } from "../state"
import { WithSkill } from "./logic"

// スキルの発動確率・発動効果を関数から返す時の型
export interface SkillTrigger<T extends string> {
  type: T
  probability: number
}

export type SkillTriggerState<D extends Denco, T extends SkillTrigger<string>> = T & {
  denco: D
  skillName: string

  /**
   * 確率補正を考慮した発動確率[%]
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
  WithSkillEventPosition<Denco>,
  EventSkillTrigger | SkillProbabilityBoost // 確率補正が付随的に発動する
>

/**
 * 共通
 */

export interface SkillProbabilityBoost extends SkillTrigger<"probability_boost"> {
  percent: number
}

/**
 * skill event
 */

export type EventSkillTrigger =
  // SkillProbabilityBoost |
  EventSkillRecipe

export interface EventSkillRecipe extends SkillTrigger<"skill_event"> {
  recipe: (state: SkillEventState) => void | SkillEventState
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

export type AccessSkillTriggerCallback<E extends AccessSkillTrigger> = (context: Context, state: ReadonlyState<AccessState>, self: ReadonlyState<WithSkill<AccessDencoState>>) => E | AccessSkillRecipe | void

export interface SkillTriggerCallbacks {
  onSkillProbabilityBoost?: (context: Context, self: ReadonlyState<WithSkill<DencoState>>) => SkillProbabilityBoost | void
  onAccessPinkCheck?: AccessSkillTriggerCallback<AccessPinkCheck>
  onAccessBeforeStart?: AccessSkillTriggerCallback<AccessSkillInvalidate | AccessDamageInvalidate>
  onAccessStart?: AccessSkillTriggerCallback<AccessScoreDelivery | AccessExpDelivery | AccessScoreBoost | AccessExpBoost>
  onAccessDamagePercent?: AccessSkillTriggerCallback<AccessDamageATK | AccessDamageDEF>
  onAccessDamageSpecial?: AccessSkillTriggerCallback<AccessDamageSpecial>
  onAccessDamageFixed?: AccessSkillTriggerCallback<AccessDamageFixed>
  onAccessAfterDamage?: AccessSkillTriggerCallback<never>
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

export type AccessSkillTriggerBase<T extends AccessSkillTriggerType> = SkillTrigger<T>

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
  recipe: (state: AccessState) => void | AccessState
}

