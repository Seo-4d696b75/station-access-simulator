import seedrandom from "seedrandom"

/**
 * スキル発動などtrue/falseの条件が確率に依存する場合の挙動を指定できます
 * - "normal": 疑似乱数を用いて指定された確率で計算
 * - "ignore": 必ずfalse
 * - "force": 必ずtrue
 */
export type RandomMode =
  "normal" |
  "ignore" |
  "force"

/**
 * スキル発動の有無など確率を計算する
 */
export interface Random {
  mode: RandomMode
  (): number
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
  log: Logger
  /**
   * 処理中の確率依存処理を計算する
   */
  random: Random
  /**
   * 処理中の現在時刻の取得方法
   * - "now": `Date.now()`で参照（デフォルト値）
   * - number: 指定した時刻で処理
   */
  clock: "now" | number
}

export function initContext(type: string = "test", seed: string = "test", console: boolean = true): Context {
  return {
    log: new Logger(type, console),
    random: Object.assign(seedrandom(seed), { mode: "normal" as RandomMode }),
    clock: "now"
  }
}

export function setClock(context: Readonly<Context>, time?: number): Context {
  return {
    ...context,
    clock: time ?? "now",
  }
}

/**
 * `getCurrentTime`が返す現在時刻の値で固定する
 * @param context clock
 * @returns 現在時刻で`clock`で固定した新しいcontext 他の状態は同じオブジェクトへの参照を維持する
 */
export function fixClock(context: Readonly<Context>): Context {
  return {
    ...context,
    clock: getCurrentTime(context),
  }
}

/**
 * 現在時刻を取得する
 * @param context clockの値に従って`Date.now()`もしくは固定された時刻を参照する
 * @returns unix time [ms]
 */
export function getCurrentTime(context: Context): number {
  return context.clock === "now" ? Date.now() : context.clock
}

/**
 * Contextの下で実行された処理のログを記録する
 */
export class Logger {

  constructor(type: string, writeConsole: boolean = true) {
    this.type = type
    this.time = Date.now()
    this.writeConsole = writeConsole
  }

  type: string
  time: number
  logs: Log[] = []
  writeConsole: boolean

  toString(): string {
    var str = ""
    str += "========================\n"
    str += `type: ${this.type}\n`
    str += `time: ${new Date(this.time).toTimeString()}\n`
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

  error(message: string) {
    this.appendMessage(LogTag.ERR, message)
    throw Error(message)
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
