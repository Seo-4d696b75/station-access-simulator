import * as access from "./access"
import { Context } from "./context"
import { DencoState, getSkill } from "./denco"
import * as event from "./skillEvent"
import { SkillPropertyReader } from "./skillManager"
import { copyUserState, FormationPosition, ReadonlyState, UserState } from "./user"

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
export type SkillTriggerPredicate = (context: Context, state: ReadonlyState<access.AccessState>, step: access.SkillEvaluationStep, self: ReadonlyState<access.AccessDencoState & ActiveSkill>) => SkillTrigger

/**
 * アクセス時にスキルが発動した時の効果を反映する
 */
export type AccessSkillEvaluate = (context: Context, state: access.AccessState, step: access.SkillEvaluationStep, self: ReadonlyState<access.AccessDencoState & ActiveSkill>) => access.AccessState

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
  evaluateOnEvent?: (context: Context, state: event.SkillEventState, self: ReadonlyState<event.SkillEventDencoState & ActiveSkill>) => event.SkillEventState | undefined

  /**
   * アクセス処理が完了した直後の処理をここで行う
   * 
   * @returns アクセス直後にスキルが発動する場合はここで処理して発動結果を返す
   */
  onAccessComplete?: (context: Context, state: UserState, self: ReadonlyState<access.AccessDencoState & ActiveSkill>, access: ReadonlyState<access.AccessState>) => undefined | UserState

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
  disactivateAt?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>, time: number) => undefined | SkillActiveTimeout

  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`において`cooldown`が終了して`idle/unable`へ移行する判定の方法を指定する
   * 
   * `disactivateSkill`で`active > cooldown`に状態変化したタイミングで呼ばれる  
   * ただし、`disactivateAt`で`SkillActiveTimeout`を返した場合はその設定に従うので`completeCooldownAt`は呼ばれない
   * 
   * @returns 返値で指定した時刻以降に`cooldown > unable/idle`へ移行する
   */
  completeCooldownAt?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>, time: number) => SkillCooldownTimeout

  /**
   * スキル状態の遷移タイプ`auto-condition`において`active`状態であるか判定する
   * 
   * `auto-condition`タイプでこの関数未定義はエラーとなる
   * @returns trueの場合は`active`状態へ遷移
   */
  canActivated?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => boolean

  /**
   * スキル状態の遷移タイプ`manual-condition`において`idle <> unable`状態であるか判定する
   * 
   * `manual-condition`タイプでこの関数未定義はエラーとなる
   * @returns trueの場合は`idle`状態へ遷移
   */
  canEnabled?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => boolean

  onActivated?: (context: Context, state: UserState, self: ReadonlyState<DencoState & ActiveSkill>) => UserState
  onFormationChanged?: (context: Context, state: UserState, self: ReadonlyState<DencoState & ActiveSkill>) => UserState
  onDencoHPChanged?: (context: Context, state: UserState, self: ReadonlyState<DencoState & ActiveSkill>) => UserState
  onLinkSuccess?: (context: Context, state: UserState, self: ReadonlyState<DencoState & ActiveSkill>) => UserState
  onDencoReboot?: (context: Context, state: UserState, self: ReadonlyState<DencoState & ActiveSkill>) => UserState
}

export interface Skill extends SkillLogic {
  level: number
  name: string
  state: SkillState
  transitionType: SkillStateTransition
  propertyReader: SkillPropertyReader
}

/**
 * スキルの発動を評価するときに必要なスキルの各種データを定義
 */
export interface ActiveSkill extends FormationPosition{
  skill: Skill
  skillPropertyReader: SkillPropertyReader
}

export function copySkill(skill: Skill): Skill {
  return {
    ...skill,
    state: copySkillState(skill.state),
  }
}

export function copySkillState(state: SkillState): SkillState {
  switch (state.type) {
    case "active": {
      if (state.data) {
        return {
          type: "active",
          data: {
            ...state.data
          }
        }
      }
      break
    }
    case "cooldown": {
      return {
        type: "cooldown",
        data: {
          cooldownTimeout: state.data.cooldownTimeout
        }
      }
    }
    default: {
      break
    }
  }
  return {
    type: state.type,
    data: undefined
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

export function copySkillPossess(skill: SkillPossess): SkillPossess {
  if (skill.type === "possess") {
    return {
      type: "possess",
      skill: copySkill(skill.skill),
    }
  }
  return {
    type: skill.type,
    skill: undefined,
  }
}

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
 * スキル状態を`active`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`idle > active`へ遷移させる
 * - タイプ`auto`のスキル状態を`unable > active`へ遷移させる
 * @returns `active`へ遷移した新しい状態
 */
export function activateSkill(context: Context, state: ReadonlyState<UserState> & FormationPosition, time: number = Date.now()): UserState {
  const next = copyUserState(state)
  const d = next.formation[state.carIndex]
  const skill = getSkill(d)
  switch (skill.transitionType) {
    case "manual":
    case "manual-condition": {
      switch (skill.state.type) {
        case "idle": {
          skill.state = {
            type: "active",
            data: skill.disactivateAt?.(context, state, {
              ...d,
              carIndex: state.carIndex,
              skill: skill,
              skillPropertyReader: skill.propertyReader,
            }, time)
          }
          context.log.log(`スキル状態の変更：${d.name} idle -> active`)
          return refreshSkillState(context, next, time)
        }
        case "active": {
          return next
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.state.type},type:${skill.transitionType})`)
          throw Error()
        }
      }
    }
    case "auto": {
      switch (skill.state.type) {
        case "unable": {
          skill.state = {
            type: "active",
            data: skill.disactivateAt?.(context, state, {
              ...d,
              carIndex: state.carIndex,
              skill: skill,
              skillPropertyReader: skill.propertyReader,
            }, time)
          }
          context.log.log(`スキル状態の変更：${d.name} unable -> active`)
          return refreshSkillState(context, next, time)
        }
        case "active": {
          return next
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.state.type},type:auto)`)
          throw Error()
        }
      }
    }
    default: {
      context.log.error(`スキル状態をactiveに変更できません type:${skill.transitionType}`)
      throw Error()
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
export function disactivateSkill(context: Context, state: ReadonlyState<UserState> & FormationPosition, time: number): UserState {
  const next = copyUserState(state)
  const d = next.formation[state.carIndex]
  const skill = getSkill(d)
  switch (skill.transitionType) {
    case "manual":
    case "manual-condition":
    case "auto": {
      if (skill.state.type === "active") {
        if (skill.state.data) {
          context.log.error(`スキル状態をcooldownに変更できません, active終了時刻が設定済みです: ${JSON.stringify(skill.state.data)}`)
          throw Error()
        }
        const callback = skill.completeCooldownAt
        if (!callback) {
          context.log.error(`スキル状態をcooldownに変更できません, cooldownの終了時刻を指定する関数 completeCooldownAt が未定義です`)
          throw Error()
        }
        skill.state = {
          type: "cooldown",
          data: callback(context, next, {
            ...d,
            carIndex: state.carIndex,
            skill: skill,
            skillPropertyReader: skill.propertyReader,
          }, time)
        }
        context.log.log(`スキル状態の変更：${d.name} active -> cooldown`)
        return refreshSkillState(context, next, time)
      } else {
        context.log.error(`スキル状態をcooldownに変更できません(state:${skill.state.type})`)
      }
    }
    default: {
      context.log.error(`スキル状態をcooldownに変更できません type:${skill.transitionType}`)
    }
  }
  throw Error()
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
export function refreshSkillState(context: Context, state: ReadonlyState<UserState>, time: number): UserState {
  const size = state.formation.length
  let next = copyUserState(state)
  for (let idx = 0; idx < size; idx++) {
    next = refreshSkillStateOne(context, next, idx, time)
  }
  return next
}

function refreshSkillStateOne(context: Context, state: UserState, idx: number, time: number): UserState {
  const denco = state.formation[idx]
  if (denco.skillHolder.type !== "possess") {
    return state
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
        context.log.error("不正なスキル状態です type:always, state: not active")
      }
      return state
    }
    case "manual": {
      if (skill.state.type === "unable") {
        context.log.error("不正なスキル状態です type:manual, state: unable")
      }
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "idle",
          data: undefined
        }
      }
      return refreshTimeout(context, state, idx, time)
    }
    case "manual-condition": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          data: undefined
        }
      }
      if (skill.state.type === "idle" || skill.state.type === "unable") {
        const predicate = skill.canEnabled
        if (!predicate) {
          context.log.error("関数#canEnabled が未定義です type:manual-condition")
          throw Error()
        }
        let self = {
          ...denco,
          carIndex: idx,
          skill: skill,
          skillPropertyReader: skill.propertyReader
        }
        const enable = predicate(context, state, self)
        if (enable && skill.state.type === "unable") {
          context.log.log(`スキル状態の変更：${denco.name} unable -> idle`)
          skill.state = {
            type: "idle",
            data: undefined
          }
        } else if (!enable && skill.state.type === "idle") {
          context.log.log(`スキル状態の変更：${denco.name} idle -> unable`)
          skill.state = {
            type: "unable",
            data: undefined
          }
        }
        return state
      } else {
        return refreshTimeout(context, state, idx, time)
      }
    }
    case "auto": {
      if (skill.state.type === "idle") {
        context.log.error("不正なスキル状態です type:auto, state: idle")
      }
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          data: undefined
        }
      }
      return refreshTimeout(context, state, idx, time)
    }
    case "auto-condition": {
      if (skill.state.type === "idle") {
        context.log.error("不正なスキル状態です type:auto-condition, state: idle")
      }
      if (skill.state.type === "cooldown") {
        context.log.error("不正なスキル状態です type:auto-condition, state: cooldown")
      }
      // スキル状態の確認・更新
      const predicate = skill.canActivated
      if (!predicate) {
        context.log.error("関数#canActivated が未定義です type:auto-condition")
        throw Error()
      }
      let self = {
        ...denco,
        carIndex: idx,
        skill: skill,
        skillPropertyReader: skill.propertyReader,
      }
      const active = predicate(context, state, self)
      if (active && skill.state.type === "unable") {
        context.log.log(`スキル状態の変更：${denco.name} unable -> active`)
        skill.state = {
          type: "active",
          data: undefined
        }
      } else if (!active && skill.state.type === "active") {
        context.log.log(`スキル状態の変更：${denco.name} active -> unable`)
        skill.state = {
          type: "unable",
          data: undefined
        }
      }
      return state
    }
  }
}

function refreshTimeout(context: Context, state: UserState, idx: number, time: number): UserState {
  const denco = state.formation[idx]
  const skill = getSkill(denco)
  if (skill.state.type === "active") {
    const data = skill.state.data
    if (data && data.activeTimeout >= time) {
      context.log.log(`スキル状態の変更：${denco.name} active -> cooldown (timeout:${new Date(data.activeTimeout).toTimeString()})`)
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
      switch (skill.transitionType) {
        case "manual": {

          context.log.log(`スキル状態の変更：${denco.name} cooldown -> idle (timeout:${new Date(data.cooldownTimeout).toTimeString()})`)
          skill.state = {
            type: "idle",
            data: undefined
          }
        }
        case "manual-condition": {

          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${new Date(data.cooldownTimeout).toTimeString()})`)
          skill.state = {
            type: "idle",
            data: undefined
          }
          // check unable <=> idle
          return refreshSkillStateOne(context, state, idx, time)
        }
        case "auto": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${new Date(data.cooldownTimeout).toTimeString()})`)
          skill.state = {
            type: "idle",
            data: undefined
          }
        }
        default: {
          context.log.error(`不正なスキル状態遷移タイプ ${skill.transitionType}`)
        }
      }
    }
  }
  return state
}