import { AccessDencoState, AccessEvaluateStep, AccessSideState, AccessSkillRecipe, AccessSkillTrigger, AccessState, filterActiveSkill } from ".."
import { Context } from "../../context"
import { Denco } from "../../denco"
import { random } from "../../random"
import { ActiveSkill } from "../../skill"
import { copyState, ReadonlyState } from "../../state"

/**
 * 各段階でスキルを評価する
 * @param context 
 * @param current 現在の状態
 * @param step どの段階を評価するか
 * @returns 新しい状態
 */
export function evaluateSkillAt(context: Context, current: ReadonlyState<AccessState>, step: AccessEvaluateStep): AccessState {
  let state = copyState<AccessState>(current)
  // 編成順に スキル発動有無の確認 > 発動による状態の更新 
  // ただしアクティブなスキルの確認は初めに一括で行う（同じステップで発動するスキル無効化は互いに影響しない）
  const offenseActive = filterActiveSkill(state.offense.formation)
  const defense = state.defense
  const defenseActive = defense ? filterActiveSkill(defense.formation) : undefined
  offenseActive.forEach(idx => {
    // 他スキルの発動で状態が変化する場合があるので毎度参照してからコピーする
    const d = copyState<AccessDencoState>(state.offense.formation[idx])
    const skill = d.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
      throw Error()
    }
    if (skill.evaluate && (!state.pinkMode || skill.evaluateInPink)) {
      const active = {
        ...d,
        skill: skill,
        skillPropertyReader: skill.property,
      }
      // 状態に依存するスキル発動有無の判定は毎度行う
      const result = skill.evaluate(context, state, step, active)
      const recipe = canSkillEvaluated(context, state, step, active, result)
      if (recipe) {
        markTriggerSkill(state.offense, step, d)
        context.log.log(`スキルが発動(攻撃側) name:${d.name}(${d.numbering}) skill:${skill.name}`)
        state = recipe(state) ?? state
      }
    }
  })
  if (defense && defenseActive) {
    defenseActive.forEach(idx => {
      const d = copyState<AccessDencoState>(defense.formation[idx])
      const skill = d.skill
      if (skill.type !== "possess") {
        context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
        throw Error()
      }
      if (skill.evaluate && (!state.pinkMode || skill.evaluateInPink)) {
        const active = {
          ...copyState<AccessDencoState>(d),
          skill: skill,
          skillPropertyReader: skill.property,
        }
        const result = skill.evaluate(context, state, step, active)
        const recipe = canSkillEvaluated(context, state, step, active, result)
        if (recipe) {
          markTriggerSkill(defense, step, d)
          context.log.log(`スキルが発動(守備側) name:${d.name}(${d.numbering}) skill:${skill.name}`)
          state = recipe(state) ?? state
        }
      }
    })
  }
  return state
}

/**
 * スキルのロジックと発動確率まで総合して発動有無を判定する
 * 
 * 確率計算が発生する場合は確率補正の有無を記録する（破壊的）
 * 
 * @param state 
 * @param d 発動する可能性があるアクティブなスキル
 * @returns 
 */
function canSkillEvaluated(context: Context, state: AccessState, step: AccessEvaluateStep, d: ReadonlyState<AccessDencoState & ActiveSkill>, result: void | AccessSkillTrigger): AccessSkillRecipe | undefined {
  if (typeof result === "undefined") return
  if (typeof result === "function") return result
  let percent = Math.min(result.probability, 100)
  percent = Math.max(percent, 0)
  if (percent >= 100) return result.recipe
  if (percent <= 0) return
  // 上記までは確率に依存せず決定可能

  const boost = d.which === "offense" ? state.offense.probabilityBoostPercent : state.defense?.probabilityBoostPercent
  if (!boost && boost !== 0) {
    context.log.error("存在しない守備側の確率補正計算を実行しようとしました")
    throw Error("defense not set, but try to read probability_boost_percent")
  }
  if (boost !== 0) {
    const v = percent * (1 + boost / 100.0)
    context.log.log(`確率補正: +${boost}% ${percent}% > ${v}%`)
    percent = Math.min(v, 100)
    // 発動の如何を問わず確率補正のスキルは発動した扱いになる
    const defense = state.defense
    if (d.which === "offense") {
      state.offense.probabilityBoosted = true
    } else if (defense) {
      defense.probabilityBoosted = true
    }
  }
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます ${d.name} 確率:${percent}%`)
    return result.recipe
  } else {
    context.log.log(`スキルが発動しませんでした ${d.name} 確率:${percent}%`)
    return
  }
}

function markTriggerSkill(state: AccessSideState, step: AccessEvaluateStep, denco: Denco) {
  const list = state.triggeredSkills
  const idx = list.findIndex(d => d.numbering === denco.numbering)
  if (idx < 0) {
    list.push({
      ...denco,
      step: step
    })
  }
}

/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする（破壊的）
 * 
 * @param d アクセス終了後の状態
 */
export function checkProbabilityBoost(d: AccessSideState) {
  if (!d.probabilityBoosted && d.probabilityBoostPercent !== 0) {
    d.triggeredSkills = d.triggeredSkills.filter(s => s.step !== "probability_check")
  }
}