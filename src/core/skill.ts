import moment from "moment-timezone"
import { AccessUserResult, TIME_FORMAT } from ".."
import * as access from "./access"
import { Context } from "./context"
import { copyDencoState, DencoState } from "./denco"
import * as event from "./skillEvent"
import { SkillProperty } from "./skillManager"
import { copyUserState, copyUserStateTo, FormationPosition, ReadonlyState, UserState } from "./user"

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

interface SkillStateBase<Transition, Type, D = undefined> {
  transition: Transition,
  type: Type,
  data: D,
}

/**
 * スキル状態`cooldown`の終了時刻を指定する
 */
export interface SkillCooldownTimeout {
  /**
   * スキル状態`cooldown`が終了する時刻 [ms]
   */
  cooldownTimeout: number
}

/**
 * スキル状態`active`の終了時刻を指定する
 */
export interface SkillActiveTimeout extends SkillCooldownTimeout {
  /**
   * スキル状態が`active > cooldown`へ遷移する時刻 [ms]
   * activated <= activeTimeout
   */
  activeTimeout: number
}

type ManualSkillState =
  SkillStateBase<"manual", "idle"> |
  SkillStateBase<"manual", "active", SkillActiveTimeout | undefined> |
  SkillStateBase<"manual", "cooldown", SkillCooldownTimeout>

type ManualConditionSkillState =
  SkillStateBase<"manual-condition", "unable"> |
  SkillStateBase<"manual-condition", "idle"> |
  SkillStateBase<"manual-condition", "active", SkillActiveTimeout | undefined> |
  SkillStateBase<"manual-condition", "cooldown", SkillCooldownTimeout>

type AutoSkillState =
  SkillStateBase<"auto", "unable"> |
  SkillStateBase<"auto", "active", SkillActiveTimeout | undefined> |
  SkillStateBase<"auto", "cooldown", SkillCooldownTimeout>

type AutoConditionSkillState =
  SkillStateBase<"auto-condition", "unable"> |
  SkillStateBase<"auto-condition", "active">

type AlwaysSkillState =
  SkillStateBase<"always", "active">

export type SkillState =
  SkillStateBase<SkillStateTransition, "not_init"> |
  ManualSkillState |
  ManualConditionSkillState |
  AutoSkillState |
  AutoConditionSkillState |
  AlwaysSkillState

/**
 * スキルの発動確率を百分率で表現
 * 
 * 乱数計算の詳細はRandomを参照
 * 
 * - 0以下の場合は必ず発動しません
 * - 100以上はの場合は必ず発動します
 */
export type ProbabilityPercent = number

/**
 * スキル発動の確率計算の方法・発動時の処理を定義します
 * 
 * - 確率計算に依存せず発動することが確定している場合は`EventSkillRecipe`を直接返します
 * - 確率計算に依存して発動する場合は, `probability`:発動の確率, `recipe`:発動した場合の状態の更新方法をそれぞれ指定します
 *
 * **注意** `probability`に100%未満の数値を設定した場合は、まだスキル発動の有無は決定されていません  
 * 実際に発動した場合の状態更新の方法は関数`recipe`で指定してください
 */
export type AccessSkillTrigger = {
  probability: ProbabilityPercent
  recipe: AccessSkillRecipe
} | AccessSkillRecipe

/**
 * アクセス時に発動したスキル効果の処理
 * 
 * @param state 可変(mutable)です. スキル効果による状態変化を直接書き込めます.
 * @return `AccessState`を返す場合は返り値で状態を更新します.  
 *   `undefined`を返す場合は引数`state`を次の状態として扱います.
 */
export type AccessSkillRecipe = (state: access.AccessState) => void | access.AccessState

/**
 * スキルレベルに依存しないスキルの発動等に関わるロジックを各種コールバック関数として定義します
 * 
 * スキルレベルに依存するデータは各コールバック関数の引数に渡される{@link Skill property}オブジェクトから参照できます  
 * （例）引数`self: ActiveSkill`に対して`self.skill.property`からアクセスできる
 * 
 */
