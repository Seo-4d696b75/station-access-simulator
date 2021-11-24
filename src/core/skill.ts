
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

interface SkillHolder<T, S=undefined> {
  type: T,
  skill: S
}

type SKillPossess = SkillHolder<SkillPossessType.POSSESS, {
  level: number
  name: string
  state: SkillState
  transition_type: SkillStateTransition
  logic: SkillLogic
}>
type SkillNotAquired = SkillHolder<SkillPossessType.NOT_AQUIRED>
type SkillNone = SkillHolder<SkillPossessType.NONE>

export type Skill = SKillPossess | SkillNotAquired | SkillNone

export enum SkillStateTransition {
  MANUAL,
  AUTO,
  CONDITION,
  ALWAYS,
}

/**
 * スキル評価ロジックの部分
 */
export interface SkillLogic {
}