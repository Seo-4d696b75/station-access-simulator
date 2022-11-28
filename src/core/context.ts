import dayjs from 'dayjs';
import seedrandom from "seedrandom";
import { ScorePredicate } from "..";
import { DATE_TIME_FORMAT } from "./date";
import { Random, RandomMode } from "./random";

/**
 * 実行される各種処理に紐づけられる
 * 
 * このオブジェクトは内部状態を保持します
 */
export class Context {

  constructor(log: Logger, random: Random, clock: "now" | number, score?: Partial<ScorePredicate>) {
    this.log = log
    this.random = random
    this.clock = clock
    this.scorePredicate = score
  }

  /**
   * 処理中のログを記録する
   */
  readonly log: Logger
  /**
   * 処理中の確率依存処理を計算する
   */
  random: Random
  /**
   * 処理中の現在時刻の取得方法
   * 
   * - "now": `dayjs()`で参照（デフォルト値）
   * - number: 指定した時刻で処理(unix time [ms])
   * 
   * 処理中の各時刻はUnix Time(ms)として記録し、
   * 時刻や日付などを処理する場合のタイムゾーンは次のように固定している 
   * 変更が必要な場合は同様に再定義すること
   * ```
   * import dayjs from 'dayjs';
   * import timezone from 'dayjs/plugin/timezone';
   * 
   * dayjs.extend(timezone)
   * dayjs.tz.setDefault("Asia/Tokyo")
   * ```
   */
  clock: "now" | number

  /**
   * スコア・経験値の計算方法を指定します
   */
  scorePredicate?: Partial<ScorePredicate>

  /**
   * 時刻を固定する
   * 
   * `clock`に直接値を代入する場合と同じ効果を持ちますが、様々な時間表現を受け取ることができます
   * @param time dayjsで解釈できる時刻の表現
   */
  setClock(time: number | string | Date | dayjs.Dayjs) {
    this.clock = dayjs(time).valueOf()
  }

  /**
   * 現在時刻を取得する
   * 
   * clockの値に従って`dayjs()`もしくは固定された時刻を参照する
   * 
   * @returns unix time [ms]
   */
  get currentTime(): number {
    return this.clock === "now" ? dayjs().valueOf() : this.clock
  }

  assert(value: unknown, message?: string | Error): asserts value {
    if (value) return
    this.log.error(message?.toString() ?? "assertion failed")
  }
}

export function assert(value: unknown, message?: string | Error): asserts value {
  if (value) return
  const e = typeof message === "string" ? new SimulatorError(message) : message
  throw e
}


/**
 * `currentTime`が返す現在時刻で固定して処理する
 * 
 * @param context 対象のcontext
 * @param block 固定した時刻で処理する
 */
export function withFixedClock<R>(context: Context, block: (now: number) => R): R {
  const clock = context.clock
  if (clock === "now") {
    try {
      const now = context.currentTime
      context.clock = now
      return block(now)
    } catch (e) {
      // ここではハンドリングしない
      throw e
    } finally {
      // 元に戻す
      context.clock = clock
    }
  } else {
    return block(clock)
  }
}

/**
 * contextを初期化する
 * 
 * @param type 処理の名前(ログに記録)
 * @param seed 処理中に使用する疑似乱数列のseed値 {@link seedrandom} default: `"test"`
 * @param console 処理中の詳細をコンソールに出力するか default: `true`
 * @returns 
 */
export function initContext(type: string = "test", seed: string = "test", console: boolean = true): Context {
  return new Context(
    new Logger(type, console),
    Object.assign(seedrandom(seed), { mode: "normal" as RandomMode }),
    "now",
  )
}

export class SimulatorError extends Error {
  constructor(...args: any[]) {
    super(...args)
    this.name = this.constructor.name

    Error.captureStackTrace(this, SimulatorError)
    const stack = this.stack
    if (stack) {
      this.stack = stack.split("\n")
        .filter((str, idx) => idx !== 1)
        .join("\n")
    }
  }
}

/**
 * Contextの下で実行された処理のログを記録する
 */
export class Logger {

  constructor(type: string, writeConsole: boolean = true) {
    this.type = type
    this.time = dayjs()
    this.writeConsole = writeConsole
  }

  type: string
  time: dayjs.Dayjs
  logs: Log[] = []
  writeConsole: boolean

  toString(): string {
    var str = ""
    str += "========================\n"
    str += `type: ${this.type}\n`
    str += `time: ${this.time.format(DATE_TIME_FORMAT)}\n`
    str += "------------------------\n"
    this.logs.forEach(log => {
      str += `[${log.tag}] ${log.message}\n`
    })
    str += "========================"
    return str
  }

  appendMessage(tag: LogTag, message: string) {
    this.logs.push({
      tag: tag,
      message: message
    })
    if (this.writeConsole) {
      if (tag === LogTag.LOG) {
        console.log(message)
      } else if (tag === LogTag.WARN) {
        console.warn(message)
      } else if (tag === LogTag.ERR) {
        console.error(message)
      }
    }
  }

  log(message: string) {
    this.appendMessage(LogTag.LOG, message)
  }

  warn(message: string) {
    this.appendMessage(LogTag.WARN, message)
  }

  error(message: string): never {
    this.appendMessage(LogTag.ERR, message)
    throw new SimulatorError(message)
  }

}

enum LogTag {
  LOG = "L",
  WARN = "W",
  ERR = "E",
}

interface Log {
  tag: LogTag
  message: string
}
