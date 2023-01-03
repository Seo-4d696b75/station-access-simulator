import { copy, merge } from "../../"
import { Context, withFixedClock } from "../context"
import { DencoState } from "../denco"
import { ReadonlyState } from "../state"
import { UserState } from "../user"
import { Skill } from "./holder"
import { SkillPropertyReader, withSkill } from "./property"
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
  const state = copy.UserState(current)
  carIndex.forEach(idx => activateSkillAt(context, state, idx))
  return state
})

/**
 * 指定した位置のでんこのスキル状態をactiveに変更します
 * 
 * see {@link activateSkill}
 * 
 * @param state 現在の状態であり変更が直接書き込まれます
 * @param carIndex 編成内の位置
 */
export function activateSkillAt<T extends UserState>(context: Context, state: T, carIndex: number) {
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
  switch (skill.transitionType) {
    case "manual":
    case "manual-condition": {
      switch (skill.transition.state) {
        case "idle": {
          activateSkillAndCallback(context, state, skill, carIndex)
          return
        }
        case "active": {
          return
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.transition.state},transition:${skill.transitionType})`)
        }
      }
    }
    case "auto": {
      switch (skill.transition.state) {
        case "unable": {
          activateSkillAndCallback(context, state, skill, carIndex)
          return
        }
        case "active": {
          return
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.transition.state},type:auto)`)
        }
      }
    }
    default: {
      context.log.error(`スキル状態をactiveに変更できません type:${skill.transitionType}`)
    }
  }
}

function activateSkillAndCallback<T extends "manual" | "manual-condition" | "auto", U extends UserState>(context: Context, state: U, skill: Skill<T>, carIndex: number) {
  const d = state.formation[carIndex]
  context.log.log(`スキル状態の変更：${d.name} ${skill.transition.state} -> active`)
  skill.transition = {
    state: "active",
    data: getSkillActiveTimeout(context, d, skill)
  }
  // カスタムデータの初期化
  skill.data.clear()
  // callback #onActivated
  if (skill.onActivated) {
    const active = withSkill(copy.DencoState(d), skill, carIndex)
    const next = skill.onActivated(context, state, active)
    if (next) {
      merge.UserState(state, next)
    }
  }
  refreshSkillState(context, state)
}

function getSkillActiveTimeout<T extends "manual" | "manual-condition" | "auto">(context: Context, d: ReadonlyState<DencoState>, skill: ReadonlyState<Skill<T>>): SkillActiveTimeout | undefined {
  const strategy = skill.deactivate
  switch (strategy) {
    case "default_timeout": {
      const reader = new SkillPropertyReader(skill.property, d.film)
      let active = reader.readNumber("active")
      context.assert(active >= 0, `スキル時間が負数です active:${active}[sec]`)
      let cooldown = reader.readNumber("cooldown")
      context.assert(cooldown >= 0, `スキル時間が負数です cooldown:${cooldown}[sec]`)
      const film = d.film
      if (film.type === "film") {
        if (film.skillActiveDuration) {
          let next = Math.max(active + film.skillActiveDuration, 0)
          context.log.log(`スキル時間のフィルム補正 active: ${active} => ${next}[sec]`)
          active = next
        }
        if (film.skillCooldownDuration) {
          let next = Math.max(cooldown + film.skillCooldownDuration, 0)
          context.log.log(`スキル時間のフィルム補正 cooldown: ${cooldown} => ${next}[sec]`)
          cooldown = next
        }
      }
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
  const state = copy.UserState(current)
  carIndex.forEach(idx => deactivateSkillAt(context, state, idx))
  return state
})

/**
 * 指定した位置のでんこのスキル状態をcooldownに変更します
 * 
 * see {@link deactivateSkill}
 * 
 * @param state 現在の状態であり変更が直接書き込まれます
 * @param carIndex 編成内の位置
 */
export function deactivateSkillAt<T extends UserState>(context: Context, state: T, carIndex: number) {
  const d = state.formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません carIndex: ${carIndex}, formation.length: ${state.formation.length}`)
  }
  if (d.skill.type !== "possess") {
    context.log.error(`対象のでんこはスキルを保有していません ${d.name}`)
  }
  const skill = d.skill
  switch (skill.transitionType) {
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
        let cooldown = reader.readNumber("cooldown")
        context.assert(cooldown >= 0, `スキル時間が負数です cooldown:${cooldown}[sec]`)
        const film = d.film
        if (film.type === "film" && film.skillCooldownDuration) {
          let next = Math.max(cooldown + film.skillCooldownDuration, 0)
          context.log.log(`スキル時間のフィルム補正 cooldown: ${cooldown} => ${next}[sec]`)
          cooldown = next
        }
        const timeout = {
          cooldownTimeout: context.currentTime + cooldown * 1000,
        }
        skill.transition = {
          state: "cooldown",
          data: timeout
        }
        context.log.log(`スキル状態の変更：${d.name} active -> cooldown`)
        // callback
        if (skill.onCooldown) {
          const self = withSkill(copy.DencoState(d), skill, carIndex)
          const next = skill.onCooldown(context, state, self)
          if (next) merge.UserState(state, next)
        }
        refreshSkillState(context, state)
        return
      } else {
        context.log.error(`スキル状態をcooldownに変更できません(state:${skill.transition.state})`)
      }
    }
    default: {
      context.log.error(`スキル状態をcooldownに変更できません transition:${skill.transitionType}`)
    }
  }
}