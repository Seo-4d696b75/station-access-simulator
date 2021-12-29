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

export type ProbabilityPercent = number
export type SkillTrigger = boolean | ProbabilityPercent
export type SkillTriggerPredicate = (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco) => SkillTrigger
export type SkillEvaluate = (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco) => AccessState

export interface SkillLogic {
  can_evaluate?: SkillTriggerPredicate
  evaluate?: SkillEvaluate
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
