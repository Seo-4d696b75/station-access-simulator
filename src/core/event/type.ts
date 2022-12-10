import { EventTriggeredSkill } from "."
import { AccessResult, AccessSide, AccessUserResult } from "../access"
import { DencoState } from "../denco"
import { LinksResult } from "../station"

export type EventType =
  "access" |
  "reboot" |
  "skill_activated" |
  "skill_trigger" |
  "levelup"

interface EventBase<T, V = undefined> {
  type: T,
  data: V
}

/**
 * レベルアップのイベント情報
 */
export interface LevelupDenco {
  time: number
  after: DencoState
  before: DencoState
}

export type AccessEventUser = Omit<AccessUserResult, "event" | "queue">

/**
 * アクセスのイベント情報
 * 
 * 各でんこの状態はアクセス処理終了直後の状態であり、 
 * - アクセスによるリンクの解除は反映済
 * - 解除されたリンクスコア・経験値は追加済み
 * - 追加された経験値によるレベルアップ済み
 */
export interface AccessEventData extends Omit<AccessResult, "offense" | "defense"> {

  /**
   * アクセスの攻撃側・守備側のどちら側か
   */
  which: AccessSide

  offense: AccessEventUser
  defense?: AccessEventUser
}

/**
 * 状態遷移タイプが`auto`のスキルが有効化されたイベント
 * 
 * 他の遷移タイプと異なり、ユーザ操作とは別に自動的にスキルが有効化されます
 */
export interface SkillActivatedEventData {
  time: number
  carIndex: number
  /**
   * 有効化されたスキルを保有する本人の状態
   * 
   * スキル状態が`active`に遷移した直後の状態
   */
  denco: DencoState
  skillName: string
}

export type AccessEvent = EventBase<"access", AccessEventData>
export type RebootEvent = EventBase<"reboot", LinksResult>
export type SkillActivatedEvent = EventBase<"skill_activated", SkillActivatedEventData>
export type SkillTriggerEvent = EventBase<"skill_trigger", EventTriggeredSkill>
export type LevelupEvent = EventBase<"levelup", LevelupDenco>

/**
 * タイムライン上に表示される各ダイアログをモデル化
 */
export type Event =
  AccessEvent |
  RebootEvent |
  SkillActivatedEvent |
  SkillTriggerEvent |
  LevelupEvent