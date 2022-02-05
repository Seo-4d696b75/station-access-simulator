import { DencoState } from "./denco";
import { Event } from "./event";
import { Context } from "./context";
import { SkillEventReservation } from "./skillEvent";
declare type Primitive = number | string | boolean | bigint | symbol | undefined | null;
declare type Builtin = Primitive | Function | Date | Error | RegExp;
/**
 * 変更不可な状態を表す型
 */
export declare type ReadonlyState<T> = T extends (Builtin | Event) ? T : {
    readonly [key in keyof T]: ReadonlyState<T[key]>;
};
export interface User {
    readonly name: string;
}
interface EventQueueEntryBase<T, E = undefined> {
    readonly type: T;
    readonly time: number;
    readonly data: E;
}
export declare type EventQueueEntry = EventQueueEntryBase<"skill", SkillEventReservation> | EventQueueEntryBase<"hour_cycle">;
/**
 * ユーザの状態を表現する
 *
 * 原則としてこの状態変数が操作の起点になる
 */
export interface UserState extends User {
    /**
     * 現在の編成状態
     */
    formation: DencoState[];
    /**
     * タイムライン上に表示されるイベント一覧
     */
    event: Event[];
    /**
     * 指定時刻に処理するイベントの待機列 FIFO
     */
    queue: EventQueueEntry[];
}
export interface FormationPosition {
    /**
     * 主体となるでんこの編成内のindex
     * 0 <= carIndex < formation.length
     */
    carIndex: number;
}
export declare function getTargetDenco<T>(state: {
    formation: readonly T[];
    carIndex: number;
}): T;
export declare function initUser(context: Context, userName: string, formation?: ReadonlyState<DencoState[]>): UserState;
export declare function changeFormation(context: Context, current: ReadonlyState<UserState>, formation: ReadonlyState<DencoState[]>): UserState;
export declare function copyUserState(state: ReadonlyState<UserState>): UserState;
/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う
 * @param next 現在の状態
 * @returns
 */
export declare function refreshEXPState(context: Context, state: ReadonlyState<UserState>): UserState;
/**
 * 現在時刻に依存する状態を更新する
 *
 * - 指定時刻にスキル状態を変更する
 * - 指定時刻にスキル発動型イベントを評価する
 *
 * @param context
 * @param state
 * @returns 更新された新しい状態
 */
export declare function refreshCurrentTime(context: Context, state: ReadonlyState<UserState>): UserState;
export {};
