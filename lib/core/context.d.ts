import { Moment } from "moment-timezone";
import { ScorePredicate } from "..";
export declare const TIME_FORMAT = "HH:mm:ss.SSS";
export declare const DATE_TIME_FORMAT = "YYYY-MM-DD'T'HH:mm:ss.SSS";
/**
 * スキル発動などtrue/falseの条件が確率に依存する場合の挙動を指定できます
 * - "normal": 疑似乱数を用いて指定された確率で計算
 * - "ignore": 必ずfalse
 * - "force": 必ずtrue
 *
 * @see {@link random}
 */
export declare type RandomMode = "normal" | "ignore" | "force";
/**
 * スキル発動の有無など確率を計算する
 */
export interface Random {
    mode: RandomMode;
    (): number;
}
/**
 * 実行される各種処理に紐づけられる
 *
 * このオブジェクトは内部状態を保持します
 */
export interface Context {
    /**
     * 処理中のログを記録する
     */
    log: Logger;
    /**
     * 処理中の確率依存処理を計算する
     */
    random: Random;
    /**
     * 処理中の現在時刻の取得方法
     *
     * - "now": `moment()`で参照（デフォルト値）
     * - number: 指定した時刻で処理(unix time [ms])
     *
     * 処理中の各時刻はUnix Time(ms)として記録し、
     * 時刻や日付などを処理する場合のタイムゾーンは次のように固定している
     * 変更が必要な場合は同様に再定義すること
     * ```
     * import moment from "moment-timezone"
     * moment.tz.setDefault("Asia/Tokyo")
     * ```
     */
    clock: "now" | number;
    /**
     * スコア・経験値の計算方法を指定します
     */
    scorePredicate?: Partial<ScorePredicate>;
}
/**
 * contextを初期化する
 *
 * @param type 処理の名前(ログに記録)
 * @param seed 処理中に使用する疑似乱数列のseed値 {@link seedrandom} default: `"test"`
 * @param console 処理中の詳細をコンソールに出力するか default: `true`
 * @returns
 */
export declare function initContext(type?: string, seed?: string, console?: boolean): Context;
/**
 * 指定した時刻に固定する
 * @param context
 * @param time 指定時刻 Dateクラスのタイムゾーンは"+0900"に変更する
 * @returns タイムゾーンは Tokyo +0900 に固定される
 */
export declare function setClock(context: Readonly<Context>, time?: number | string | Date | Moment): Context;
/**
 * `getCurrentTime`が返す現在時刻の値で固定する
 * @param context clock
 * @returns 現在時刻`clock`で固定した新しいcontext 他の状態は同じオブジェクトへの参照を維持する
 */
export declare function fixClock(context: Readonly<Context>): Context;
/**
 * 現在時刻を取得する
 * @param context clockの値に従って`moment()`もしくは固定された時刻を参照する
 * @returns unix time [ms]
 */
export declare function getCurrentTime(context: Context): number;
/**
 * Contextの下で実行された処理のログを記録する
 */
export declare class Logger {
    constructor(type: string, writeConsole?: boolean);
    type: string;
    time: Moment;
    logs: Log[];
    writeConsole: boolean;
    toString(): string;
    appendMessage(tag: LogTag, message: string): void;
    log(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}
declare enum LogTag {
    LOG = "L",
    WARN = "W",
    ERR = "E"
}
interface Log {
    tag: LogTag;
    message: string;
}
export {};
