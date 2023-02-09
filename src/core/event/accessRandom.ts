import { copy, merge } from "../../"
import { AccessConfig, startAccess } from "../access"
import { assert, Context, withFixedClock } from "../context"
import { ReadonlyState } from "../state"
import { Station } from "../station"
import { SkillEventState } from "./_skill"

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
      state: state,
      carIndex: state.carIndex
    },
    station: station
  }
  const result = startAccess(context, config)
  // アクセスイベントの確認
  const eventSize = result.offense.event.length
  assert(
    eventSize > 0 &&
    result.offense.event[eventSize - 1].type === "access",
    "access event not found"
  )
  // アクセス処理の反映
  let next = copy.SkillEventState(state)
  // formation: UserState[], queue, eventを更新
  merge.UserState(next, result.offense)
  return next
})