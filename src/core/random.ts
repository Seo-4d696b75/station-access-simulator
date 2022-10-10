import { Context } from "./context"

/**
 * スキル発動などtrue/falseの条件が確率に依存する場合の挙動を指定できます
 * - "normal": 疑似乱数を用いて指定された確率で計算
 * - "ignore": 必ずfalse
 * - "force": 必ずtrue
 * 
 * @see {@link random}
 */
export type RandomMode =
  "normal" |
  "ignore" |
  "force"

/**
* スキル発動の有無など確率を計算する
*/
export interface Random {
  mode: RandomMode
  (): number
}

/**
 * 確率計算モードを考慮してtrue/falseの条件を計算する  
 * 
 * {@link RandomMode} の値に応じて乱数計算を無視してtrue/falseを返す場合もある  
 * 計算の詳細  
 * 1. `percent <= 0` -> `false`
 * 2. `percent >= 100` -> `true`
 * 3. `context.random.mode === "ignore"` -> `false`
 * 4. `context.random.mode === "force"` -> `true`
 * 5. `context.random.mode === "normal"` -> 疑似乱数を用いて`percent`%の確率で`true`を返す
 * @param percent 100分率で指定した確率でtrueを返す
 * @returns 
 */
export function random(context: Context, percent: number): boolean {
  if (percent >= 100) return true
  if (percent <= 0) return false
  if (context.random.mode === "force") {
    context.log.log("確率計算は無視されます mode: force")
    return true
  }
  if (context.random.mode === "ignore") {
    context.log.log("確率計算は無視されます mode: ignore")
    return false
  }
  return context.random() < percent / 100.0
}