import { AccessSide, AccessSideState, AccessState } from "."
import { assert } from "../context"

/**
 * アクセスの守備側が存在するか確認する
 * @param state 
 * @returns 
 */
export function hasDefense(state: AccessState): state is AccessStateWithDefense {
  return !!state.defense
}

export interface AccessStateWithDefense extends AccessState {
  defense: AccessSideState
}

/**
 * アクセスの守備側の状態を取得する
 * @param state 
 * @returns {@link AccessSideState}
 * @throws 守備側が存在しない場合はErrorを投げる
 */
export function getDefense<T>(state: { defense?: T }): T {
  const s = state.defense
  assert(s, "守備側が見つかりません")
  return s
}

/**
 * アクセスにおける編成（攻撃・守備側）を取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定する
 * @throws 存在しない守備側を指定した場合はErrorを投げる
 * @returns `AccessDencoState[]`
 */
export function getFormation<T>(state: { offense: { formation: T }, defense?: { formation: T } }, which: AccessSide): T {
  if (which === "offense") {
    return state.offense.formation
  } else {
    return getDefense(state).formation
  }
}

type AccessStateArg<T> = {
  offense: {
    carIndex: number
    formation: readonly T[]
  }
  defense?: {
    carIndex: number
    formation: readonly T[]
  }
}

/**
 * アクセスにおいて直接アクセスする・アクセスを受けるでんこを取得する
 * @param state アクセス状態 {@link AccessState}
 * @param which 攻撃側・守備側のどちらか指定
 * @throws 存在しない守備側を指定した場合Error
 * @returns {@link AccessDencoState}
 */
export function getAccessDenco<T>(state: AccessStateArg<T>, which: AccessSide): T {
  if (which === "offense") {
    return state.offense.formation[state.offense.carIndex]
  } else {
    const f = getDefense(state)
    return f.formation[f.carIndex]
  }
}