export interface SkillLogic {
  /**
   * アクセス時の各段階においてスキル発動の判定とスキル発動処理を定義します
   * 
   * @param context 同一のアクセス処理中は同一のオブジェクトが使用されます
   * @param state アクセス全般の状態  
   * **Readonly** この関数呼び出しの段階ではスキル発動が確定していないため状態は更新できません. スキルを発動の判定・状態の更新方法は関数の返り値で指定できます.
   * @param step アクセス中の段階 １回のアクセス処理で各段階は決められた順序で最大１回のみ呼び出されます（場合によっては呼び出されない段階もあります）
   * @param self このスキルを保持するでんこ自身 HPやATKなどのでんこの基本状態に加え、スキルのレベルや効果量などスキルの状態も参照できます.  
   * **Readonly** このスキルが発動する直前の状態をキャプチャしています
   * 
   * @return スキル発動の判定方法・発動時の処理を返り値で指定できます  
   * - void: スキルは発動しません. 確率計算に依存せず発動しないことが明白な場合に適切です.
   * - AccessSkillTrigger: 指定された確率`probability`でスキル発動有無を判定し、発動する場合は`recipe`で状態を更新します
   * 
   */
  evaluate?: (context: Context, state: ReadonlyState<access.AccessState>, step: access.AccessEvaluateStep, self: ReadonlyState<access.AccessDencoState & ActiveSkill>) => void | AccessSkillTrigger


  /**
   * アクセス時以外のスキル評価において付随的に発動するスキルの発動判定と処理を定義します
   * 
   * **注意** 現状ではひいるの確率補正のみ
   * 
   * @param context 同一のイベント処理中は同一のオブジェクトが使用されます
   * @param state スキル発動型のイベント全般の状態  
   * **Readonly** この関数呼び出しの段階ではスキル発動が確定していないため状態は更新できません. スキルを発動の判定・状態の更新方法は関数の返り値で指定できます.
   * @param self このスキルを保持するでんこ自身 HPやATKなどのでんこの基本状態に加え、スキルのレベルや効果量などスキルの状態も参照できます.  
   * **Readonly** このスキルが発動する直前の状態をキャプチャしています
   * 
   * @return スキル発動の判定方法・発動時の処理を返り値で指定できます  
   * - void: スキルは発動しません. 確率計算に依存せず発動しないことが明白な場合に適切です.
   * - EventSkillTrigger: 指定された確率`probability`でスキル発動有無を判定し、発動する場合は`recipe`で状態を更新します
   * 
   */
  evaluateOnEvent?: (context: Context, state: ReadonlyState<event.SkillEventState>, self: ReadonlyState<event.SkillEventDencoState & ActiveSkill>) => void | event.EventSkillTrigger

  /**
   * アクセス処理が完了した直後の処理をここで行う
   * 
   * @returns アクセス直後にスキルが発動する場合はここで処理して発動結果を返す
   */
  onAccessComplete?: (context: Context, state: ReadonlyState<AccessUserResult>, self: ReadonlyState<access.AccessDencoResult & ActiveSkill>, access: ReadonlyState<access.AccessState>) => undefined | AccessUserResult

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
   * `deactivateAt`を指定しない場合は返値`undefined`と同様に処理する
   * @returns 一定時間の経過で判定する場合はtimeoutを返す
   */
  deactivateAt?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => undefined | SkillActiveTimeout

  /**
   * スキル状態遷移のタイプ`manual,manual-condition,auto`において`cooldown`が終了して`idle/unable`へ移行する判定の方法を指定する
   * 
   * `deactivateSkill`で`active > cooldown`に状態変化したタイミングで呼ばれる  
   * ただし、`deactivateAt`で`SkillActiveTimeout`を返した場合はその設定に従うので`completeCooldownAt`は呼ばれない
   * 
   * @returns 返値で指定した時刻以降に`cooldown > unable/idle`へ移行する
   */
  completeCooldownAt?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => SkillCooldownTimeout

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

