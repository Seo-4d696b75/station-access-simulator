import dayjs from 'dayjs';
import { Context } from "../context";
import { DencoState } from "../denco";
import { copyState, ReadonlyState } from "../state";
import { UserProperty } from "./property";
import { refreshUserState } from "./refresh";
import { UserState } from "./state";

export function getTargetDenco<T>(state: { formation: readonly T[], carIndex: number }): T {
  return state.formation[state.carIndex]
}

export function initUser(context: Context, userName: string, formation?: ReadonlyState<DencoState[]>, property?: Partial<UserProperty>): UserState {
  if (!formation) formation = []
  const date = dayjs(context.currentTime)
    .millisecond(0)
    .second(0)
    .minute(0)
    .add(1, "h")
  return changeFormation(context, {
    user: {
      ...property,
      name: userName,
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
