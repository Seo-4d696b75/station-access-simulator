

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