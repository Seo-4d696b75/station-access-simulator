import { Context, withFixedClock } from "../context"
import { DencoState } from "../denco"
import { copyState, ReadonlyState } from "../state"
import { UserState } from "../user"
import { Skill } from "./holder"
import { SkillPropertyReader } from "./property"
import { refreshSkillState } from "./refresh"
import { SkillActiveTimeout } from "./transition"

/**
 * スキル状態を`active`へ遷移させる
 * 
 * この操作が許可されるスキル状態と遷移タイプは次のとおりです
 * - タイプ`manual`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`auto`のスキル状態を`unable > active`へ遷移させる
 * 
 * 遷移タイプ`auto`の場合、スキル自身が`unable > active`の遷移を制御するため使用します.
 * ユーザが直接呼び出す必要はありません. 
 * 
 * @param current 現在の状態
 * @returns `active`へ遷移した新しい状態
 */
export const activateSkill = (context: Context, current: ReadonlyState<UserState>, ...carIndex: number[]): UserState => withFixedClock(context, () => {
  return carIndex.reduce((state, idx) => activateSkillOne(context, state, idx), copyState<UserState>(current))
})

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

function activateSkillAndCallback(context: Context, state: UserState, d: DencoState, skill: Skill, transition: "manual" | "manual-condition" | "auto", carIndex: number): UserState {
  context.log.log(`スキル状態の変更：${d.name} ${skill.transition.state} -> active`)
  let self = {
    ...d,
    carIndex: carIndex,
    skill: skill,
  }
  skill.transition = {
    state: "active",
    type: transition,
    data: getSkillActiveTimeout(context, d, skill)
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

function getSkillActiveTimeout(context: Context, d: ReadonlyState<DencoState>, skill: ReadonlyState<Skill>): SkillActiveTimeout | undefined {
  const strategy = skill.deactivate
  if (!strategy) {
    context.log.error(`スキル状態をactiveから更新する方法が定義されていません denco: ${d.name} deactivate: undefined`)
  }
  switch (strategy) {
    case "default_timeout": {
      const reader = new SkillPropertyReader(skill.property, d.film)
      const active = reader.readNumber("active")
      const cooldown = reader.readNumber("cooldown")
      return {
        activatedAt: context.currentTime,
        activeTimeout: context.currentTime + active * 1000,
        cooldownTimeout: context.currentTime + (active + cooldown) * 1000,
      }
    }
    case "self_deactivate": {
      return undefined
    }
  }
}

/**
 * スキル状態を`cooldown`へ遷移させる
 * 
 * ### 想定される用途
 * **スキル自身が`active => cooldown`の遷移タイミングを制御するのに使用します**
 * 
 * ユーザが直接呼び出す必要はありません. 
 * 
 * ### 有効な操作
 * 
 * {@link SkillLogic deactivate}において`"self_deactivate"`を指定していること！
 * それ以外の場合では`active => cooldown`の状態遷移は時間経過で制御されるため、
 * `deactivateSkill`の呼び出しは例外を投げます
 * 
 * この操作が許可されるスキル状態と遷移タイプは次のとおりです
 * - タイプ`manual`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`auto`のスキル状態を`active > cooldown`へ遷移させる
 * 
 * @param current 現在の状態
 * @returns `cooldown`へ遷移した新しい状態
 */
export const deactivateSkill = (context: Context, current: ReadonlyState<UserState>, ...carIndex: number[]): UserState => withFixedClock(context, () => {
  const state = copyState<UserState>(current)
  carIndex.forEach(idx => deactivateSkillOne(context, state, idx))
  return state
})

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
        const strategy = skill.deactivate
        if (strategy !== "self_deactivate") {
          context.log.error(`スキル状態の変更方法が不正です denco: ${d.name} deactivate: ${strategy} != 'self_deactivate'`)
        }
        const reader = new SkillPropertyReader(skill.property, d.film)
        const cooldown = reader.readNumber("cooldown")
        const timeout = {
          cooldownTimeout: context.currentTime + cooldown * 1000,
        }
        skill.transition = {
          state: "cooldown",
          type: skill.transition.type,
          data: timeout
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