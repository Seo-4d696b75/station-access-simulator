import moment from "moment-timezone"
import { evaluateSkillAtEvent, EventSkillTrigger } from "."
import { Context, TIME_FORMAT } from "../context"
import { Denco, DencoState } from "../denco"
import { copyState, copyStateTo, ReadonlyState } from "../state"
import { UserState } from "../user"

/**
 * 指定した時刻にトリガーされるスキル発動型イベント
 */
export interface SkillEventReservation {
  readonly denco: Denco
  readonly trigger: EventSkillTrigger
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
    throw Error()
  }
  const next = copyState<UserState>(state)
  next.queue.push({
    type: "skill",
    time: time,
    data: {
      denco: denco,
      trigger: trigger
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
    context.log.log(`待機列中のスキル評価イベントが指定時刻になりました time: ${moment(entry.time).format(TIME_FORMAT)} type: ${entry.type}`)
    switch (entry.type) {
      case "skill": {
        const next = evaluateSkillAtEvent(context, state, entry.data.denco, entry.data.trigger)
        copyStateTo<UserState>(next, state)
        break
      }
      case "hour_cycle": {
        const size = state.formation.length
        for (let i = 0; i < size; i++) {
          const d = state.formation[i]
          const skill = d.skill
          if (skill.type !== "possess" || skill.state.type !== "active") continue
          const callback = skill.onHourCycle
          if (!callback) continue
          let self = {
            ...copyState<DencoState>(d),
            carIndex: i,
            skill: skill,
            skillPropertyReader: skill.property,
          }
          const next = callback(context, state, self)
          if (next) copyStateTo<UserState>(next, state)
        }
        // 次のイベント追加
        const date = moment(entry.time).add(1, "h")
        state.queue.push({
          type: "hour_cycle",
          time: date.valueOf(),
          data: undefined
        })
        state.queue.sort((a, b) => a.time - b.time)
        break
      }
    }
    // end event
  }
}
