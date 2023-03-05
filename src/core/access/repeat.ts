import { AccessState } from "."
import { copy } from "../../"
import { Context } from "../context"
import { ReadonlyState } from "../state"
import { runAccessDamageCalculation } from "./damage"

/**
 * 攻守はそのままでアクセス処理を再度実行する
 * 
 * @param state 現在のアクセス状態
 * @returns ダメージ計算・スコアと経験値の加算など各処理を再度実行して合計値を反映した新たな状態を返す
 */
export function repeatAccess(context: Context, state: ReadonlyState<AccessState>): AccessState {
  context.log.log(`アクセス処理を再度実行 #${state.depth + 1}`)
  const next: AccessState = {
    ...copy.AccessState(state),
    // ダメージ計算に関わる状態は初期化する！
    // 公式お知らせ -【不具合】特定のスキルが同時に発動した際、意図しない挙動となる
    // https://ekimemo.com/news/20220922121500_1
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
  const result = runAccessDamageCalculation(context, next)
  context.log.log(`アクセス処理を終了 #${state.depth + 1}`)
  return result
}
