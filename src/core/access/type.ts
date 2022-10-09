
import { ProbabilityPercent } from "../skill";
import { AccessState } from "./access";

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

