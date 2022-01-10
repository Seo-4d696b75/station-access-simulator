import { copyDencoState, DencoState } from "./denco";
import { Event, LevelupDenco, LevelupEvent } from "./event";
import { refreshSkillState } from "./skill";
import DencoManager from "./dencoManager"

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

export function getTargetDenco(state: DencoTargetedUserState): DencoState {
  return state.formation[state.carIndex]
}

export function initUser(userName: string, formation?: DencoState[]): UserState {
  if (!formation) formation = []
  return changeFormation({
    name: userName,
    formation: [],
    event: []
  }, formation)
}

export function changeFormation(current: UserState, formation: DencoState[]): UserState {
  let state = {
    ...current,
    event: Array.from(current.event),
    formation: Array.from(formation)
  }
  return refreshSkillState(state, Date.now())
}

export function copyUserState(state: UserState): UserState {
  return {
    ...state,
    formation: Array.from(state.formation).map(d => copyDencoState(d)),
    event: Array.from(state.event),
  }
}

export function copyDencoUserState(state: DencoTargetedUserState): DencoTargetedUserState {
  return {
    ...state,
    formation: Array.from(state.formation).map(d => copyDencoState(d)),
    event: Array.from(state.event)
  }
}

/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う
 * @param state 現在の状態
 * @returns 
 */
export function refreshEXPState(state: UserState, time: number): UserState {
  state = copyUserState(state)
  const formation = state.formation
  const nextFormation = DencoManager.checkLevelup(formation)
  formation.forEach((before, idx) => {
    let after = nextFormation[idx]
    if (before.level < after.level) {
      let levelup: LevelupDenco = {
        time: time,
        after: copyDencoState(after),
        before: copyDencoState(before),
      }
      let event: LevelupEvent = {
        type: "levelup",
        data: levelup
      }
      state.event.push(event)
    }
  })
  state.formation = nextFormation
  return state
}