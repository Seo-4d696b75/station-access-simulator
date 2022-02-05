import * as Access from "./access";
import { Context } from "./context";
import { Denco, DencoState } from "./denco";
import { Event } from "./event";
import { ActiveSkill, SkillTrigger } from "./skill";
import { ReadonlyState, User, UserState } from "./user";
export interface SkillEventDencoState extends DencoState {
    who: "self" | "other";
    carIndex: number;
    skillInvalidated: boolean;
}
export interface EventTriggeredSkill {
    readonly time: number;
    readonly carIndex: number;
    /**
     * 発動したスキルを保有する本人の状態
     *
     * スキルが発動して状態が更新された直後の状態
     */
    readonly denco: ReadonlyState<DencoState>;
    readonly skillName: string;
    readonly step: SkillEventEvaluateStep;
}
export interface SkillEventState {
    time: number;
    user: User;
    formation: SkillEventDencoState[];
    carIndex: number;
    event: Event[];
    probability: SkillTrigger;
    probabilityBoostPercent: number;
}
/**
 * アクセスを除くスキル発動時の評価ステップ
 *
 * 以下の順序で編成内のスキルを評価する
 * ただし、発動確率の関係で発動なしと処理された場合は"self"はスキップされる
 *
 * - probability_check 確率を補正する効果を反映（現状はひいるのみ）
 * - self 評価するスキル本体
 *
 * 評価される編成内のスキルは以下の条件を満たすでんこのスキルを編成順に行われる
 * - スキルを保持している
 * - スキルがactive状態
 * - アクセス直後の場合 {@link SkillLogic}#onAccessComplete は直前のアクセス処理中に無効化スキルの影響を受けていない
 */
export declare type SkillEventEvaluateStep = "probability_check" | "self";
export declare type SkillEventEvaluate = (context: Context, state: SkillEventState, self: ReadonlyState<SkillEventDencoState & ActiveSkill>) => SkillEventState;
/**
 * アクセス直後のタイミングでスキル発動型のイベントを処理する
 *
 * @param context ログ・乱数等の共通状態
 * @param state 現在の状態
 * @param self スキル発動の主体
 * @param access アクセス処理の結果
 * @param probability スキル発動が確率依存かどうか
 * @param evaluate スキル発動時の処理
 * @returns
 */
export declare function evaluateSkillAfterAccess(context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<Access.AccessDencoState & ActiveSkill>, access: ReadonlyState<Access.AccessState>, probability: SkillTrigger, evaluate: SkillEventEvaluate): UserState;
export declare function randomeAccess(context: Context, state: ReadonlyState<SkillEventState>): SkillEventState;
/**
 * 指定した時刻にトリガーされるスキル発動型イベント
 */
export interface SkillEventReservation {
    readonly denco: Denco;
    readonly probability: SkillTrigger;
    readonly evaluate: SkillEventEvaluate;
}
/**
 * スキル発動型イベントを指定時刻に評価するよう待機列に追加する
 *
 * @param context
 * @param state
 * @param entry
 * @returns 待機列に追加した新しい状態
 */
export declare function enqueueSkillEvent(context: Context, state: ReadonlyState<UserState>, time: number, event: SkillEventReservation): UserState;
/**
 * スキルを評価する
 *
 * アクセス中のスキル発動とは別に単独で発動する場合
 * アクセス直後のタイミングで評価する場合は {@link evaluateSkillAfterAccess}
 * @param context
 * @param state 現在の状態
 * @param self 発動するスキル本人
 * @param probability スキル発動確率
 * @param evaluate 評価するスキルの効果内容
 * @returns スキルを評価して更新した新しい状態
 */
export declare function evaluateSkillAtEvent(context: Context, state: ReadonlyState<UserState>, self: Denco, probability: SkillTrigger, evaluate: SkillEventEvaluate): UserState;
/**
 * 待機列中のイベントの指定時刻を現在時刻に参照して必要なら評価を実行する
 * @param context 現在時刻は`context#clock`を参照する {@see getCurrentTime}
 * @param state
 * @returns 発動できるイベントが待機列中に存在する場合は評価を実行した新しい状態
 */
export declare function refreshEventQueue(context: Context, state: ReadonlyState<UserState>): UserState;
