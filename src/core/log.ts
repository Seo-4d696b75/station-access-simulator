import { AccessDencoState, AccessSide, AccessState } from "./access"
import { Denco, DencoAttribute } from "./denco"
import { Event } from "./event"

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


export function formatEvent(event: Event, which: AccessSide, detail: boolean = false): string {
  if (event.type === "access") {
    return detail ? formatAccessDetail(event.data, which) : formatAccessEvent(event.data, which)
  } else {
    return event.type
  }
}

export function formatAccessDetail(result: AccessState, which: AccessSide, width: number = 60): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"

  // アクセス結果の表示
  var title = "access"
  if (which === "offense" && result.linkSuccess) {
    title += "/connect"
  } else if (which === "defense" && result.linkDisconncted) {
    title += "/disconnect"
  }
  str += formatLine(title, width)
  str += formatLine("東京", width)
  str += formatLine("とうきょう", width)

  //which === "offense"
  var leftSide: AccessDencoState | null = result.defense
  var rightSide: AccessDencoState = result.offense
  var left: Denco | null = result.defense ? result.defense.formation[result.defense.carIndex].denco : null
  var right: Denco = result.offense.formation[result.offense.carIndex].denco
  if (which === "defense" && result.defense) {
    right = result.defense.formation[result.defense.carIndex].denco
    left = result.offense.formation[result.offense.carIndex].denco
    rightSide = result.defense
    leftSide = result.offense
  }
  const iconWidth = 14
  str += "┃" + formatSpace(left ? left.name : "不在", iconWidth)
  if (which === "offense") {
    str += "╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐"
  } else {
    str += "┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲"
  }
  str += formatSpace(right.name, iconWidth) + "┃\n"

  str += "┃" + formatSpace(left ? `Lv.${left.level}` : "", iconWidth)
  if (which === "offense") {
    str += "╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘"
  } else {
    str += "└" + "─".repeat(width - 4 - iconWidth * 2) + "╱"
  }
  str += formatSpace(`Lv.${right.level}`, iconWidth) + "┃\n"

  str += "┃" + (left ? formatAttr(left.attr, iconWidth) : " ".repeat(iconWidth))
  str += formatSpace(formatPastTime(Date.now(), result.log.time), width - iconWidth * 2 - 2)
  str += formatAttr(right.attr, iconWidth) + "┃\n"

  const tableLeft = Math.floor((width - 6 - 2) / 2)
  const tableRight = width - 6 - 2 - tableLeft
  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(left ? `${left.name}のマスター` : "", tableLeft, "left")
  str += " user "
  str += formatSpace(`${right.name}のマスター`, tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatSkills(leftSide), tableLeft, "left")
  str += " skill"
  str += formatSpace(formatSkills(rightSide), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatDamage(leftSide), tableLeft, "left")
  str += "damage"
  str += formatSpace(formatDamage(rightSide), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatHP(leftSide), tableLeft, "left")
  str += "  hp  "
  str += formatSpace(formatHP(rightSide), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatLinkTime(leftSide), tableLeft, "left")
  str += " link "
  str += formatSpace(formatLinkTime(rightSide), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(leftSide ? leftSide.score.toString() : "", tableLeft, "left")
  str += " score"
  str += formatSpace(rightSide.score.toString(), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(leftSide ? leftSide.exp.toString() : "", tableLeft, "left")
  str += "  exp "
  str += formatSpace(rightSide.exp.toString(), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  var mes = ""
  if (which === "offense") {
    mes = result.linkSuccess ? `${right.name}がリンクを開始` : `${right.name}がアクセス`
  } else {
    mes = result.linkDisconncted ? `${right.name}のリンクが解除` : "リンク継続中"
  }
  str += formatLine(mes, width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str

}

export function formatAccessEvent(result: AccessState, which: AccessSide, width: number = 50): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"

  // アクセス結果の表示
  var title = "access"
  if (which === "offense" && result.linkSuccess) {
    title += "/connect"
  } else if (which === "defense" && result.linkDisconncted) {
    title += "/disconnect"
  }
  str += formatLine(title, width)
  str += formatLine("東京", width)
  str += formatLine("とうきょう", width)

  //which === "offense"
  var left = result.defense ? result.defense.formation[result.defense.carIndex].denco : null
  var right = result.offense.formation[result.offense.carIndex].denco
  if (which === "defense" && result.defense) {
    right = result.defense.formation[result.defense.carIndex].denco
    left = result.offense.formation[result.offense.carIndex].denco
  }
  const iconWidth = 14
  str += "┃" + formatSpace(left ? left.name : "不在", iconWidth)
  if (which === "offense") {
    str += "╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐"
  } else {
    str += "┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲"
  } str += formatSpace(right.name, iconWidth) + "┃\n"

  str += "┃" + formatSpace(left ? `Lv.${left.level}` : "", iconWidth)
  if (which === "offense") {
    str += "╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘"
  } else {
    str += "└" + "─".repeat(width - 4 - iconWidth * 2) + "╱"
  } str += formatSpace(`Lv.${right.level}`, iconWidth) + "┃\n"

  str += "┃" + formatSpace(left ? `${left.name}のマスター` : "", iconWidth)
  str += formatSpace(formatPastTime(Date.now(), result.log.time), width - iconWidth * 2 - 2)
  str += formatSpace(`${right.name}のマスター`, iconWidth) + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  var mes = ""
  if (which === "offense") {
    mes = result.linkSuccess ? `${right.name}がリンクを開始` : `${right.name}がアクセス`
  } else {
    mes = result.linkDisconncted ? `${right.name}のリンクが解除` : "リンク継続中"
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
  const d = state.formation[state.carIndex]
  if (d.who === "defense") return "10秒"
  return "-"
}

function formatSkills(state?: AccessDencoState | null): string {
  if (!state) return ""
  const skills = state.triggeredSkills
  if (skills.length === 0) return "-"
  return skills.map(s => s.denco.name).join(",")
}

function formatHP(state?: AccessDencoState | null) {
  if (!state) return ""
  const d = state.formation[state.carIndex]
  if (d.hpAfter === d.hpBefore) {
    return `${d.hpAfter}/${d.denco.maxHp}`
  } else {
    return `${d.hpBefore}>>${d.hpAfter}/${d.denco.maxHp}`
  }
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

const charStart = " ".charCodeAt(0)
const charEnd = "~".charCodeAt(0)
const charList = ["…".charCodeAt(0)]
function charLen(code: number): number {
  if (charStart <= code && code <= charEnd) return 1
  if (charList.includes(code)) return 1
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