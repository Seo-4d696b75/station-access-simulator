import { SkillProperty } from "../skillManager"
import { FormationPosition } from "../user"
import { SkillLogic } from "./logic"
import { SkillState } from "./state"

/**
 * スキルレベルに依存するデータとスキル発動に関するロジックを保有する
 */
export interface Skill extends SkillLogic {
  /**
   * スキルレベル 1始まりの整数でカウントする
   */
  level: number
  /**
   * スキルの名称「*** Lv.1」など
   */
  name: string
  /**
   * スキルの状態
   * 
   * **この状態を直接操作しないでください** {@link activateSkill} {@link deactivateSkill}などの関数を利用してください    
   * **Note** `always`など遷移タイプによってはスキル状態が不変な場合もある
   */
  state: SkillState
  /**
   * スキルレベルや各でんこに依存するデータへのアクセス方法を提供します
   * @see {@link SkillProperty}
   */
  property: SkillProperty
}

/**
 * スキルの発動を評価するときに必要なスキル情報へのアクセスを定義
 */
export interface ActiveSkill extends FormationPosition {
  // skill: SkillHolder だと skill.type === "possess" のチェックが必要で煩雑なのを省略する
  skill: Skill
}

interface SkillHolderBase<T> {
  type: T
}

/**
 * スキルの保有をモデル化します
 * 
 * `type`の値に応じて３種類のスキル保有状態があります
 * - "possess" : スキルを保有している
 * - "not_acquired" : でんこのレベルが低くまだスキルを保有していない
 * - "none" : スキルを保有していない
 */
export type SkillHolder =
  SkillHolderBase<"possess"> & Skill |
  SkillHolderBase<"not_acquired"> |
  SkillHolderBase<"none">

/**
 * でんこが保持しているスキルを取得します
 * @param denco 
 * @returns 保持しているスキル
 * @throws スキルを保持していない場合
 */
export function getSkill<S>(denco: { skill: S & SkillHolderBase<"possess"> | SkillHolderBase<"none"> | SkillHolderBase<"not_acquired"> }): S {
  if (denco.skill.type === "possess") {
    return denco.skill
  }
  throw Error("skill not found")
}

/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill 
* @returns 
*/
export function isSkillActive(skill: SkillHolder): skill is SkillHolderBase<"possess"> & Skill {
  return skill.type === "possess" && skill.state.type === "active"
}