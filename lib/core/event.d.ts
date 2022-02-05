import { AccessSide, AccessState } from "./access";
import { DencoState } from "./denco";
import { EventTriggeredSkill } from "./skillEvent";
import { LinksResult } from "./station";
import { ReadonlyState } from "./user";
export declare type EventType = "access" | "reboot" | "skill_trigger" | "levelup";
interface EventBase<T, V = undefined> {
    readonly type: T;
    readonly data: V;
}
export declare type LevelupDenco = Readonly<{
    time: number;
    after: ReadonlyState<DencoState>;
    before: ReadonlyState<DencoState>;
}>;
export declare type AccessEventData = Readonly<{
    access: ReadonlyState<AccessState>;
    which: AccessSide;
}>;
export declare type AccessEvent = EventBase<"access", AccessEventData>;
export declare type RebootEvent = EventBase<"reboot", LinksResult>;
export declare type SkillTriggerEvent = EventBase<"skill_trigger", EventTriggeredSkill>;
export declare type LevelupEvent = EventBase<"levelup", LevelupDenco>;
/**
 * タイムライン上に表示される各ダイアログをモデル化
 */
export declare type Event = AccessEvent | RebootEvent | SkillTriggerEvent | LevelupEvent;
export {};
