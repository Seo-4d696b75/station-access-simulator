import { AccessDencoState, AccessSide, AccessState, AccessWho } from "../access"
import { ScoreExpBoostPercent } from "../access/score"
import { assert, Context } from "../context"
import { Denco, DencoState } from "../denco"
import { random } from "../random"
import { ReadonlyState } from "../state"
import { UserState } from "../user"
import { WithSkill } from "./logic"

type SkillTriggerEvent = "access" | "skill"

// スキルの発動確率・発動効果を関数から返す時の型
interface SkillTriggerBase<Effect extends SkillEffect = SkillEffect> {
  probability: number
  effect: Effect | Effect[]
}

// スキルの発動を計算する時の状態型
interface SkillTriggerStateBase<
  D extends Denco,
  Effect extends SkillEffect,
> {
  denco: D
  probability: number
  effect: SkillEffectState<Effect>[]
  boostedProbability: number
  canTrigger: boolean
  invalidated: boolean
  skillName: string
}

// スキルの発動効果を表す
// 発動効果の表現方法はサブクラスに任せるが、共通のtypeを用意
export interface SkillEffect<T extends string = string> {
  type: T
}

// スキルの発動効果の状態
// スキルの発動判定時では最終的に発動するか判断できない場合もある
export type SkillEffectState<E extends SkillEffect> = E & {
  triggered: boolean
  invalidated: boolean
}

export type WithAccessPosition<D extends Denco> = D & {
  which: AccessSide
  who: AccessWho
  carIndex: number
}

export type AccessSkillTriggerState = SkillTriggerStateBase<
  WithAccessPosition<Denco>,
  AccessSkillEffect
>

export type EventSkillWho = "self" | "other"

export type WithSkillEventPosition<D extends Denco> = D & {
  carIndex: number
  who: EventSkillWho
}

export type EventSkillTriggerState = SkillTriggerStateBase<
  WithSkillEventPosition<Denco>,
  EventSkillEffect
>

export type SkillTriggerState = AccessSkillTriggerState | EventSkillTriggerState

export type SkillTrigger = AccessSkillTrigger | EventSkillTrigger

/**
 * 共通
 */

export type SkillProbabilityBoostTrigger = SkillTriggerBase<SkillProbabilityBoost>

export interface SkillProbabilityBoost extends SkillEffect<"probability_boost"> {
  percent: number
}

/**
 * skill event
 */

export type EventSkillTrigger = SkillTriggerBase<EventSkillEffect>

export type EventSkillEffect =
  SkillProbabilityBoost |
  AccessSkillInvalidate |
  EventSkillRecipe

export interface EventSkillRecipe extends SkillEffect<"skill_event"> {
  recipe: (state: UserState) => void | UserState
}

/*
 * access event
 */


export type AccessSkillEffectType =
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
  "damage_fixed" |
  "skill_recipe"

export type AccessSkillTrigger<Effect extends AccessSkillEffect = AccessSkillEffect> = SkillTriggerBase<Effect>

export type AccessSkillTriggerCallback<E extends AccessSkillEffect> = (context: Context, state: ReadonlyState<AccessState>, self: ReadonlyState<WithSkill<AccessDencoState>>) => AccessSkillTrigger<E | AccessSkillRecipe> | void

export interface SkillTriggerCallbacks {
  onSkillProbabilityBoost?: (context: Context, self: ReadonlyState<WithSkill<DencoState>>) => SkillProbabilityBoostTrigger | void
  onAccessPinkCheck?: AccessSkillTriggerCallback<AccessPinkCheck>
  onAccessBeforeStart?: AccessSkillTriggerCallback<AccessSkillInvalidate | AccessDamageInvalidate>
  onAccessStart?: AccessSkillTriggerCallback<AccessScoreDelivery | AccessExpDelivery | AccessScoreBoost | AccessExpBoost>
  onAccessDamagePercent?: AccessSkillTriggerCallback<AccessDamageATK | AccessDamageDEF>
  onAccessDamageSpecial?: AccessSkillTriggerCallback<never>
  onAccessDamageFixed?: AccessSkillTriggerCallback<AccessDamageFixed>
  onAccessAfterDamage?: AccessSkillTriggerCallback<never>
}

export type AccessSkillEffect =
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
  AccessDamageFixed |
  AccessSkillRecipe

