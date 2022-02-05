/**
 * スキル発動などtrue/falseの条件が確率に依存する場合の挙動を指定できます
 * - "normal": 疑似乱数を用いて指定された確率で計算
 * - "ignore": 必ずfalse
 * - "force": 必ずtrue
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
     * - "now": `Date.now()`で参照（デフォルト値）
     * - number: 指定した時刻で処理
     */
    clock: "now" | number;
}
export declare function initContext(type?: string, seed?: string, console?: boolean): Context;
export declare function setClock(context: Readonly<Context>, time?: number): Context;
/**
 * `getCurrentTime`が返す現在時刻の値で固定する
 * @param context clock
 * @returns 現在時刻で`clock`で固定した新しいcontext 他の状態は同じオブジェクトへの参照を維持する
 */
export declare function fixClock(context: Readonly<Context>): Context;
/**
 * 現在時刻を取得する
 * @param context clockの値に従って`Date.now()`もしくは固定された時刻を参照する
 * @returns unix time [ms]
 */
export declare function getCurrentTime(context: Context): number;
/**
 * Contextの下で実行された処理のログを記録する
 */
export declare class Logger {
    constructor(type: string, writeConsole?: boolean);
    type: string;
    time: number;
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
