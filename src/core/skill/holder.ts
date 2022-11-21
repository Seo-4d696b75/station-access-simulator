import { SimulatorError } from "../context"
import { ReadonlyState } from "../state"
import { SkillData } from "./data"
import { SkillLogic } from "./logic"
import { SkillProperty } from "./property"
import { SkillTransition, SkillTransitionType } from "./transition"

export interface SkillState<T extends SkillTransitionType = SkillTransitionType> {

  // 状態遷移タイプに応じた判別のため便宜上追加
  transitionType: T

  // SkillHolderとして引数渡す場合に型推論が正しく行えるよう便宜的に追加
  type: "possess"

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
  transition: SkillTransition<T>

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
export type Skill<T extends SkillTransitionType = SkillTransitionType> =
  T extends SkillTransitionType ? SkillState<T> & SkillLogic<T> & {
    /**
     * スキルレベルや各でんこに依存するデータへアクセスします
     * 
     * ### 注意
     * ここから読み出す値には着用してるフィルムの補正値が反映されていません  
     * 
     * スキルの発動判定・発動時の処理を行うときは必ずコールバックに渡される{@link ActiveSkill}の方から参照してください
     */
    property: SkillProperty
  } : never

interface SkillNotAcquired {
  type: "not_acquired"
}

interface SkillNone {
  type: "none"
}

/**
 * スキルの保有をモデル化します
 * 
 * `type`の値に応じて３種類のスキル保有状態があります
 * - "possess" : スキルを保有している
 * - "not_acquired" : でんこのレベルが低くまだスキルを保有していない
 * - "none" : スキルを保有していない
 */
export type SkillHolder = Skill | SkillNotAcquired | SkillNone

/**
 * でんこが保持しているスキルを取得します
 * @param denco 
 * @returns 保持しているスキル
 * @throws スキルを保持していない場合
 */
export function getSkill<S extends SkillState | ReadonlyState<SkillState>>(denco: { skill: S | SkillNotAcquired | SkillNone }): S {
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
export function isSkillActive<S extends SkillState | ReadonlyState<SkillState>>(skill: S | SkillNotAcquired | SkillNone): skill is S {
  return skill.type === "possess" && skill.transition.state === "active"
}