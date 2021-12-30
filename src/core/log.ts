import { AccessDencoState, AccessSide, AccessState, TriggeredSkill } from "./access"
import { Denco, DencoAttribute } from "./denco"

export class Logger {

  constructor(type: string, write_console: boolean = true) {
    this.type = type
    this.time = Date.now()
    this.write_console = write_console
  }

  type: string
  time: number
  logs: Array<Log> = []
  write_console: boolean

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
    if (this.write_console) {
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

export function formatAccessDetail(result: AccessState, which: AccessSide, width: number = 80): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"

  // アクセス結果の表示
  var title = "access"
  if (which === "offense" && result.link_success) {
    title += "/connect"
  } else if (which === "defense" && result.link_disconneted) {
    title += "/disconnect"
  }
  str += formatLine(title, width)
  str += formatLine("東京", width)
  str += formatLine("とうきょう", width)

  //which === "offense"
  var left_side: AccessDencoState | null = result.defense
  var right_side: AccessDencoState = result.offense
  var left: Denco | null = result.defense ? result.defense.formation[result.defense.car_index].denco : null
  var right: Denco = result.offense.formation[result.offense.car_index].denco
  if (which === "defense" && result.defense) {
    right = result.defense.formation[result.defense.car_index].denco
    left = result.offense.formation[result.offense.car_index].denco
    right_side = result.defense
    left_side = result.offense
  }
  const icon_width = 14
  str += "┃" + formatSpace(left ? left.name : "不在", icon_width)
  if (which === "offense") {
    str += "╱" + "─".repeat(width - 4 - icon_width * 2) + "┐"
  } else {
    str += "┌" + "─".repeat(width - 4 - icon_width * 2) + "╲"
  }
  str += formatSpace(right.name, icon_width) + "┃\n"

  str += "┃" + formatSpace(left ? `Lv.${left.level}` : "", icon_width)
  if (which === "offense") {
    str += "╲" + "─".repeat(width - 4 - icon_width * 2) + "┘"
  } else {
    str += "└" + "─".repeat(width - 4 - icon_width * 2) + "╱"
  }
  str += formatSpace(`Lv.${right.level}`, icon_width) + "┃\n"

  str += "┃" + (left ? formatAttr(left.attr, icon_width) : " ".repeat(icon_width))
  str += formatSpace(formatPastTime(Date.now(), result.log.time), width - icon_width * 2 - 2)
  str += formatAttr(right.attr, icon_width) + "┃\n"

  const table_left = Math.floor((width - 6 - 2) / 2)
  const table_right = width - 6 - 2 - table_left
  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(left ? `${left.name}のマスター` : "", table_left, "left")
  str += " user "
  str += formatSpace(`${right.name}のマスター`, table_right, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatSkills(left_side), table_left, "left")
  str += " skill"
  str += formatSpace(formatSkills(right_side), table_right, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatDamage(left_side), table_left, "left")
  str += "damage"
  str += formatSpace(formatDamage(right_side), table_right, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatLinkTime(left_side), table_left, "left")
  str += " link "
  str += formatSpace(formatLinkTime(right_side), table_right, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(left_side ? left_side.score.toString() : "", table_left, "left")
  str += " score"
  str += formatSpace(right_side.score.toString(), table_right, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(left_side ? left_side.exp.toString() : "", table_left, "left")
  str += "  exp "
  str += formatSpace(right_side.exp.toString(), table_right, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  var mes = ""
  if (which === "offense") {
    mes = result.link_success ? `${right.name}がリンクを開始` : `${right.name}がアクセス`
  } else {
    mes = result.link_disconneted ? `${right.name}のリンクが解除` : "リンク継続中"
  }
  str += formatLine(mes, width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str

}

export function formatAccessEvent(result: AccessState, which: AccessSide, width: number = 50): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"

  // アクセス結果の表示
  var title = "access"
  if (which === "offense" && result.link_success) {
    title += "/connect"
  } else if (which === "defense" && result.link_disconneted) {
    title += "/disconnect"
  }
  str += formatLine(title, width)
  str += formatLine("東京", width)
  str += formatLine("とうきょう", width)

  //which === "offense"
  var left = result.defense ? result.defense.formation[result.defense.car_index].denco : null
  var right = result.offense.formation[result.offense.car_index].denco
  if (which === "defense" && result.defense) {
    right = result.defense.formation[result.defense.car_index].denco
    left = result.offense.formation[result.offense.car_index].denco
  }
  const icon_width = 14
  str += "┃" + formatSpace(left ? left.name : "不在", icon_width)
  if (which === "offense") {
    str += "╱" + "─".repeat(width - 4 - icon_width * 2) + "┐"
  } else {
    str += "┌" + "─".repeat(width - 4 - icon_width * 2) + "╲"
  } str += formatSpace(right.name, icon_width) + "┃\n"

  str += "┃" + formatSpace(left ? `Lv.${left.level}` : "", icon_width)
  if (which === "offense") {
    str += "╲" + "─".repeat(width - 4 - icon_width * 2) + "┘"
  } else {
    str += "└" + "─".repeat(width - 4 - icon_width * 2) + "╱"
  } str += formatSpace(`Lv.${right.level}`, icon_width) + "┃\n"

  str += "┃" + formatSpace(left ? `${left.name}のマスター` : "", icon_width)
  str += formatSpace(formatPastTime(Date.now(), result.log.time), width - icon_width * 2 - 2)
  str += formatSpace(`${right.name}のマスター`, icon_width) + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  var mes = ""
  if (which === "offense") {
    mes = result.link_success ? `${right.name}がリンクを開始` : `${right.name}がアクセス`
  } else {
    mes = result.link_disconneted ? `${right.name}のリンクが解除` : "リンク継続中"
  }
  str += formatLine(mes, width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}

function formatDamage(state?: AccessDencoState | null): string {
  if (!state) return ""
  const d = state.damage
  if (!d) return "-"
  return d.value.toString()
}

function formatLinkTime(state?: AccessDencoState | null): string {
  if (!state) return ""
  const d = state.formation[state.car_index]
  if (d.who === "defense") return "10秒"
  return "-"
}

function formatSkills(state?: AccessDencoState | null): string {
  if (!state) return ""
  const skills = state.triggered_skills
  if (skills.length === 0) return "-"
  return skills.map(s => s.denco.name).join(",")
}

function formatAttr(attr: DencoAttribute, width: number): string {
  if (attr === "eco") {
    return " " + formatSpace("eco🌳", width) + " "
  } else if (attr === "heat") {
    return " " + formatSpace("heat🔥", width) + " "
  } else if (attr === "cool") {
    return " " + formatSpace("cool💧", width) + " "
  } else {
    return " " + formatSpace("flat💿", width) + " "
  }
}

const char_start = " ".charCodeAt(0)
const char_end = "~".charCodeAt(0)
const char_list = ["…".charCodeAt(0)]
function charLen(code: number): number {
  if (char_start <= code && code <= char_end) return 1
  if (char_list.includes(code)) return 1
  return 2
}

function len(value: string): number {
  var sum = 0
  for (let i = 0; i < value.length; i++) {
    let code = value.charCodeAt(i)
    sum += charLen(code)
  }
  return sum
}

function subString(value: string, width: number): string {
  if (width < 0) return ""
  if (width === 1) {
    return len(value) === 1 ? value : "…"
  }
  var str = ""
  var length = 0
  for (let i = 0; i < value.length; i++) {
    let code = value.charCodeAt(i)
    var v = charLen(code)
    if (length + v > width) {
      while (length + 1 > width) {
        code = str.charCodeAt(str.length - 1)
        v = charLen(code)
        length -= v
        str = str.slice(0, -1)
      }
      return str + "…"
    }
    str += value.charAt(i)
    length += v
  }
  return str
}

function formatPastTime(now: number, time: number): string {
  const sec = Math.floor((now - time) / 1000)
  if (sec < 10) {
    return "数秒前"
  }
  if (sec < 60) {
    return "数十秒前"
  }
  const min = Math.floor(sec / 60)
  if (min < 60) {
    return `${min}分前`
  }
  const hour = Math.floor(min / 60)
  return `${hour}時間${min % 60}分前`
}

function formatSpace(value: string, width: number, gravity: "left" | "center" | "right" = "center"): string {
  value = subString(value, width)
  const space = width - len(value)
  var v = Math.floor(space / 2)
  if (gravity === "left") {
    v = 0
  } else if (gravity === "right") {
    v = space
  }
  return " ".repeat(v) + value + " ".repeat(space - v)
}

function formatLine(value: string, width: number, end: string = "┃"): string {
  const length = width - 2
  return end + formatSpace(value, length) + end + "\n"
}