  /**
   * スキル状態が`active`へ変更された直後の処理をここで行う
   * 
   * スキル状態遷移のタイプ`manual,manual-condition,auto,auto-condition`限定
   */
  onActivated?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState

  onHourCycle?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState

  onFormationChanged?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  onDencoHPChanged?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  onLinkSuccess?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
  onDencoReboot?: (context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<DencoState & ActiveSkill>) => void | UserState
}

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

export function copySkillState(state: SkillState): SkillState {
  switch (state.type) {
    case "active": {
      if (state.data) {
        return {
          type: "active",
          transition: state.transition,
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
        transition: state.transition,
        data: {
          cooldownTimeout: state.data.cooldownTimeout
        }
      }
    }
    case "not_init":
    case "idle":
    case "unable": {
      return {
        ...state
      }
    }
  }
  return {
    ...state
  }
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


export function getSkill<S>(denco: { skill: S & SkillHolderBase<"possess"> | SkillHolderBase<"none"> | SkillHolderBase<"not_acquired"> }): S {
  if (denco.skill.type === "possess") {
    return denco.skill
  }
  throw Error("skill not found")
}

/**
 * 関数プロパティは参照コピーのみ
 * @param skill 
 * @returns 
 */
export function copySkill(skill: SkillHolder): SkillHolder {
  if (skill.type === "possess") {
    return {
      ...skill,
      name: skill.name,
      level: skill.level,
      property: skill.property,
      state: copySkillState(skill.state),
    }
  }
  return {
    type: skill.type,
  }
}

/**
* スキル保有の有無とスキル状態を考慮してアクティブなスキルか判定
* @param skill 
* @returns 
*/
export function isSkillActive(skill: SkillHolder): skill is SkillHolderBase<"possess"> & Skill {
  if (skill.type === "possess") {
    const state = skill.state
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
export function activateSkill(context: Context, state: ReadonlyState<UserState>, ...carIndex: number[]): UserState {
  context = context.fixClock()
  return carIndex.reduce((next, idx) => activateSkillOne(context, next, idx), copyUserState(state))
}

function activateSkillOne(context: Context, state: UserState, carIndex: number): UserState {
  const d = state.formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません carIndex: ${carIndex}, formation.length: ${state.formation.length}`)
    throw Error()
  }
  if (d.skill.type !== "possess") {
    context.log.error(`対象のでんこはスキルを保有していません ${d.name}`)
    throw Error()
  }
  if (d.skill.state.type === "not_init") {
    context.log.error(`スキル状態が初期化されていません ${d.name}`)
    throw Error()
  }
  const skill = d.skill
  switch (skill.state.transition) {
    case "manual":
    case "manual-condition": {
      switch (skill.state.type) {
        case "idle": {
          return activateSkillAndCallback(context, state, d, d.skill, skill.state.transition, carIndex)
        }
        case "active": {
          return state
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.state.type},transition:${skill.state.transition})`)
          throw Error()
        }
      }
    }
    case "auto": {
      switch (skill.state.type) {
        case "unable": {
          return activateSkillAndCallback(context, state, d, d.skill, "auto", carIndex)
        }
        case "active": {
          return state
        }
        default: {
          context.log.error(`スキル状態をactiveに変更できません(state:${skill.state.type},type:auto)`)
          throw Error()
        }
      }
    }
    default: {
      context.log.error(`スキル状態をactiveに変更できません type:${skill.state.transition}`)
      throw Error()
    }
  }
}

