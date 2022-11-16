import { EventTriggeredSkill } from "."
import { AccessResult, AccessSide } from "../access"
import { DencoState } from "../denco"
import { ReadonlyState } from "../state"
import { LinksResult } from "../station"

export type EventType =
  "access" |
  "reboot" |
  "skill_trigger" |
  "levelup"

interface EventBase<T, V = undefined> {
  readonly type: T,
  readonly data: V
}

/**
 * レベルアップのイベント情報
 */
export interface LevelupDenco {
  readonly time: number
  readonly after: ReadonlyState<DencoState>
  readonly before: ReadonlyState<DencoState>
}

/**
 * アクセスのイベント情報
 */
export interface AccessEventData {
  /**
   * アクセスの詳細
   * 
   * 各でんこの状態はアクセス処理終了直後の状態であり、 
   * - アクセスによるリンクの解除は反映済
   * - 解除されたリンクスコア・経験値は追加済み
   * - 追加された経験値によるレベルアップ済み
   */
  readonly access: ReadonlyState<AccessResult>
  /**
   * アクセスの攻撃側・守備側のどちら側か
   */
  readonly which: AccessSide
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