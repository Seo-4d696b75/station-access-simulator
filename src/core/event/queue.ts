import dayjs from "dayjs"
import { triggerSkillAtEvent } from "."
import { copy, EventSkillTrigger, merge } from "../../"
import { Context } from "../context"
import { TIME_FORMAT } from "../date"
import { Denco } from "../denco"
import { withSkill } from "../skill/property"
import { ReadonlyState } from "../state"
import { UserState } from "../user"

/**
 * 指定した時刻にトリガーされるスキル発動型イベント
 */
export interface SkillEventReservation extends EventSkillTrigger {
  denco: Denco
}

/**
 * スキル発動型イベントを指定時刻に評価するよう待機列に追加する
 * 
 * @param context 
 * @param state 現在の状態
 * @param time スキルが発動する時刻 
 * @param denco だれのスキルが発動するか
 * @param trigger スキル発動の確率計算の方法・発動時の処理
 * @returns 待機列に追加した新しい状態
 */
export function enqueueSkillEvent(context: Context, state: ReadonlyState<UserState>, time: number, denco: Denco, trigger: EventSkillTrigger): UserState {
  const now = context.currentTime.valueOf()
  if (now > time) {
    context.log.error(`現在時刻より前の時刻は指定できません time: ${time}, denco: ${JSON.stringify(denco)}`)
  }
  const next = copy.UserState(state)
  next.queue.push({
    type: "skill",
    time: time,
    data: {
      denco: denco,
      ...trigger,
    }
  })
  next.queue.sort((a, b) => a.time - b.time)
  refreshEventQueue(context, next)
  return next
}


/**
 * 待機列中のイベントの指定時刻を現在時刻に参照して必要なら評価を実行する(破壊的)
 * @param context 現在時刻は`context#clock`を参照する {@see getCurrentTime}
 * @param state 現在の状態 
 * @returns 発動できるイベントが待機列中に存在する場合は評価を実行した新しい状態
 */
export function refreshEventQueue(context: Context, state: UserState) {
  const time = context.currentTime
  while (state.queue.length > 0) {
    const entry = state.queue[0]
    if (time < entry.time) break
    state.queue.splice(0, 1)
    // start event
    context.log.log(`待機列中のスキル評価イベントが指定時刻になりました time: ${dayjs.tz(entry.time).format(TIME_FORMAT)} type: ${entry.type}`)
    switch (entry.type) {
      case "skill": {
        const next = triggerSkillAtEvent(context, state, entry.data.denco, entry.data)
        merge.UserState(state, next)
        break
      }
      case "hour_cycle": {
        const size = state.formation.length
        for (let i = 0; i < size; i++) {
          const d = state.formation[i]
          const skill = d.skill
          if (skill.type !== "possess" || skill.transition.state !== "active") continue
          const callback = skill.onHourCycle
          if (!callback) continue
          const active = withSkill(copy.DencoState(d), skill, i)
          const next = callback(context, state, active)
          if (next) merge.UserState(state, next)
        }
        // 次のイベント追加
        const date = dayjs.tz(entry.time).add(1, "h").valueOf()
        state.queue.push({
          type: "hour_cycle",
          time: date,
          data: undefined
        })
        state.queue.sort((a, b) => a.time - b.time)
        break
      }
    }
    // end event
  }
}
