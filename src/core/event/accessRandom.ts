import { copy } from "../../"
import { AccessConfig, startAccess } from "../access"
import { assert, Context, withFixedClock } from "../context"
import { ReadonlyState } from "../state"
import { Station } from "../station"
import { SkillEventState } from "./skill"

/**
 * ランダムな駅にアクセスする
 * @param context 
 * @param state 
 * @returns 
 */
export const accessRandomStation = (context: Context, state: ReadonlyState<SkillEventState>): SkillEventState => withFixedClock(context, () => {
  //TODO ランダム駅の選択
  const station: Station = {
    name: "ランダムな駅",
    nameKana: "らんだむなえき",
    attr: "unknown",
    lines: [
      {
        name: "ランダムな路線"
      }
    ]
  }
  const config: AccessConfig = {
    offense: {
      state: {
        user: state.user,
        formation: state.formation.map(d => copy.DencoState(d)),
        event: [],
        queue: [],
      },
      carIndex: state.carIndex
    },
    station: station
  }
  const result = startAccess(context, config)
  if (result.offense.event.length !== 1) {
    context.log.error(`イベント数が想定外 event:${JSON.stringify(result.offense.event)}`)
  }
  // アクセスイベントのみ選択
  assert(
    result.offense.event.length > 0 &&
    result.offense.event[0].type === "access",
    "access event not found at event[0]"
  )
  const accessEvent = result.offense.event[0]
  // queueは空のはず
  assert(
    result.offense.queue.length === 0,
    "unexpected queue entry added while random access"
  )
  return {
    time: state.time,
    user: state.user,
    formation: result.offense.formation.map((d, idx) => {
      // 編成位置は不変と仮定
      let current = state.formation[idx]
      return {
        ...copy.DencoState(d),
        who: current.who,
        carIndex: current.carIndex,
        skillInvalidated: current.skillInvalidated,
      }
    }),
    carIndex: state.carIndex,
    event: [
      ...state.event.map(e => copy.Event(e)),
      accessEvent,
    ],
    probabilityBoostPercent: state.probabilityBoostPercent,
  }
})