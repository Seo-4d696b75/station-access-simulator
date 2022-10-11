import moment from "moment-timezone";
import { Context } from "../context";
import { DencoState } from "../denco";
import { copyState, ReadonlyState } from "../state";
import { refreshUserState } from "./refresh";
import { UserParam, UserState } from "./type";


export interface FormationPosition {
  /**
   * 主体となるでんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number
}

export function getTargetDenco<T>(state: { formation: readonly T[], carIndex: number }): T {
  return state.formation[state.carIndex]
}

export function initUser(context: Context, userName: string, formation?: ReadonlyState<DencoState[]>, param?: Partial<UserParam>): UserState {
  if (!formation) formation = []
  const date = moment(context.currentTime)
    .millisecond(0)
    .second(0)
    .minute(0)
    .add(1, "h")
  return changeFormation(context, {
    user: {
      name: param?.name ?? userName,
      dailyDistance: param?.dailyDistance ?? 0,
    },
    formation: [],
    event: [],
    queue: [{
      type: "hour_cycle",
      time: date.valueOf(),
      data: undefined,
    }],
  }, formation)
}

export function changeFormation(context: Context, current: ReadonlyState<UserState>, formation: ReadonlyState<DencoState[]>): UserState {
  const state: UserState = {
    ...copyState<UserState>(current),
    event: Array.from(current.event),
    formation: formation.map(d => copyState<DencoState>(d)),
  }
  let before = current.formation.map(d => d.name).join(",")
  let after = formation.map(d => d.name).join(",")
  context.log.log(`編成を変更します [${before}] -> [${after}]`)
  refreshUserState(context, state)
  return state
}
