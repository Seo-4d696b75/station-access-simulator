import { Context } from "../context"
import { DencoState } from "../denco"
import { copyState, ReadonlyState } from "../state"
import { UserState } from "../user"
import { Skill } from "./holder"
import { refreshSkillState } from "./refresh"

/**
 * スキル状態を`active`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`auto`のスキル状態を`unable > active`へ遷移させる
 * @param current 現在の状態
 * @returns `active`へ遷移した新しい状態
 */
export function activateSkill(context: Context, current: ReadonlyState<UserState>, ...carIndex: number[]): UserState {
  context = context.fixClock()
  return carIndex.reduce((state, idx) => activateSkillOne(context, state, idx), copyState<UserState>(current))
}

function activateSkillOne(context: Context, state: UserState, carIndex: number): UserState {
  const d = state.formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません carIndex: ${carIndex}, formation.length: ${state.formation.length}`)
  }
  if (d.skill.type !== "possess") {
    context.log.error(`対象のでんこはスキルを保有していません ${d.name}`)
  }
  if (d.skill.transition.state === "not_init") {
    context.log.error(`スキル状態が初期化されていません ${d.name}`)
  }
  const skill = d.skill
  switch (skill.transition.type) {
    case "manual":
    case "manual-condition": {
      switch (skill.transition.state) {
        case "idle": {
          return activateSkillAndCallback(context, state, d, d.skill, skill.transition.type, carIndex)
        }
        case "active": {
          return state
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.transition.state},transition:${skill.transition.type})`)
        }
      }
    }
    case "auto": {
      switch (skill.transition.state) {
        case "unable": {
          return activateSkillAndCallback(context, state, d, d.skill, "auto", carIndex)
        }
        case "active": {
          return state
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.transition.state},type:auto)`)
        }
      }
    }
    default: {
      context.log.error(`スキル状態をactiveに変更できません type:${skill.transition.type}`)
    }
  }
}

function activateSkillAndCallback(context: Context, state: UserState, d: DencoState, skill: Skill & { type: "possess" }, transition: "manual" | "manual-condition" | "auto", carIndex: number): UserState {
  context.log.log(`スキル状態の変更：${d.name} ${skill.transition.state} -> active`)
  let self = {
    ...d,
    carIndex: carIndex,
    skill: skill,
  }
  const timeout = skill.deactivateAt?.(context, state, self)
  skill.transition = {
    state: "active",
    type: transition,
    data: timeout ? {
      ...timeout,
      activatedAt: context.currentTime
    } : undefined,
  }
  // カスタムデータの初期化
  skill.data.clear()
  // callback #onActivated
  const callback = skill.onActivated
  if (callback) {
    // 更新したスキル状態をコピー
    self = {
      ...copyState<DencoState>(d),
      carIndex: carIndex,
      skill: skill,
    }
    state = callback(context, state, self) ?? state
  }
  refreshSkillState(context, state)
  return state
}

/**
 * スキル状態を`cooldown`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`auto`のスキル状態を`active > cooldown`へ遷移させる
 * 
 * ただし、`Skill#deactivateAt`で`active, cooldown`の終了時刻を指定している場合はその指定に従うので
 * この呼び出しはエラーとなる
 * 
 * @param current 現在の状態
 * @returns `cooldown`へ遷移した新しい状態
 */
export function deactivateSkill(context: Context, current: ReadonlyState<UserState>, ...carIndex: number[]): UserState {
  context = context.fixClock()
  const state = copyState<UserState>(current)
  carIndex.forEach(idx => deactivateSkillOne(context, state, idx))
  return state
}

function deactivateSkillOne(context: Context, state: UserState, carIndex: number) {
  const d = state.formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません carIndex: ${carIndex}, formation.length: ${state.formation.length}`)
  }
  if (d.skill.type !== "possess") {
    context.log.error(`対象のでんこはスキルを保有していません ${d.name}`)
  }
  const skill = d.skill
  switch (skill.transition.type) {
    case "manual":
    case "manual-condition":
    case "auto": {
      if (skill.transition.state === "active") {
        if (skill.transition.data) {
          context.log.error(`スキル状態をcooldownに変更できません, active終了時刻が設定済みです: ${JSON.stringify(skill.transition.data)}`)
        }
        const callback = skill.completeCooldownAt
        if (!callback) {
          context.log.error(`スキル状態をcooldownに変更できません, cooldownの終了時刻を指定する関数 completeCooldownAt が未定義です`)
        }
        skill.transition = {
          state: "cooldown",
          type: skill.transition.type,
          data: callback(context, state, {
            ...d,
            carIndex: carIndex,
            skill: skill,
          })
        }
        context.log.log(`スキル状態の変更：${d.name} active -> cooldown`)
        refreshSkillState(context, state)
        return
      } else {
        context.log.error(`スキル状態をcooldownに変更できません(state:${skill.transition.state})`)
      }
    }
    default: {
      context.log.error(`スキル状態をcooldownに変更できません transition:${skill.transition.type}`)
    }
  }
}