import { AccessSide, AccessState } from "./access"
import { Denco } from "./denco"
import { TriggeredSkill } from "./skillEvent"
import { LinksResult } from "./station"

export type EventType = 
  "access" | 
  "reboot" |
  "skill_trigger" |
  "levelup"

interface EventBase<T,V = undefined> {
  type: T,
  data: V
} 

export interface LevelupDenco {
  time: number
  which: AccessSide
  after: Denco
  before: Denco
}

export type AccessEvent = EventBase<"access", AccessState>
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