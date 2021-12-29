import { AccessState, ActiveSkillDenco} from "./access"
import { SkillPropertyReader } from "./skill_manager"

export enum SkillPossessType {
  POSSESS,
  NOT_AQUIRED,
  NONE,
}

/**
 * スキルの有効化に関する状態  
 * 
 * ユーザが変更できる場合とできない場合がある
 */
export enum SkillState {
  /**
   * ユーザはスキルを有効化できない状態  
   * スキル評価の対象外
   */
  UNABLE,
  /**
   * ユーザがスキルの有効化できる状態  
   * まだ有効化しておらず評価の対象外
   */
  IDLE,
  /**
   * スキルが有効化されている状態  
   * スキル評価の対象となる
   */
  ACTIVE,
  /**
   * スキルがクールダウン中の状態
   * スキル評価の対象外
   */
  WAIT,
}

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
  can_evaluate?: SkillTriggerPredicate
  evaluate?: SkillEvaluate

  /**
   * フットバースでも発動するスキルの場合はtrueを指定  
   * 一部のスキル発動ステップはフットバース時はスキップされる
   */
  evaluate_in_pink?: boolean
}

export interface Skill extends SkillLogic{
  level: number
  name: string
  state: SkillState
  transition_type: SkillStateTransition
  property_reader: SkillPropertyReader
}

export type SkillPossess =
  SkillHolder<SkillPossessType.POSSESS, Skill> |
  SkillHolder<SkillPossessType.NOT_AQUIRED> |
  SkillHolder<SkillPossessType.NONE>

export enum SkillStateTransition {
  MANUAL,
  AUTO,
  CONDITION,
  ALWAYS,
}

export enum SkillEvaluationStep {
  PINK_CHECK,
  PROBABILITY_CHECK,
  BEFORE_ACCESS,
  START_ACCESS,
  DAMAGE_COMMON,
  DAMAGE_SPECIAL,
  DAMAGE_FIXED,
  AFTER_DAMAGE,
}
