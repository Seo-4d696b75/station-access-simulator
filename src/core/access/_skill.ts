import { copy, Denco, formatPercent, getSide, random } from "../../";
import { assert, Context } from "../context";
import { isSkillActive, Skill } from "../skill";
import { withSkill } from "../skill/property";
import { AccessDamageATK, AccessDamageDEF, AccessDamageFixed, AccessSkillTrigger, AccessSkillTriggerState, SkillTriggerCallbacks, WithAccessPosition } from "../skill/trigger";
import { ReadonlyState } from "../state";
import { addScoreExpBoost } from "./score";
import { AccessDencoState, AccessSide, AccessState } from "./state";


/**
 * 指定したでんこのスキルが発動済みか確認する
 * 
 * @param state 
 * @param denco 
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
export function hasSkillTriggered(state: ReadonlyState<{ skillTriggers: AccessSkillTriggerState[] }>, which: AccessSide, denco: ReadonlyState<Denco> | string): boolean {
  return getSkillTrigger(state, which, denco).some(e => e.triggered)
}

export function hasSkillInvalidated(state: ReadonlyState<{ skillTriggers: AccessSkillTriggerState[] }>, which: AccessSide, denco: ReadonlyState<Denco> | string): boolean {
  return getSkillTrigger(state, which, denco).some(e => e.invalidated)
}

export function getSkillTrigger(state: ReadonlyState<{ skillTriggers: AccessSkillTriggerState[] }>, which: AccessSide, denco: ReadonlyState<Denco> | string): AccessSkillTriggerState[] {
  const predicate = (d: ReadonlyState<Denco>) => {
    return typeof denco === "object"
      ? d.numbering === denco.numbering
      : denco.match(/^[a-z]+$/)
        ? d.name === denco
        : d.numbering === denco
  }
  return state.skillTriggers
    .filter(t => t.denco.which === which && predicate(t.denco))
}

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

  const afterTrigger: AccessSkillTriggerState[] = []

  // 発動判定は各編成内で一括で行う
  // 同編成内の同一stepで発動するスキルは違いに干渉しない
  const indices = (
    carIndices ?? side.formation.map(d => d.carIndex)
  )
  indices
    .map(i => side.formation[i])
    .forEach(denco => {
      const trigger = invokeSkillTriggerCallback(context, state, denco, callbackKey)
      if (!trigger) return

      // スキル発動の有無（確率・無効化）を判定
      const t = checkAccessSkillTrigger(context, denco, state.skillTriggers, trigger)

      // スキル発動による効果の反映
      if (t.triggered) {
        state.skillTriggers.push(t)
        // 他スキルの発動で状態が変化する場合があるので毎度stateから参照
        const d = getSide(state, which).formation[t.denco.carIndex]
        state = triggerAccessSkillEffect(context, state, d, t)
      } else {
        // 無効化スキルなど発動対象未定の場合
        // 同編成内で互いに干渉にしない
        afterTrigger.push(t)
      }
    })

  state.skillTriggers.push(...afterTrigger)

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

  //const d = copy.AccessDencoState(denco)
  //const skill = d.skill
  //assert(skill.type === "possess")
  //const active = withSkill(d, skill, denco.carIndex)
  const skill = denco.skill
  assert(skill.type === "possess")

  const state: AccessSkillTriggerState = {
    denco: {
      ...copy.Denco(denco),
      carIndex: denco.carIndex,
      who: denco.who,
      which: denco.which,
    },
    ...trigger,
    boostedProbability: 0,
    canTrigger: false,
    invalidated: false,
    triggered: false,
    skillName: skill.name,
  }

  // 確率・無効化を考慮して発動有無を計算

  // スキル無効化の影響を確認
  if (!checkSkillInvalidated(context, triggered, denco, skill)) {
    state.invalidated = true
    return state
  }

  // 発動確率の確認
  if (!checkSkillProbability(context, triggered, state)) {
    return state
  }

  // 発動判定をパス
  state.canTrigger = true

  // 各発動効果の有無を計算
  switch (state.type) {
    case "probability_boost":
    case "invalidate_skill":
      // 対象のスキルが存在するがまだ分からない
      state.triggered = false
      break
    case "damage_atk":
    case "damage_def":
    case "damage_fixed":
      // ダメージの増減（のスキル効果）が無効化される場合もある
      const canTrigger = checkAccessDamageInvalidate(context, triggered, state, denco, skill)
      state.triggered = canTrigger
      state.invalidated = !canTrigger
      break
    default:
      state.triggered = true
      break
  }

  return state
}

function triggerAccessSkillEffect(
  context: Context,
  state: AccessState,
  d: ReadonlyState<AccessDencoState>,
  trigger: ReadonlyState<AccessSkillTriggerState>,
): AccessState {

  const sideName = (d.which === "offense") ? "攻撃側" : "守備側"
  const skill = d.skill
  assert(skill.type === "possess")

  if (!trigger.triggered) return state

  // 各発動効果の反映
  context.log.log(`スキル効果が発動(${sideName}) name:${d.firstName}(${d.numbering}) skill:${skill.name}(type:${trigger.type})`)

  switch (trigger.type) {
    case "pink_check":
      context.log.log(`フットバース状態を有効化します`)
      state.pinkMode = state.pinkMode || trigger.enable
      break
    case "score_delivery":
      getSide(state, d.which).score.skill += trigger.score
      break
    case "exp_delivery":
      // 両編成を全員確認
      [
        ...state.offense.formation,
        ...(state.defense?.formation ?? [])
      ].forEach(d => {
        const exp = trigger.exp(d)
        d.exp.skill += exp
      })
      break
    case "score_boost":
      const dst = getSide(state, d.which).scorePercent
      addScoreExpBoost(dst, trigger.scoreBoost)
      break
    case "exp_boost":
      // 両編成を全員確認
      [
        ...state.offense.formation,
        ...(state.defense?.formation ?? [])
      ].forEach(d => {
        const boost = trigger.expBoost(d)
        if (boost) {
          addScoreExpBoost(d.expPercent, boost)
        }
      })
      break
    case "damage_atk":
      context.log.log(`ATK${formatPercent(trigger.percent)}`)
      state.attackPercent += trigger.percent
      break
    case "damage_def":
      context.log.log(`DEF${formatPercent(trigger.percent)}`)
      state.defendPercent += trigger.percent
      break
    case "damage_special":
      context.log.log(`damage calc: ${JSON.stringify(trigger.damageCalc)}`)
      state.damageBase = trigger.damageCalc
      break
    case "damage_fixed":
      state.damageFixed += trigger.damage
      break
    case "after_recipe":
      state = trigger.recipe(state) ?? state
      break
    default:
      assert(false, "expected unreachable")
  }

  // 付随的なスキル効果の反映
  if (trigger.sideEffect) {
    state = trigger.sideEffect(state) ?? state
  }

  return state
}

function checkAccessDamageInvalidate(
  context: Context,
  triggered: AccessSkillTriggerState[],
  trigger: ReadonlyState<AccessDamageATK | AccessDamageDEF | AccessDamageFixed>,
  d: ReadonlyState<WithAccessPosition<Denco>>,
  skill: ReadonlyState<Skill>,
): boolean {

  const invalidated = triggered
    .filter(t => t.canTrigger)
    .some(t => {
      if (t.type === "invalidate_damage" && t.isTarget(d, trigger)) {
        t.triggered = true
        context.log.log(`スキル効果（ダメージ増減）が無効化されました`)
        context.log.log(`  無効化スキル；${t.denco.firstName} ${t.skillName}`)
        context.log.log(`  無効化の対象：${d.firstName} ${skill.name}`)
        return true
      }
      return false
    })

  return !invalidated
}

function checkSkillInvalidated(
  context: Context,
  triggered: AccessSkillTriggerState[],
  d: ReadonlyState<WithAccessPosition<Denco>>,
  skill: ReadonlyState<Skill>,
): boolean {
  const invalidated = triggered
    .filter(t => t.canTrigger)
    .some(t => {
      if (t.type === "invalidate_skill" && t.isTarget(d)) {
        // 無効化の発動を記録
        t.triggered = true
        context.log.log(`スキル発動が無効化されました`)
        context.log.log(`  無効化スキル；${t.denco.firstName} ${t.skillName}`)
        context.log.log(`  無効化の対象：${d.firstName} ${skill.name}`)
        return true
      }
      return false
    })
  return !invalidated
}



function checkSkillProbability(
  context: Context,
  triggered: AccessSkillTriggerState[],
  trigger: AccessSkillTriggerState,
): boolean {
  // 発動確率の読み出し
  let percent = Math.max(0, Math.min(trigger.probability, 100))
  trigger.boostedProbability = percent


  // 確率補正のスキル自体の発動確率は100%を前提
  assert(trigger.type !== "probability_boost" || percent === 100)

  // 確率補正不要な場合
  if (percent >= 100) return true
  if (percent <= 0) return false

  // 確率補正の計算
  const boost = triggered
    .filter(t => t.canTrigger && t.denco.which === trigger.denco.which)
    .map(t => {
      if (t.type === "probability_boost") {
        assert(t.percent > 0)
        context.log.log(`確率補正：+${t.percent}% by ${t.denco.firstName} ${t.skillName}`)
        // 補正相手の発動の如何を問わず確率補正のスキル効果は発動した扱いになる
        t.triggered = true
        return t.percent
      }
      return 0
    })
    .reduce((a, b) => a + b, 0)

  if (boost > 0) {
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