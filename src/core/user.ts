import { copyDencoState, DencoState } from "./denco";
import { Event } from "./event";

export interface User {
  name: string
}

export interface UserState extends User {

  /**
   * 現在の編成状態
   */
  formation: DencoState[]

  /**
   * タイムライン上に表示されるイベント一覧
   */
  event: Event[]
}

export interface DencoTargetedUserState extends UserState {

  /**
   * 主体となるでんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number
}

export function initUser(userName: string, formation?: DencoState[]): UserState {
  if (!formation) formation = []
  //TODO call skill's onFormationChanged
  return {
    name: userName,
    formation: formation,
    event: []
  }
}

export function changeFormation(current: UserState, formation: DencoState[]): UserState {
  //TODO call skill's onFormationChanged
  return {
    ...current,
    event: Array.from(current.event),
    formation: Array.from(formation)
  }
}

export function copyUserState(state: UserState): UserState {
  return {
    ...state,
    formation: Array.from(state.formation).map(d => copyDencoState(d)),
  }
}

export function copyDencoUserState(state: DencoTargetedUserState): DencoTargetedUserState {
  return {
    ...state,
    formation: Array.from(state.formation).map(d => copyDencoState(d)),
  }
}