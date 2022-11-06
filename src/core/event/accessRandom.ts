import { AccessConfig, startAccess } from "../access"
import { Context } from "../context"
import { DencoState } from "../denco"
import { copyState, ReadonlyState } from "../state"
import { Station } from "../station"
import { SkillEventState } from "./skill"

/**
 * ランダムな駅にアクセスする
 * @param context 
 * @param state 
 * @returns 
 */
export function accessRandomStation(context: Context, state: ReadonlyState<SkillEventState>): SkillEventState {
  context = context.fixClock()
  //TODO ランダム駅の選択
  const station: Station = {
    name: "ランダムな駅",
    nameKana: "らんだむなえき",
    attr: "unknown",
  }
  const config: AccessConfig = {
    offense: {
      state: {
        user: state.user,
        formation: state.formation.map(d => copyState<DencoState>(d)),
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
  return {
    time: state.time,
    user: state.user,
    formation: result.offense.formation.map((d, idx) => {
      let current = state.formation[idx]
      return {
        ...copyState<DencoState>(d),
        who: current.who,
        carIndex: current.carIndex,
        skillInvalidated: current.skillInvalidated,
      }
    }),
    carIndex: state.carIndex,
    event: [
      ...state.event,
      result.offense.event[0],
    ],
    probabilityBoostPercent: state.probabilityBoostPercent,
  }
}