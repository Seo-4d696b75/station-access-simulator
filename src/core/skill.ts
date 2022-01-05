import { AccessResult, AccessState, ActiveSkillDenco } from "./access"
import * as SkillEvent from "./skillEvent"
import { SkillPropertyReader } from "./skillManager"

export type SkillPossessType =
  "possess" |
  "not_aquired" |
  "none"

/**
 * スキルの有効化に関する状態  
 * 
 * ユーザが変更できる場合とできない場合がある
 * - unable ユーザはスキルを有効化できない状態 スキル評価の対象外
 * - idle ユーザがスキルの有効化できる状態 まだ有効化しておらず評価の対象外
 * - active スキル評価の対象となる
 * - wait スキルがクールダウン中の状態スキル評価の対象外
 * 
 */
export type SkillState =
  "unable" |
  "idle" |
  "active" |
  "wait"

interface SkillHolder<T, S = undefined> {
  type: T,
  skill: S
}

/**
 * スキルの発動確率を百分率で表現
 */
export type ProbabilityPercent = number

/**
 * スキル発動の有無を表す  
 * 発動の有無が確定できる場合はboolean, 確率に依存する場合は発動する確率を指定する
 */
export type SkillTrigger = boolean | ProbabilityPercent

/**
 * 指定された状態でスキルが発動できるか判定する
 * 
 * 確率に依存する部分以外の判定をここで行うこと
 */
export type SkillTriggerPredicate = (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco) => SkillTrigger

/**
 * アクセス時にスキルが発動した時の効果を反映する
 */
export type AccessSkillEvaluate = (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco) => AccessState

/**
 * アクセス時以外のイベントでスキルが発動した時の効果を反映する
 */
export type EventSkillEvaluate = (state: SkillEvent.SkillEventState, self: SkillEvent.ActiveSkillDenco) => SkillEvent.SkillEventState | undefined

export interface SkillLogic {
  /**
   * アクセス時の各段階でスキルが発動するか判定する
   */
  canEvaluate?: SkillTriggerPredicate
  /**
   * アクセス時のスキル発動処理
   */
  evaluate?: AccessSkillEvaluate

  evaluateOnEvent?: EventSkillEvaluate

  onAccessComplete?: (result: AccessResult, self: ActiveSkillDenco) => AccessResult 

  /**
   * フットバースでも発動するスキルの場合はtrueを指定  
   * 一部のスキル発動ステップはフットバース時はスキップされる
   */
  evaluateInPink?: boolean
}

export interface Skill extends SkillLogic {
  level: number
  name: string
  state: SkillState
  transitionType: SkillStateTransition
  propertyReader: SkillPropertyReader
}

export type SkillPossess =
  SkillHolder<"possess", Skill> |
  SkillHolder<"not_aquired"> |
  SkillHolder<"none">

export type SkillStateTransition =
  "manual" |
  "auto" |
  "condition" |
  "always"

export type SkillEvaluationStep =
  "pink_check" |
  "probability_check" |
  "before_access" |
  "start_access" |
  "damage_common" |
  "damage_special" |
  "damage_fixed" |
  "after_damage"

/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill 
* @returns 
*/
export function isSkillActive(skill: SkillPossess): skill is SkillHolder<"possess", Skill> {
  return skill.type === "possess" && skill.skill.state === "active"
}
