import { AccessSide, AccessState } from "./access"
import { Denco } from "./denco"
import { LinkResult } from "./station"

export type EventType = 
  "access" | 
  "reboot" |
  "skill_trigger" |
  "levelup"

interface EventBase<T,V = undefined> {
  type: T,
  data: V
} 

export type AccessEvent = EventBase<"access", AccessState>
export type RebootEvent = EventBase<"reboot", {
  denco: Denco
  which: AccessSide
  link: LinkResult[]
}>

export type SkillTriggerEvent = EventBase<"skill_trigger", Denco>
export type LevelupEvent = EventBase<"levelup", {
  before: Denco,
  after: Denco
}>

/**
 * タイムライン上に表示される各ダイアログをモデル化
 */
export type Event = 
  AccessEvent |
  RebootEvent |
  SkillTriggerEvent |
  LevelupEvent