function activateSkillAndCallback(context: Context, state: UserState, d: DencoState, skill: Skill & SkillHolderBase<"possess">, transition: "manual" | "manual-condition" | "auto", carIndex: number): UserState {
  context.log.log(`スキル状態の変更：${d.name} ${skill.state.type} -> active`)
  let self = {
    ...d,
    carIndex: carIndex,
    skill: skill,
  }
  skill.state = {
    type: "active",
    transition: transition,
    data: skill.deactivateAt?.(context, state, self)
  }
  // callback #onActivated
  const callback = skill.onActivated
  if (callback) {
    // 更新したスキル状態をコピー
    self = {
      ...copyDencoState(d),
      carIndex: carIndex,
      skill: skill,
    }
    state = callback(context, state, self) ?? state
  }
  refreshSkillState(context, state)
  return state
}

/**
 * スキル状態を`cooldown`へ遷移させる
 * 
 * 許可される操作は次の場合  
 * - タイプ`manual`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`manual-condition`のスキル状態を`active > cooldown`へ遷移させる
 * - タイプ`auto`のスキル状態を`active > cooldown`へ遷移させる
 * 
 * ただし、`Skill#deactivateAt`で`active, cooldown`の終了時刻を指定している場合はその指定に従うので
 * この呼び出しはエラーとなる
 * 
 * @returns `cooldown`へ遷移した新しい状態
 */
export function deactivateSkill(context: Context, state: ReadonlyState<UserState>, ...carIndex: number[]): UserState {
  context = context.fixClock()
  return carIndex.reduce((next, idx) => deactivateSkillOne(context, next, idx), copyUserState(state))
}

function deactivateSkillOne(context: Context, state: UserState, carIndex: number): UserState {
  const d = state.formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません carIndex: ${carIndex}, formation.length: ${state.formation.length}`)
    throw Error()
  }
  if (d.skill.type !== "possess") {
    context.log.error(`対象のでんこはスキルを保有していません ${d.name}`)
    throw Error()
  }
  const skill = d.skill
  switch (skill.state.transition) {
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
          transition: skill.state.transition,
          data: callback(context, state, {
            ...d,
            carIndex: carIndex,
            skill: skill,
          })
        }
        context.log.log(`スキル状態の変更：${d.name} active -> cooldown`)
        refreshSkillState(context, state)
        return state
      } else {
        context.log.error(`スキル状態をcooldownに変更できません(state:${skill.state.type})`)
      }
      break
    }
    default: {
      context.log.error(`スキル状態をcooldownに変更できません transition:${skill.state.transition}`)
    }
  }
  throw Error()
}

/**
 * スキル状態の変化を調べて更新する（破壊的）
 * 
 * 以下の状態に依存する`Skill#state`の遷移を調べる
 * - `SkillActiveTimeout` 現在時刻に依存：指定時刻を過ぎたら`cooldown`へ遷移
 * - `SkillCooldownTimeout` 現在時刻に依存：指定時刻を過ぎたら`idle/unable`へ遷移
 * - 遷移タイプ`auto-condition` スキル状態自体が編成状態に依存
 * 
 * スキル状態の整合性も同時に確認する
 * @param state 現在の状態
 */
export function refreshSkillState(context: Context, state: UserState) {
  const indices = state.formation.map((_, idx) => idx)
  /* 
  更新差分が無くなるまで繰り返す 
  でんこによってはスキル状態の決定が他でんこのスキル状態に依存する場合がある
  そのため編成順序（=処理の順序）次第では正しく更新できないおそれあり
  */
  let anyChange = true
  while (anyChange) {
    anyChange = indices.some(idx => refreshSkillStateOne(context, state, idx))
  }
}

/**
 * 指定した編成位置のでんこスキル状態を更新する（破壊的）
 * @param context 
 * @param state 
 * @param idx 
 * @returns true if any change, or false
 */
export function refreshSkillStateOne(context: Context, state: UserState, idx: number): boolean {
  const denco = state.formation[idx]
  if (denco.skill.type !== "possess") {
    return false
  }
  let result: boolean = false
  const skill = denco.skill
  switch (skill.state.transition) {
    case "always": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "active",
          transition: "always",
          data: undefined,
        }
        result = true
      }
      break
    }
    case "manual": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "idle",
          transition: "manual",
          data: undefined
        }
        result = true
      }
      result = refreshTimeout(context, state, idx) || result
      break
    }
    case "manual-condition": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          transition: "manual-condition",
          data: undefined
        }
        result = true
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
        }
        const enable = predicate(context, state, self)
        if (enable && skill.state.type === "unable") {
          context.log.log(`スキル状態の変更：${denco.name} unable -> idle`)
          skill.state = {
            type: "idle",
            transition: "manual-condition",
            data: undefined
          }
          result = true
        } else if (!enable && skill.state.type === "idle") {
          context.log.log(`スキル状態の変更：${denco.name} idle -> unable`)
          skill.state = {
            type: "unable",
            transition: "manual-condition",
            data: undefined
          }
          result = true
        }
        break
      } else {
        result = refreshTimeout(context, state, idx) || result
        break
      }
    }
    case "auto": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          transition: "auto",
          data: undefined
        }
        result = true
      }
      result = refreshTimeout(context, state, idx) || result
      break
    }
    case "auto-condition": {
      if (skill.state.type === "not_init") {
        skill.state = {
          type: "unable",
          transition: "auto-condition",
          data: undefined
        }
        result = true
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
      }
      const active = predicate(context, state, self)
      if (active && skill.state.type === "unable") {
        context.log.log(`スキル状態の変更：${denco.name} unable -> active`)
        skill.state = {
          type: "active",
          transition: "auto-condition",
          data: undefined
        }
        result = true
        const callback = skill.onActivated
        if (callback) {
          // 更新したスキル状態をコピー
          self = {
            ...copyDencoState(denco),
            carIndex: idx,
            skill: skill,
          }
          const next = callback(context, state, self)
          if (next) copyUserStateTo(next, state) // TODO copyUserStateTo必要？
        }
      } else if (!active && skill.state.type === "active") {
        context.log.log(`スキル状態の変更：${denco.name} active -> unable`)
        skill.state = {
          type: "unable",
          transition: "auto-condition",
          data: undefined
        }
        result = true
      }
      break
    }
  }
  return result
}

