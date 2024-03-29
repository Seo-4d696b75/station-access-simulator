import dayjs from "dayjs"
import { copy, merge } from "../../"
import { Context } from "../context"
import { TIME_FORMAT } from "../date"
import { UserState } from "../user"
import { withSkill } from "./property"


/**
 * スキル状態の変化を調べて更新する（破壊的）
 * 
 * 以下の状態に依存する`Skill#state`の遷移を調べる
 * - `SkillActiveTimeout` 現在時刻に依存：指定時刻を過ぎたら`cooldown`へ遷移
 * - `SkillCooldownTimeout` 現在時刻に依存：指定時刻を過ぎたら`idle/unable`へ遷移
 * - 遷移タイプ`auto-condition` スキル状態自体が編成状態に依存
 * 
 * スキル状態の整合性も同時に確認する
 * @param state 現在の状態
 */
export function refreshSkillState(context: Context, state: UserState) {
  const indices = state.formation.map((_, idx) => idx)
  /* 
  更新差分が無くなるまで繰り返す 
  でんこによってはスキル状態の決定が他でんこのスキル状態に依存する場合がある
  そのため編成順序（=処理の順序）次第では正しく更新できないおそれあり
  */
  let anyChange = true
  while (anyChange) {
    anyChange = indices.some(idx => refreshSkillStateOne(context, state, idx))
  }
}

/**
 * 指定した編成位置のでんこスキル状態を更新する（破壊的）
 * @param context 
 * @param state 
 * @param idx 
 * @returns true if any change, or false
 */
export function refreshSkillStateOne(context: Context, state: UserState, idx: number): boolean {
  const denco = state.formation[idx]
  if (denco.skill.type !== "possess") {
    return false
  }
  let result: boolean = false
  const skill = denco.skill
  switch (skill.transitionType) {
    case "always": {
      if (skill.transition.state === "not_init") {
        skill.transition = {
          state: "active",
          data: undefined,
        }
        result = true
      }
      break
    }
    case "manual": {
      if (skill.transition.state === "not_init") {
        skill.transition = {
          state: "idle",
          data: undefined
        }
        result = true
      }
      result = refreshTimeout(context, state, idx) || result
      break
    }
    case "manual-condition": {
      const current = skill.transition.state
      if (current === "idle" || current === "unable" || current === "not_init") {
        const active = withSkill(copy.DencoState(denco), skill, idx)
        const enable = skill.canEnabled(context, state, active)
        if (enable && current !== "idle") {
          context.log.log(`スキル状態の変更：${denco.name} ${current} -> idle`)
          skill.transition = {
            state: "idle",
            data: undefined
          }
          result = true
        } else if (!enable && current !== "unable") {
          context.log.log(`スキル状態の変更：${denco.name} ${current} -> unable`)
          skill.transition = {
            state: "unable",
            data: undefined
          }
          result = true
          callbackOnUnable(context, state, idx)
        }
        break
      } else {
        result = refreshTimeout(context, state, idx) || result
        break
      }
    }
    case "auto": {
      if (skill.transition.state === "not_init") {
        skill.transition = {
          state: "unable",
          data: undefined
        }
        result = true
        callbackOnUnable(context, state, idx)
      }
      result = refreshTimeout(context, state, idx) || result
      break
    }
    case "auto-condition": {
      // スキル状態の確認・更新
      const current = skill.transition.state
      const self = withSkill(copy.DencoState(denco), skill, idx)
      const active = skill.canActivated(context, state, self)
      if (active && current !== "active") {
        context.log.log(`スキル状態の変更：${denco.name} ${current} -> active`)
        skill.transition = {
          state: "active",
          data: undefined
        }
        // カスタムデータの初期化
        skill.data.clear()
        result = true
        if (skill.onActivated) {
          const self = withSkill(copy.DencoState(denco), skill, idx)
          const next = skill.onActivated(context, state, self)
          if (next) merge.UserState(state, next)
        }
      } else if (!active && current !== "unable") {
        context.log.log(`スキル状態の変更：${denco.name} ${current} -> unable`)
        skill.transition = {
          state: "unable",
          data: undefined
        }
        result = true
        callbackOnUnable(context, state, idx)
      }
      break
    }
  }
  return result
}

/**
 * 指定時間に応じたスキル状態の更新を行う
 * @param context 
 * @param state 
 * @param idx 
 * @returns true if any change
 */
function refreshTimeout(context: Context, state: UserState, idx: number): boolean {
  const time = context.currentTime
  const denco = state.formation[idx]
  const skill = denco.skill
  if (skill.type !== "possess") return false
  if (skill.transitionType !== "manual" && skill.transitionType !== "manual-condition" && skill.transitionType !== "auto") return false
  let result = false
  if (skill.transition.state === "active") {
    const data = skill.transition.data
    if (data && data.activeTimeout <= time) {
      context.log.log(`スキル状態の変更：${denco.name} active -> cooldown (timeout:${dayjs.tz(data.activeTimeout).format(TIME_FORMAT)})`)
      skill.transition = {
        state: "cooldown",
        data: {
          cooldownTimeout: data.cooldownTimeout,
          cooldownDuration: data.cooldownDuration,
        }
      }
      result = true
      // callback
      if (skill.onCooldown) {
        const self = withSkill(copy.DencoState(denco), skill, idx)
        const next = skill.onCooldown(context, state, self)
        if (next) merge.UserState(state, next)
      }
    }
  }
  if (skill.transition.state === "cooldown") {
    const data = skill.transition.data
    if (data.cooldownTimeout <= time) {
      switch (skill.transitionType) {
        case "manual": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> idle (timeout:${dayjs.tz(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.transition = {
            state: "idle",
            data: undefined
          }
          result = true
          break
        }
        case "manual-condition": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${dayjs.tz(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.transition = {
            state: "not_init",
            data: undefined
          }
          // check unable <=> idle
          result = refreshSkillStateOne(context, state, idx) || result
          break
        }
        case "auto": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${dayjs.tz(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.transition = {
            state: "unable",
            data: undefined
          }
          callbackOnUnable(context, state, idx)
          result = true
          break
        }
      }
    }
  }
  return result
}

function callbackOnUnable(context: Context, state: UserState, idx: number) {
  const denco = state.formation[idx]
  const skill = denco.skill
  if (skill.type !== "possess") return
  if (skill.transitionType === "manual" || skill.transitionType === "always") return
  if (skill.onUnable) {
    const self = withSkill(copy.DencoState(denco), skill, idx)
    const next = skill.onUnable(context, state, self)
    if (next) merge.UserState(state, next)
  }
}