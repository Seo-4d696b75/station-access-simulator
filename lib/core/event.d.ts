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
/**
 * レベルアップのイベント情報
 */
export interface LevelupDenco {
    readonly time: number;
    readonly after: ReadonlyState<DencoState>;
    readonly before: ReadonlyState<DencoState>;
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
     * - 追加された経験値によるレベルアップ直前
     */
    readonly access: ReadonlyState<AccessState>;
    /**
     * アクセスの攻撃側・守備側のどちら側か
     */
    readonly which: AccessSide;
}
export declare type AccessEvent = EventBase<"access", AccessEventData>;
export declare type RebootEvent = EventBase<"reboot", LinksResult>;
export declare type SkillTriggerEvent = EventBase<"skill_trigger", EventTriggeredSkill>;
export declare type LevelupEvent = EventBase<"levelup", LevelupDenco>;
/**
 * タイムライン上に表示される各ダイアログをモデル化
 */
export declare type Event = AccessEvent | RebootEvent | SkillTriggerEvent | LevelupEvent;
export {};
