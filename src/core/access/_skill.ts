import { copy, formatPercent, getSide } from "../../";
import { assert, Context } from "../context";
import { isSkillActive, Skill, WithSkill } from "../skill";
import { withSkill } from "../skill/property";
import { AccessDamageATK, AccessDamageDEF, AccessDamageFixed, AccessSkillTrigger, AccessSkillTriggerState, checkSkillInvalidated, checkSkillProbability, SkillTriggerCallbacks } from "../skill/trigger";
import { ReadonlyState } from "../state";
import { addScoreExpBoost } from "./score";
import { AccessDencoState, AccessSide, AccessState } from "./state";


/**
 * 各段階でスキルを評価する
 * @param context 
 * @param current 現在の状態
 * @param callbackKey どの段階を評価するか
 * @returns 新しい状態
 */
export function triggerAccessSkillAt(
  context: Context,
  current: ReadonlyState<AccessState>,
  callbackKey: keyof SkillTriggerCallbacks,
): AccessState {
  let state = copy.AccessState(current)

  // 攻撃側 > 守備側の順序で発動判定・発動処理を行う
  // ただし、発動判定は各編成内で一括で行う
  // 同編成内のスキル無効化は互いに無効化はしない
  state = triggerSkillOnSide(
    context,
    state,
    "offense",
    callbackKey,
  )
  state = triggerSkillOnSide(
    context,
    state,
    "defense",
    callbackKey,
  )
  return state
}


/**
 * 各段階でスキルを評価する **破壊的**
 * @param context 
 * @param state 現在の状態
 * @param which 攻撃・守備側どちらか
 * @param callbackKey どのコールバックを呼び出すか
 * @returns 新しい状態
 */
export function triggerSkillOnSide(
  context: Context,
  state: AccessState,
  which: AccessSide,
  callbackKey: keyof SkillTriggerCallbacks,
  carIndices?: number[]
): AccessState {
  const side = (which === "offense") ? state.offense : state.defense
  if (!side) return state

  // 発動判定は各編成内で一括で行う
  // 同編成内の同一stepで発動するスキルは違いに干渉しない
  const triggers = (
    carIndices ?? side.formation.map(d => d.carIndex)
  ).map(i => side.formation[i])
    .map(denco => {
      const trigger = invokeSkillTriggerCallback(context, state, denco, callbackKey)
      if (trigger) {
        return checkAccessSkillTrigger(context, denco, state.skillTriggers, trigger)
      } else {
        return null
      }
    }).filter((t): t is AccessSkillTriggerState => !!t)


  // 同編成内の同一stepで発動するスキルは違いに干渉しない
  // 最後にまとめて発動リスト追加
  state.skillTriggers.push(...triggers)
  
  // スキル発動による効果の反映
  triggers.forEach(t => {
    // 他スキルの発動で状態が変化する場合があるので毎度stateから参照
    const d = getSide(state, which).formation[t.denco.carIndex]
    state = triggerAccessSkillEffect(context, state, d, t)
  })

  return state
}

function invokeSkillTriggerCallback(
  context: Context,
  state: ReadonlyState<AccessState>,
  denco: ReadonlyState<AccessDencoState>,
  callbackKey: keyof SkillTriggerCallbacks,
): AccessSkillTrigger | void {
  const skill = denco.skill
  if (!isSkillActive(skill)) return
  if (callbackKey === "onSkillProbabilityBoost") {
    const callback = skill.onSkillProbabilityBoost
    if (callback) {
      const d = copy.DencoState(denco)
      const s = d.skill as Skill
      return callback(
        context,
        withSkill(d, s, denco.carIndex),
      )
    }
  } else {
    const callback = skill[callbackKey]
    if (callback) {
      const d = copy.AccessDencoState(denco)
      const s = d.skill as Skill
      return callback(
        context,
        state,
        withSkill(d, s, d.carIndex)
      )
    }
  }
}


