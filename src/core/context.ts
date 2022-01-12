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
  log: Logger
  random: Random
}

export function initContext(type: string = "test", seed: string = "test", console: boolean = true): Context {
  return {
    log: new Logger(type, console),
    random: Object.assign(seedrandom(seed), { mode: "normal" as RandomMode })
  }
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