/**
 * 指定時間に応じたスキル状態の更新を行う
 * @param context 
 * @param state 
 * @param idx 
 * @returns true if any change
 */
function refreshTimeout(context: Context, state: UserState, idx: number): boolean {
  const time = context.currentTime
  const denco = state.formation[idx]
  const skill = denco.skill
  if (skill.type !== "possess") return false
  let result = false
  if (skill.state.type === "active") {
    const data = skill.state.data
    if (data && data.activeTimeout <= time) {
      context.log.log(`スキル状態の変更：${denco.name} active -> cooldown (timeout:${moment(data.activeTimeout).format(TIME_FORMAT)})`)
      skill.state = {
        type: "cooldown",
        transition: skill.state.transition,
        data: {
          cooldownTimeout: data.cooldownTimeout
        }
      }
      result = true
    }
  }
  if (skill.state.type === "cooldown") {
    const data = skill.state.data
    if (data.cooldownTimeout <= time) {
      switch (skill.state.transition) {
        case "manual": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> idle (timeout:${moment(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.state = {
            type: "idle",
            transition: "manual",
            data: undefined
          }
          result = true
          break
        }
        case "manual-condition": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${moment(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.state = {
            type: "unable",
            transition: "manual-condition",
            data: undefined
          }
          // check unable <=> idle
          result = refreshSkillStateOne(context, state, idx) || result
          break
        }
        case "auto": {
          context.log.log(`スキル状態の変更：${denco.name} cooldown -> unable (timeout:${moment(data.cooldownTimeout).format(TIME_FORMAT)})`)
          skill.state = {
            type: "unable",
            transition: "auto",
            data: undefined
          }
          result = true
          break
        }
      }
    }
  }
  return result
}