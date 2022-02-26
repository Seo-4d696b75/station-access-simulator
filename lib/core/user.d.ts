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
interface EventQueueEntryBase<T, E = undefined> {
    readonly type: T;
    readonly time: number;
    readonly data: E;
}
export declare type EventQueueEntry = EventQueueEntryBase<"skill", SkillEventReservation> | EventQueueEntryBase<"hour_cycle">;
/**
 * ユーザの状態のうちライブラリ側で操作しない情報
 *
 * このオブジェクトのプロパティはライブラリ側からは参照のみ
 */
export interface UserParam {
    name: string;
    /**
     * アクセス時の移動距離 単位：km
     */
    dailyDistance: number;
}
/**
 * ユーザの状態を表現する
 *
 * 原則としてこの状態変数が操作の起点になる
 */
export interface UserState {
    /**
     * ユーザの詳細情報
     */
    user: UserParam;
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
export declare function initUser(context: Context, userName: string, formation?: ReadonlyState<DencoState[]>, param?: Partial<UserParam>): UserState;
export declare function changeFormation(context: Context, current: ReadonlyState<UserState>, formation: ReadonlyState<DencoState[]>): UserState;
export declare function copyUserStateTo(src: ReadonlyState<UserState>, dst: UserState): void;
export declare function copyUserState(state: ReadonlyState<UserState>): UserState;
export declare function copyUserParam(param: ReadonlyState<UserParam>): UserParam;
/**
 * 現在の編成状態を更新する
 *
 * - 獲得経験値によるレベルアップ
 * - 現在時刻に応じたスキル状態の変更
 * - 現在時刻に応じて予約されたスキル発動型イベントを評価する
 * @param context
 * @param state 現在の状態 引数に渡した現在の状態は変更されません
 * @returns 新しい状態 現在の状態をコピーしてから更新します
 */
export declare function refreshState(context: Context, state: ReadonlyState<UserState>): UserState;
/**
 * {@link refreshState} の破壊的バージョン
 */
export declare function _refreshState(context: Context, state: UserState): void;
/**
 * 現在の状態の経験値の確認してレベルアップ処理を行う(破壊的)
 * @param state 現在の状態
 * @returns
 */
export declare function refreshEXPState(context: Context, state: UserState): void;
export {};
