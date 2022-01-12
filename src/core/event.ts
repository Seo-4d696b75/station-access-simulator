import { AccessSide, AccessState } from "./access"
import { Denco, DencoState } from "./denco"
import { TriggeredSkill } from "./skillEvent"
import { LinksResult } from "./station"
import { ReadonlyState } from "./user"

export type EventType =
  "access" |
  "reboot" |
  "skill_trigger" |
  "levelup"

interface EventBase<T, V = undefined> {
  readonly type: T,
  readonly data: V
}

export interface LevelupDenco {
  time: number
  after: ReadonlyState<DencoState>
  before: ReadonlyState<DencoState>
}

export type AccessEvent = EventBase<"access", {
  access: AccessState
  which: AccessSide
}>
export type RebootEvent = EventBase<"reboot", LinksResult>
export type SkillTriggerEvent = EventBase<"skill_trigger", TriggeredSkill>
export type LevelupEvent = EventBase<"levelup", LevelupDenco>

/**
 * タイムライン上に表示される各ダイアログをモデル化
 */
export type Event =
  AccessEvent |
  RebootEvent |
  SkillTriggerEvent |
  LevelupEvent