function checkAccessSkillTrigger(
  context: Context,
  denco: ReadonlyState<AccessDencoState>,
  triggered: AccessSkillTriggerState[],
  trigger: AccessSkillTrigger,
): AccessSkillTriggerState {

  const d = copy.AccessDencoState(denco)
  const skill = d.skill
  assert(skill.type === "possess")
  const active = withSkill(d, skill, denco.carIndex)

  const state: AccessSkillTriggerState = {
    denco: {
      ...copy.Denco(denco),
      carIndex: denco.carIndex,
      who: denco.who,
      which: denco.which,
    },
    probability: trigger.probability,
    boostedProbability: 0,
    canTrigger: false,
    invalidated: false,
    skillName: skill.name,
    effect: (
      Array.isArray(trigger.effect)
        ? trigger.effect
        : [trigger.effect]
    ).map(e => ({
      ...e,
      triggered: false,
      invalidated: false,
    }))
  }

  // 確率・無効化を考慮して発動有無を計算

  // スキル無効化の影響を確認
  if (!checkSkillInvalidated(context, triggered, active)) {
    state.invalidated = true
    state.effect.forEach(e => e.invalidated = true)
    return state
  }

  // 発動確率の確認
  if (!checkSkillProbability(context, triggered, state)) {
    return state
  }

  // 発動判定をパス
  state.canTrigger = true

  // 各発動効果の有無を計算
  state.effect.forEach(e => {
    switch (e.type) {
      case "probability_boost":
      case "invalidate_skill":
        // 対象のスキルが存在するがまだ分からない
        e.triggered = false
        break
      case "damage_atk":
      case "damage_def":
      case "damage_fixed":
        // ダメージの増減（のスキル効果）が無効化される場合もある
        const canTrigger = checkAccessDamageInvalidate(context, triggered, e, active)
        e.triggered = canTrigger
        e.invalidated = !canTrigger
        break
      default:
        e.triggered = true
        break
    }
  })
  return state
}

function triggerAccessSkillEffect(
  context: Context,
  state: AccessState,
  d: ReadonlyState<AccessDencoState>,
  trigger: AccessSkillTriggerState,
): AccessState {

  const sideName = (d.which === "offense") ? "攻撃側" : "守備側"
  const skill = d.skill
  assert(skill.type === "possess")

  // 各発動効果の反映
  trigger.effect.forEach(e => {
    if (!e.triggered) return
    context.log.log(`スキル効果が発動(${sideName}) name:${d.firstName}(${d.numbering}) skill:${skill.name}(type:${e.type})`)
    switch (e.type) {
      case "pink_check":
        context.log.log(`フットバース状態を有効化します`)
        state.pinkMode = state.pinkMode || e.enable
        break
      case "score_delivery":
        getSide(state, d.which).score.skill += e.score()
        break
      case "exp_delivery":
        // 両編成を全員確認
        [
          ...state.offense.formation,
          ...(state.defense?.formation ?? [])
        ].forEach(d => {
          const exp = e.exp(d)
          d.exp.skill += exp
        })
        break
      case "score_boost":
        const dst = getSide(state, d.which).scorePercent
        addScoreExpBoost(dst, e.boost())
        break
      case "exp_boost":
        // 両編成を全員確認
        [
          ...state.offense.formation,
          ...(state.defense?.formation ?? [])
        ].forEach(d => {
          const boost = e.boost(d)
          if (boost) {
            addScoreExpBoost(d.expPercent, boost)
          }
        })
        break
      case "damage_atk":
        context.log.log(`ATK${formatPercent(e.percent)}`)
        state.attackPercent += e.percent
        break
      case "damage_def":
        context.log.log(`DEF${formatPercent(e.percent)}`)
        state.defendPercent += e.percent
        break
      case "damage_fixed":
        state.damageFixed += e.damage()
        break
      case "skill_recipe":
        state = e.recipe(state) ?? state
        break
      default:
        assert(false, "expected unreachable")
    }
  })

  return state
}

function checkAccessDamageInvalidate(
  context: Context,
  triggered: AccessSkillTriggerState[],
  effect: ReadonlyState<AccessDamageATK | AccessDamageDEF | AccessDamageFixed>,
  d: WithSkill<AccessDencoState>,
): boolean {

  const invalidated = triggered
    .filter(t => t.canTrigger)
    .some(t => t.effect.some(e => {
      if (e.type === "invalidate_damage" && e.isTarget(d, effect)) {
        e.triggered = true
        context.log.log(`スキル効果（ダメージ増減）が無効化されました`)
        context.log.log(`  無効化スキル；${t.denco.firstName} ${t.skillName}`)
        context.log.log(`  無効化の対象：${d.firstName} ${d.skill.name}`)
        return true
      }
      return false
    }))

  return !invalidated
}