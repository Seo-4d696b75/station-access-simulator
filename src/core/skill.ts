import * as access from "./access"
import { DencoState, getSkill } from "./denco"
import * as event from "./skillEvent"
import { SkillPropertyReader } from "./skillManager"
import { DencoTargetedUserState, UserState } from "./user"

/**
 * スキル状態の遷移の種類
 * 
 * - `manual` ユーザがスキルボタンを押すると有効化されるタイプ `idle > active > cooldown >`
 * - `manual-condition` `manual`と同様にユーザ操作で有効化されるが特定の条件でしか有効化できない `unable <> idle > active > cooldown >`
 * - `auto` 特定の条件で自動的に有効化される `unable > active > cooldown`
 * - `auto-condition` 特定の条件で自動的に有効・無効状態を遷移する クールダウンが無い `unable <> active`
 * - `always` 常に有効化されている
 */
export type SkillStateTransition =
  "manual" |
  "manual-condition" |
  "auto" |
  "auto-condition" |
  "always"

/**
 * スキルの有効化に関する状態  
 * 
 * ユーザが変更できる場合とできない場合がある
 * - unable ユーザはスキルを有効化できない状態 スキル評価の対象外
 * - idle ユーザがスキルの有効化できる状態 まだ有効化しておらず評価の対象外
 * - active スキル評価の対象となる
 * - cooldown スキルがクールダウン中の状態スキル評価の対象外
 * 
 */
export type SkillStateType =
  "not_init" |
  "unable" |
  "idle" |
  "active" |
  "cooldown"

interface SkillStateBase<SkillStateType, D = undefined> {
  type: SkillStateType
  data: D
}

export interface SkillCooldownTimeout {
  cooldownTimeout: number
}

export interface SkillActiveTimeout extends SkillCooldownTimeout {
  activated: number
  activeTimeout: number
}

export type SkillState =
  SkillStateBase<"not_init"> |
  SkillStateBase<"unable"> |
  SkillStateBase<"idle"> |
  SkillStateBase<"active", SkillActiveTimeout | undefined> |
  SkillStateBase<"cooldown", SkillCooldownTimeout>


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
export type SkillTriggerPredicate = (state: access.AccessState, step: access.SkillEvaluationStep, self: access.ActiveSkillDenco) => SkillTrigger

/**
 * アクセス時にスキルが発動した時の効果を反映する
 */
export type AccessSkillEvaluate = (state: access.AccessState, step: access.SkillEvaluationStep, self: access.ActiveSkillDenco) => access.AccessState

/**
 * アクセス時以外のイベントでスキルが発動の有無・発動時の効果を反映
 * @returns 発動する場合は効果を反映した結果を返すこと
 */
export type EventSkillPreEvaluate = (state: event.SkillEventState, self: event.ActiveSkillDenco) => event.SkillEventState | undefined

export interface TargetSkillDenco extends DencoState {
  carIndex: number
  skill: Skill
  propertyReader: SkillPropertyReader
}

export interface SkillLogic {
  /**
   * アクセス時の各段階でスキルが発動するか判定する
   */
  canEvaluate?: SkillTriggerPredicate
  /**
   * アクセス時のスキル発動処理
   */
  evaluate?: AccessSkillEvaluate

  /**
   * アクセス時以外のスキル評価において付随的に評価される処理
   * 現状ではひいるの確率補正のみ
   */
  evaluateOnEvent?: EventSkillPreEvaluate

  /**
   * アクセス処理が完了した直後の処理をここで行う
   * 
   * @returns アクセス直後にスキルが発動する場合はここで処理して発動結果を返す
   */
  onAccessComplete?: (state: UserState, self: access.ActiveSkillDenco, access: access.AccessState) => undefined | UserState

  /**
   * フットバースでも発動するスキルの場合はtrueを指定  
   * 一部のスキル発動ステップはフットバース時はスキップされる
   */
  evaluateInPink?: boolean

  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`においてアクティブな状態`active`が終了して`cooldown`へ移行する判定の方法を指定する
   * 
   * `idle/unable -> active`に状態遷移したタイミングで呼ばれ、返値によって`cooldown`への遷移の基準が変わる  
   * - undefined: スキル側で適宜状態を変更する
   * - `SkillActiveTimeout`: 指定した時間経過したら状態を変更する
   * 
   * `onActivated`を指定しない場合は返値`undefined`と同様に処理する
   * @returns 一定時間の経過で判定する場合はtimeoutを返す
   */
  disactivateAt?: (state: UserState, self: TargetSkillDenco, time: number) => undefined | SkillActiveTimeout

  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`において`cooldown`が終了して`idle/unable`へ移行する判定の方法を指定する
   * 
   * `disactivateSkill`で`active > cooldown`に状態変化したタイミングで呼ばれる  
   * ただし、`disactivateAt`で`SkillActiveTimeout`を返した場合はその設定に従うので`completeCooldownAt`は呼ばれない
   * 
   * @returns 返値で指定した時刻以降に`cooldown > unable/idle`へ移行する
   */
  completeCooldownAt?: (state: UserState, self: TargetSkillDenco, time: number) => SkillCooldownTimeout

