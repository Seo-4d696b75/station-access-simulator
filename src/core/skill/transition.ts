

/**
 * スキル状態の遷移の種類
 * 
 * - `manual` ユーザがスキルボタンを押すると有効化されるタイプ `idle > active > cooldown >`
 * - `manual-condition` `manual`と同様にユーザ操作で有効化されるが特定の条件でしか有効化できない `unable <> idle > active > cooldown >`
 * - `auto` 特定の条件で自動的に有効化される `unable > active > cooldown`
 * - `auto-condition` 特定の条件で自動的に有効・無効状態を遷移する クールダウンが無い `unable <> active`
 * - `always` 常に有効化されている
 */
export type SkillTransitionType =
  "manual" |
  "manual-condition" | // FIXME under score
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
export type SkillTransitionState =
  "not_init" |
  "unable" |
  "idle" |
  "active" |
  "cooldown"

interface SkillTransitionBase<Type extends SkillTransitionType, State extends SkillTransitionState, D = undefined> {
  // type: Type,
  state: State,
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
   * スキルが発動した時刻 [ms]
   */
  activatedAt: number

  /**
   * スキル状態が`active > cooldown`へ遷移する時刻 [ms]
   * activated <= activeTimeout
   */
  activeTimeout: number
}

export type SkillDeactivateStrategy = "default_timeout" | "self_deactivate"

type ManualSkillTransition =
  SkillTransitionBase<"manual", "idle"> |
  SkillTransitionBase<"manual", "active", SkillActiveTimeout | undefined> |
  SkillTransitionBase<"manual", "cooldown", SkillCooldownTimeout>

type ManualConditionSkillTransition =
  SkillTransitionBase<"manual-condition", "unable"> |
  SkillTransitionBase<"manual-condition", "idle"> |
  SkillTransitionBase<"manual-condition", "active", SkillActiveTimeout | undefined> |
  SkillTransitionBase<"manual-condition", "cooldown", SkillCooldownTimeout>

type AutoSkillTransition =
  SkillTransitionBase<"auto", "unable"> |
  SkillTransitionBase<"auto", "active", SkillActiveTimeout | undefined> |
  SkillTransitionBase<"auto", "cooldown", SkillCooldownTimeout>

type AutoConditionSkillTransition =
  SkillTransitionBase<"auto-condition", "unable"> |
  SkillTransitionBase<"auto-condition", "active">

type AlwaysSkillTransition =
  SkillTransitionBase<"always", "active">

export type SkillTransition<T extends SkillTransitionType> =
  SkillTransitionBase<T, "not_init"> | (
    T extends "manual" ? ManualSkillTransition :
    T extends "manual-condition" ? ManualConditionSkillTransition :
    T extends "auto" ? AutoSkillTransition :
    T extends "auto-condition" ? AutoConditionSkillTransition :
    T extends "always" ? AlwaysSkillTransition : never
  )