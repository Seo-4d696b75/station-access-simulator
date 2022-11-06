import moment from "moment-timezone"
import { Context, TIME_FORMAT } from "../context"
import { DencoState } from "../denco"
import { copyState, copyStateTo } from "../state"
import { UserState } from "../user"


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
  switch (skill.state.transition) {
    case "always": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "active",
          transition: "always",
          data: undefined,
        }
        result = true
      }
      break
    }
    case "manual": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "idle",
          transition: "manual",
          data: undefined
        }
        result = true
      }
      result = refreshTimeout(context, state, idx) || result
      break
    }
    case "manual-condition": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          transition: "manual-condition",
          data: undefined
        }
        result = true
      }
      if (skill.state.type === "idle" || skill.state.type === "unable") {
        const predicate = skill.canEnabled
        if (!predicate) {
          context.log.error("関数#canEnabled が未定義です type:manual-condition")
          throw Error()
        }
        let self = {
          ...denco,
          carIndex: idx,
          skill: skill,
        }
        const enable = predicate(context, state, self)
        if (enable && skill.state.type === "unable") {
          context.log.log(`スキル状態の変更：${denco.name} unable -> idle`)
          skill.state = {
            type: "idle",
            transition: "manual-condition",
            data: undefined
          }
          result = true
        } else if (!enable && skill.state.type === "idle") {
          context.log.log(`スキル状態の変更：${denco.name} idle -> unable`)
          skill.state = {
            type: "unable",
            transition: "manual-condition",
            data: undefined
          }
          result = true
        }
        break
      } else {
        result = refreshTimeout(context, state, idx) || result
        break
      }
    }
    case "auto": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          transition: "auto",
          data: undefined
        }
        result = true
      }
      result = refreshTimeout(context, state, idx) || result
      break
    }
    case "auto-condition": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          transition: "auto-condition",
          data: undefined
        }
        result = true
      }
      // スキル状態の確認・更新
      const predicate = skill.canActivated
      if (!predicate) {
        context.log.error("関数#canActivated が未定義です type:auto-condition")
        throw Error()
      }
      let self = {
        ...denco,
        carIndex: idx,
        skill: skill,
      }
      const active = predicate(context, state, self)
      if (active && skill.state.type === "unable") {
        context.log.log(`スキル状態の変更：${denco.name} unable -> active`)
        skill.state = {
          type: "active",
          transition: "auto-condition",
          data: undefined
        }
        result = true
        const callback = skill.onActivated
        if (callback) {
          // 更新したスキル状態をコピー
          self = {
            ...copyState<DencoState>(denco),
            carIndex: idx,
            skill: skill,
          }
          const next = callback(context, state, self)
          if (next) copyStateTo(next, state)
        }
      } else if (!active && skill.state.type === "active") {
        context.log.log(`スキル状態の変更：${denco.name} active -> unable`)
        skill.state = {
          type: "unable",
          transition: "auto-condition",
          data: undefined
        }
        result = true
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
  let result = false
  if (skill.state.type === "active") {
    const data = skill.state.data
    if (data && data.activeTimeout <= time) {
      context.log.log(`スキル状態の変更：${denco.name} active -> cooldown (timeout:${moment(data.activeTimeout).format(TIME_FORMAT)})`)
      skill.state = {
        type: "cooldown",
        transition: skill.state.transition,
        data: {
          cooldownTimeout: data.cooldownTimeout
        }
      }
      result = true
    }
  }
  if (skill.state.type === "cooldown") {
    const data = skill.state.data
    if (data.cooldownTimeout <= time) {
      switch (skill.state.transition) {
        case "manual": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> idle (timeout:${moment(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.state = {
            type: "idle",
            transition: "manual",
            data: undefined
          }
          result = true
          break
        }
        case "manual-condition": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${moment(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.state = {
            type: "unable",
            transition: "manual-condition",
            data: undefined
          }
          // check unable <=> idle
          result = refreshSkillStateOne(context, state, idx) || result
          break
        }
        case "auto": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${moment(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.state = {
            type: "unable",
            transition: "auto",
            data: undefined
          }
          result = true
          break
        }
      }
    }
  }
  return result
}