  /**
   * スキル状態の遷移タイプ`auto-condition`において`active`状態であるか判定する
   * 
   * `auto-condition`タイプでこの関数未定義はエラーとなる
   */
  canActivated?: (state: UserState, self: TargetSkillDenco) => boolean

  onActivated?: (state: UserState, self: TargetSkillDenco) => UserState
  onFormationChanged?: (state: UserState, self: TargetSkillDenco) => UserState
  onDencoHPChanged?: (state: UserState, self: TargetSkillDenco) => UserState
  onLinkSuccess?: (state: UserState, self: TargetSkillDenco) => UserState
  onDencoReboot?: (state: UserState, self: TargetSkillDenco) => UserState
}

export interface Skill extends SkillLogic {
  level: number
  name: string
  state: SkillState
  transitionType: SkillStateTransition
  propertyReader: SkillPropertyReader
}

export function copySkill(skill: Skill): Skill {
  return {
    ...skill,
    state: Object.assign({}, skill.state)
  }
}

export type SkillPossessType =
  "possess" |
  "not_aquired" |
  "none"


interface SkillHolder<T, S = undefined> {
  type: T,
  skill: S
}

export type SkillPossess =
  SkillHolder<"possess", Skill> |
  SkillHolder<"not_aquired"> |
  SkillHolder<"none">

/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill 
* @returns 
*/
export function isSkillActive(skill: SkillPossess): skill is SkillHolder<"possess", Skill> {
  if (skill.type === "possess") {
    const state = skill.skill.state
    if (state.type === "not_init") {
      throw Error("skill state not init")
    }
    return state.type === "active"
  }
  return false
}

/**
 * タイプ`manual-condition`のスキル状態を`unable > idle`へ遷移させる
 * @returns `idle`へ遷移した新しい状態
 */
export function enableSkill(state: DencoTargetedUserState): UserState {
  const d = state.formation[state.carIndex]
  const skill = getSkill(d)
  if (skill.transitionType === "manual-condition") {
    switch (skill.state.type) {
      case "not_init":
      case "unable": {
        skill.state = {
          type: "idle",
          data: undefined
        }
        return state
      }
      case "idle": {
        return state
      }
      default: {
        throw Error(`can not enable this skill(state:${skill.state.type},type:manaual-condition)`)
      }
    }
  } else {
    throw Error(`only type:manual-condition skill enabled, but found type:${skill.transitionType}`)
  }
}

/**
 * スキル状態を`unable`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual-condition`のスキル状態を`idle > unable`へ遷移させる
 * @returns `unable`へ遷移した新しい状態
 */
export function disableSkill(state: DencoTargetedUserState): UserState {
  const d = state.formation[state.carIndex]
  const skill = getSkill(d)
  if (skill.transitionType === "manual-condition") {
    switch (skill.state.type) {
      case "not_init":
      case "idle": {
        skill.state = {
          type: "unable",
          data: undefined
        }
        return state
      }
      case "unable": {
        return state
      }
      default: {
        throw Error(`can not disable this skill(state:${skill.state.type},type:manaual-condition)`)
      }
    }
  } else {
    throw Error(`only type:manual-condition/auto-condition skill disabled, but found type:${skill.transitionType}`)
  }
}

/**
 * スキル状態を`active`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`auto`のスキル状態を`unable > active`へ遷移させる
 * @returns `active`へ遷移した新しい状態
 */
export function activateSkill(state: DencoTargetedUserState, time: number): UserState {
  const d = state.formation[state.carIndex]
  const skill = getSkill(d)
  switch (skill.transitionType) {
    case "manual":
    case "manual-condition": {
      switch (skill.state.type) {
        case "not_init":
        case "idle": {
          skill.state = {
            type: "active",
            data: skill.disactivateAt?.(state, {
              ...d,
              carIndex: state.carIndex,
              skill: skill,
              propertyReader: skill.propertyReader,
            }, time)
          }
          return refreshSkillState(state, time)
        }
        case "active": {
          return state
        }
        default: {
          throw Error(`can not activate this skill(state:${skill.state.type},type:${skill.transitionType})`)
        }
      }
    }
    case "auto": {
      switch (skill.state.type) {
        case "not_init":
        case "unable": {
          skill.state = {
            type: "active",
            data: skill.disactivateAt?.(state, {
              ...d,
              carIndex: state.carIndex,
              skill: skill,
              propertyReader: skill.propertyReader,
            }, time)
          }
          return refreshSkillState(state, time)
        }
        case "active": {
          return state
        }
        default: {
          throw Error(`can not activate this skill(state:${skill.state.type},type:auto)`)
        }
      }
    }
    default: {
      throw Error(`can not activate skill type:${skill.transitionType}`)
    }
  }
}

