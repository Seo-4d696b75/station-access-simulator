import { AccessSideState, AccessState } from "."
import { Context } from "../context"
import { copyState, ReadonlyState } from "../state"
import { execute } from "./main/execute"

/**
 * 攻守はそのままでアクセス処理を再度実行する
 * 
 * @param state 現在のアクセス状態
 * @returns ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
export function repeatAccess(context: Context, state: ReadonlyState<AccessState>): AccessState {
  context.log.log(`アクセス処理を再度実行 #${state.depth + 1}`)
  const next: AccessState = {
    time: state.time,
    station: state.station,
    offense: copyState<AccessSideState>(state.offense),
    defense: state.defense ? copyState<AccessSideState>(state.defense) : undefined,
    damageFixed: 0,
    attackPercent: 0,
    defendPercent: 0,
    damageRatio: 1.0,
    linkSuccess: false,
    linkDisconnected: false,
    pinkMode: false,
    pinkItemSet: false,
    pinkItemUsed: false,
    depth: state.depth + 1,
  }
  const result = execute(context, next, false)
  context.log.log(`アクセス処理を終了 #${state.depth + 1}`)
  return result
}