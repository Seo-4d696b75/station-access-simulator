import { copyDencoState, DencoState } from "./denco";
import { Event, LevelupDenco, LevelupEvent } from "./event";
import { refreshSkillState } from "./skill";
import DencoManager from "./dencoManager"
import { Context } from "./context";

type Primitive = number | string | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * 変更不可な状態を表す型
 */
export type ReadonlyState<T> =   T extends Builtin
  ? T
  : { readonly [ key in keyof T]: ReadonlyState<T[key]>}

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

export interface FormationPosition {

  /**
   * 主体となるでんこの編成内のindex  
   * 0 <= carIndex < formation.length
   */
  carIndex: number
}

export function getTargetDenco(state: UserState & FormationPosition): DencoState {
  return state.formation[state.carIndex]
}

export function initUser(context: Context, userName: string, formation?: ReadonlyState<DencoState[]>): UserState {
  if (!formation) formation = []
  return changeFormation(context, {
    name: userName,
    formation: [],
    event: []
  }, formation)
}

export function changeFormation(context: Context, current: UserState, formation: ReadonlyState<DencoState[]>): UserState {
  let state = {
    ...current,
    event: Array.from(current.event),
    formation: Array.from(formation)
  }
  let before = current.formation.map(d => d.name).join(",")
  let after = formation.map(d => d.name).join(",")
  context.log.log(`編成を変更します [${before}] -> [${after}]`)
  return refreshSkillState(context, state, Date.now())
}

export function copyUserState(state: ReadonlyState<UserState>): UserState {
  return {
    ...state,
    formation: Array.from(state.formation).map(d => copyDencoState(d)),
    event: Array.from(state.event),
  }
}

/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う
 * @param state 現在の状態
 * @returns 
 */
export function refreshEXPState(context: Context, state: UserState, time: number): UserState {
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
      context.log.log(`レベルアップ：${after.name} Lv.${before.level}->Lv.${after.level}`)
      context.log.log(`現在の経験値：${after.name} ${after.currentExp}/${after.nextExp}`)
    }
  })
  state.formation = nextFormation
  return state
}