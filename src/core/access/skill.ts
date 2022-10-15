import { Denco } from "../denco";
import { isSkillActive, ProbabilityPercent } from "../skill";
import { ReadonlyState } from "../state";
import { AccessDencoState, AccessEvaluateStep, AccessState, AccessTriggeredSkill } from "./state";

/**
 * アクセス時に発動したスキル効果の処理
 *
 * @param state 可変(mutable)です. スキル効果による状態変化を直接書き込めます.
 * @return `AccessState`を返す場合は返り値で状態を更新します.
 *   `undefined`を返す場合は引数`state`を次の状態として扱います.
 */

export type AccessSkillRecipe = (state: AccessState) => void | AccessState;

/**
 * スキル発動の確率計算の方法・発動時の処理を定義します
 * 
 * - 確率計算に依存せず発動することが確定している場合は`EventSkillRecipe`を直接返します
 * - 確率計算に依存して発動する場合は, `probability`:発動の確率, `recipe`:発動した場合の状態の更新方法をそれぞれ指定します
 *
 * **注意** `probability`に100%未満の数値を設定した場合は、まだスキル発動の有無は決定されていません  
 * 実際に発動した場合の状態更新の方法は関数`recipe`で指定してください
 */
export type AccessSkillTrigger = {
  probability: ProbabilityPercent
  recipe: AccessSkillRecipe
} | AccessSkillRecipe

/**
 * 指定したでんこのスキルが発動済みか確認する
 * 
 * １度目のスキル発動における各コールバック呼び出しのタイミングでの返値の変化は次のとおり
 * - `Skill#canEvaluate` : `false`
 * - `Skill#evaluate` : `true`
 * @param state 
 * @param denco 
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
export function hasSkillTriggered(state: { readonly triggeredSkills: readonly AccessTriggeredSkill[] } | undefined, denco: Denco, step?: AccessEvaluateStep): boolean {
  if (!state) return false
  return state.triggeredSkills.findIndex(t => {
    return t.numbering === denco.numbering && (!step || step === t.step)
  }) >= 0
}

/**
 * 編成からアクティブなスキル（スキルの保有・スキル状態・スキル無効化の影響を考慮）を抽出する
 * @param list 
 * @returns 
 */
export function filterActiveSkill(list: readonly ReadonlyState<AccessDencoState>[]): number[] {
  return list.filter(d => {
    return hasActiveSkill(d)
  }).map(d => d.carIndex)
}

/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d 
 * @returns 
 */
export function hasActiveSkill(d: ReadonlyState<AccessDencoState>): boolean {
  return isSkillActive(d.skill) && !d.skillInvalidated
}
