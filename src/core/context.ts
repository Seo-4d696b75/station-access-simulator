import moment, { Moment } from "moment-timezone"
import seedrandom from "seedrandom"
import { ScorePredicate } from ".."
import { Random, RandomMode } from "./random"

// タイムゾーン指定
moment.tz.setDefault("Asia/Tokyo")

export const TIME_FORMAT = "HH:mm:ss.SSS"
export const DATE_TIME_FORMAT = "YYYY-MM-DD'T'HH:mm:ss.SSS"

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
  clock: "now" | number

  /**
   * スコア・経験値の計算方法を指定します
   */
  scorePredicate?: Partial<ScorePredicate>

  /**
   * 時刻を固定する
   * 
   * `clock`に直接値を代入する場合と同じ効果を持ちますが、様々な時間表現を受け取ることができます
   * @param time momentで解釈できる時刻の表現
   */
  setClock(time: number | string | Date | Moment) {
    this.clock = moment(time).valueOf()
  }

  /**
   * 現在時刻を取得する
   * 
   * clockの値に従って`moment()`もしくは固定された時刻を参照する
   * 
   * @returns unix time [ms]
   */
  get currentTime(): number {
    return this.clock === "now" ? moment().valueOf() : this.clock
  }

  /**
   * `getCurrentTime`が返す現在時刻の値で固定する
   * 
   * @returns 現在時刻`clock`で固定した新しいcontext 他の状態は同じオブジェクトへの参照を維持する
   */
  fixClock(): Context {
    return new Context(
      this.log,
      this.random,
      this.currentTime,
      this.scorePredicate,
    )
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
    this.time = moment()
    this.writeConsole = writeConsole
  }

  type: string
  time: Moment
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