/**
 * スキル状態を`cooldown`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`auto`のスキル状態を`active > cooldown`へ遷移させる
 * 
 * ただし、`Skill#disactivateAt`で`active, cooldown`の終了時刻を指定している場合はその指定に従うので
 * この呼び出しはエラーとなる
 * 
 * @returns `cooldown`へ遷移した新しい状態
 */
export function disactivateSkill(state: DencoTargetedUserState, time: number): UserState {
  const d = state.formation[state.carIndex]
  const skill = getSkill(d)
  switch (skill.transitionType) {
    case "manual":
    case "manual-condition":
    case "auto": {
      if (skill.state.type === "active") {
        if (skill.state.data) {
          throw Error(`can not disactivate, timeout has been set:${JSON.stringify(skill.state.data)}`)
        }
        const callback = skill.completeCooldownAt
        if (!callback) {
          throw Error(`no timeout for cooldown provided`)
        }
        skill.state = {
          type: "cooldown",
          data: callback(state, {
            ...d,
            carIndex: state.carIndex,
            skill: skill,
            propertyReader: skill.propertyReader,
          }, time)
        }
        return refreshSkillState(state, time)
      } else {
        throw Error(`can not disactivate this skill(state:${skill.state.type})`)
      }
    }
    default: {
      throw Error(`can not disactivate skill type:${skill.transitionType}`)
    }
  }
}

/**
 * スキル状態の変化を調べて更新する
 * 
 * 以下の状態に依存する`Skill#state`の遷移を調べる
 * - `SkillActiveTimeout` 現在時刻に依存：指定時刻を過ぎたら`cooldown`へ遷移
 * - `SkillCooldownTimeout` 現在時刻に依存：指定時刻を過ぎたら`idle/unable`へ遷移
 * - 遷移タイプ`auto-condition` スキル状態自体が編成状態に依存
 * 
 * スキル状態の整合性も同時に確認する
 * @param state 現在の状態
 * @param time 現在時刻
 * @returns 新しい状態
 */
export function refreshSkillState(state: UserState, time: number): UserState {
  return {
    ...state,
    formation: state.formation.map((d, idx) => refreshSkillStateOne(d, {
      ...state,
      carIndex: idx
    }, time))
  }
}

function refreshSkillStateOne(denco: DencoState, state: DencoTargetedUserState, time: number): DencoState {
  if (denco.skillHolder.type !== "possess") {
    return denco
  }
  const skill = denco.skillHolder.skill
  switch (skill.transitionType) {
    case "always": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "active",
          data: undefined
        }
      }
      if (skill.state.type !== "active") {
        throw Error("transaction type:always, but skill state is not active")
      }
      return denco
    }
    case "manual": {
      if (skill.state.type === "unable") {
        throw Error("transaction type:manual, but skill state is unable")
      }
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "idle",
          data: undefined
        }
      }
      refreshTimeout(skill, time)
      return denco
    }
    case "manual-condition": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          data: undefined
        }
      }
      refreshTimeout(skill, time)
      return denco
    }
    case "auto": {
      if (skill.state.type === "idle") {
        throw Error("transaction type:auto, but skill state is idle")
      }
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          data: undefined
        }
      }
      refreshTimeout(skill, time)
      return denco
    }
    case "auto-condition": {
      if (skill.state.type === "idle") {
        throw Error("transaction type:auto-condition, but skill state is idle")
      }
      if (skill.state.type === "cooldown") {
        throw Error("transaction type:auto-condition, but skill state is cooldown")
      }
      // スキル状態の確認・更新
      const predicate = skill.canActivated
      if (!predicate) {
        throw Error("transaction type:auto-condition, but function #canActivated not defined")
      }
      if (predicate(state, {
        ...denco,
        carIndex: state.carIndex,
        skill: skill,
        propertyReader: skill.propertyReader,
      })) {
        skill.state = {
          type: "active",
          data: undefined
        }
      } else {
        skill.state = {
          type: "unable",
          data: undefined
        }
      }
      return denco
    }
  }
}

function refreshTimeout(skill: Skill, time: number) {
  if (skill.state.type === "active") {
    const data = skill.state.data
    if (data && data.activeTimeout >= time) {
      skill.state = {
        type: "cooldown",
        data: {
          cooldownTimeout: data.cooldownTimeout
        }
      }
    }
  }
  if (skill.state.type === "cooldown") {
    const data = skill.state.data
    if (data.cooldownTimeout >= time) {
      skill.state = {
        type: "idle",
        data: undefined
      }
    }
  }
}