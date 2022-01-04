import { type } from "os"
import { AccessState, ActiveSkillDenco} from "./access"
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
 */
export type SkillTriggerPredicate = (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco) => SkillTrigger

/**
 * スキルが発動した時の効果を反映する
 */
export type SkillEvaluate = (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco) => AccessState

export interface SkillLogic {
  canEvaluate?: SkillTriggerPredicate
  evaluate?: SkillEvaluate

  /**
   * フットバースでも発動するスキルの場合はtrueを指定  
   * 一部のスキル発動ステップはフットバース時はスキップされる
   */
  evaluateInPink?: boolean
}

export interface Skill extends SkillLogic{
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
