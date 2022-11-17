import { SimulatorError } from "../context"
import { ReadonlyState } from "../state"
import { SkillData } from "./data"
import { SkillLogic } from "./logic"
import { SkillProperty } from "./property"
import { SkillTransition } from "./transition"

export interface SkillState {
  /**
   * スキルレベル 1始まりの整数でカウントする
   */
  level: number
  /**
   * スキルの名称「*** Lv.1」など
   */
  name: string
  /**
   * スキルの状態遷移
   * 
   * **この状態を直接操作しないでください** {@link activateSkill} {@link deactivateSkill}などの関数を利用してください    
   * **Note** `always`など遷移タイプによってはスキル状態が不変な場合もある
   */
  transition: SkillTransition
  
  // 参照する場所によって読み出す値が違う
  property: unknown

  /**
   * カスタムデータ
   * 
   * スキルの処理に関わる任意のデータを保存できます
   */
  data: SkillData
}

/**
 * でんこが保有するスキル
 */
export type Skill = SkillState & SkillLogic & {
  /**
   * スキルレベルや各でんこに依存するデータへアクセスします
   * 
   * ### 注意
   * ここから読み出す値には着用してるフィルムの補正値が反映されていません  
   * 
   * スキルの発動判定・発動時の処理を行うときは必ずコールバックに渡される{@link ActiveSkill}の方から参照してください
   */
  property: SkillProperty
}

interface SkillHolderBase<T> {
  readonly type: T
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
  throw new SimulatorError("skill not found")
}

/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill 
* @returns 
*/
export function isSkillActive<S extends Skill | ReadonlyState<Skill>>(skill: S & SkillHolderBase<"possess"> | SkillHolderBase<"none"> | SkillHolderBase<"not_acquired">): skill is S & SkillHolderBase<"possess"> {
  return skill.type === "possess" && skill.transition.state === "active"
}