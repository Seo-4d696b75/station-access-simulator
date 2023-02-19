import { AccessResult, AccessSide, AccessUserResult } from "../access"
import { DencoState } from "../denco"
import { LinksResult } from "../station"
import { EventTriggeredSkill } from "./_skill"

export type EventType =
  "access" |
  "reboot" |
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

export type AccessEvent = EventBase<"access", AccessEventData>
export type RebootEvent = EventBase<"reboot", LinksResult>
export type SkillTriggerEvent = EventBase<"skill_trigger", EventTriggeredSkill>
export type LevelupEvent = EventBase<"levelup", LevelupDenco>

/**
 * タイムライン上に表示される各ダイアログをモデル化
 */
export type Event =
  AccessEvent |
  RebootEvent |
  SkillTriggerEvent |
  LevelupEvent