export type AccessSkillEffectBase<T extends AccessSkillEffectType> = SkillEffect<T>

export interface AccessPinkCheck extends AccessSkillEffectBase<"pink_check"> {
  enable: boolean
}

export interface AccessSkillInvalidate extends AccessSkillEffectBase<"invalidate_skill"> {
  isTarget: (denco: ReadonlyState<WithSkill<AccessDencoState>>) => boolean
}

export interface AccessDamageInvalidate extends AccessSkillEffectBase<"invalidate_damage"> {
  isTarget: (
    denco: ReadonlyState<WithSkill<AccessDencoState>>,
    damage: ReadonlyState<AccessDamageATK | AccessDamageDEF | AccessDamageFixed>
  ) => boolean
}

export interface AccessScoreDelivery extends AccessSkillEffectBase<"score_delivery"> {
  score: () => number
}

export interface AccessExpDelivery extends AccessSkillEffectBase<"exp_delivery"> {
  exp: (denco: ReadonlyState<AccessDencoState>) => number
}

export interface AccessScoreBoost extends AccessSkillEffectBase<"score_boost"> {
  boost: () => ScoreExpBoostPercent
}

export interface AccessExpBoost extends AccessSkillEffectBase<"exp_boost"> {
  boost: (denco: ReadonlyState<AccessDencoState>) => ScoreExpBoostPercent | void
}

export interface AccessDamageATK extends AccessSkillEffectBase<"damage_atk"> {
  percent: number
}

export interface AccessDamageDEF extends AccessSkillEffectBase<"damage_def"> {
  percent: number
}

export interface AccessDamageFixed extends AccessSkillEffectBase<"damage_fixed"> {
  damage: () => number
}

export interface AccessSkillRecipe extends AccessSkillEffectBase<"skill_recipe"> {
  recipe: (state: AccessState) => void | AccessState
}


export function checkSkillInvalidated(
  context: Context,
  triggered: SkillTriggerState[],
  d: WithSkill<AccessDencoState>,
): boolean {
  const invalidated = triggered
    .filter(t => t.canTrigger)
    .some(t => t.effect.some(e => {
      if (e.type === "invalidate_skill" && e.isTarget(d)) {
        // 無効化の発動を記録
        e.triggered = true
        context.log.log(`スキル発動が無効化されました`)
        context.log.log(`  無効化スキル；${t.denco.firstName} ${t.skillName}`)
        context.log.log(`  無効化の対象：${d.firstName} ${d.skill.name}`)
        return true
      }
      return false
    }))
  return !invalidated
}

export function checkSkillProbability(
  context: Context,
  triggered: SkillTriggerState[],
  trigger: SkillTriggerState,
): boolean {
  // 発動確率の読み出し
  let percent = Math.max(0, Math.min(trigger.probability, 100))
  trigger.boostedProbability = percent


  // 確率補正のスキル自体の発動確率は100%を前提
  trigger.effect.forEach(e => {
    assert(e.type !== "probability_boost" || percent === 100)
  })

  // 確率補正不要な場合
  if (percent >= 100) return true
  if (percent <= 0) return false

  // 確率補正のスキル効果を検索
  const anyBoost = triggered
    .filter(t => t.canTrigger)
    .map(t => t.effect)
    .flat()
    .some(e => e.type === "probability_boost")

  if (anyBoost) {
    // 確率補正の計算
    const boost = triggered
      .filter(t => t.canTrigger)
      .map(t => t.effect.map(e => {
        if (e.type === "probability_boost") {
          context.log.log(`確率補正：+${e.percent}% by ${t.denco.firstName} ${t.skillName}`)
          // 補正相手の発動の如何を問わず確率補正のスキル効果は発動した扱いになる
          e.triggered = true
          return e.percent
        }
        return 0
      }))
      .flat()
      .reduce((a, b) => a + b, 0)
    assert(boost > 0)
    const percentBoosted = Math.min(percent * (1 + boost / 100.0), 100)
    context.log.log(`確率補正（合計）: +${boost}% ${percent}% > ${percentBoosted}%`)
    percent = percentBoosted
    trigger.boostedProbability = percentBoosted
  }

  // 乱数計算
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます ${trigger.denco.name} 確率:${percent}%`)
    return true
  } else {
    context.log.log(`スキルが発動しませんでした ${trigger.denco.name} 確率:${percent}%`)
    return false
  }
}