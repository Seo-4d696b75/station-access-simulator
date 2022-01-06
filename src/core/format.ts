import { AccessSideState, AccessSide, AccessState, getAccessDenco } from "./access"
import { Denco, DencoAttribute, DencoState } from "./denco"
import { Event } from "./event"
import { LinksResult, Station, StationLink } from "./station"

export function printEvents(events: Event[], which: AccessSide, detail: boolean = false) {
  events.forEach(event => {
    console.log(formatEvent(event, which, detail))
  })
}

export function formatEvent(event: Event, which: AccessSide, detail: boolean = false): string {
  if (event.type === "access") {
    return detail ? formatAccessDetail(event.data, which) : formatAccessEvent(event.data, which)
  } else if (event.type === "reboot") {
    return detail ? formatRebootDetail(event.data, which) : formatReboot(event.data, which)
  } else {
    return event.type
  }
}

export function formatReboot(result: LinksResult, which: AccessSide, width: number = 40): string {
  if (which !== result.which) return ""
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine("reboot", width)
  str += formatLine(result.denco.name, width)
  str += formatLine(`Lv.${result.denco.level}`, width)
  str += formatLine(`${result.denco.name}のバッテリーが切れました`, width)
  if (result.link.length > 0) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine("接続中のリンクが解除されます", width)
    let stations = result.link.map(e => e.name).join(",")
    let mes = "(" + stations + ")"
    if (len(mes) > width - 2) {
      let length = width - 2 - len(`( ${result.link.length}駅)`)
      mes = "(" + subString(stations, length) + ` ${result.link.length}駅)`
    }
    str += formatLine(mes, width)
    str += "┠" + "─".repeat(width - 2) + "┨\n"
  }
  str += formatLine(`${result.denco.name}再起動します…`, width)
  str += formatLine(formatPastTime(Date.now(), result.time), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}


export function formatRebootDetail(result: LinksResult, which: AccessSide, width: number = 50): string {
  if (which !== result.which) return ""
  if (result.link.length === 0) return ""
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine("reboot", width)
  str += formatLine(`${result.denco.name}がリンクしていた駅のスコアが加算されました`, width)
  str += "┠" + "─".repeat(width - 2) + "┨\n"
  result.link.forEach(link => {
    str += "┃" + formatSpace(link.name, width - 10, "left")
    str += link.matchBonus ? formatAttr(result.denco.attr, 8) : " ".repeat(8)
    str += "┃\n"
    let duration = formatLinkTime(link)
    let pt = formatSpace(formatPt(link.score), width - 2 - len(duration), "right")
    str += "┃" + duration + pt + "┃\n"
    str += "┠" + "─".repeat(width - 2) + "┨\n"
  })
  str += "┃" + "total score" + formatSpace(formatPt(result.totalScore), width - 13, "right") + "┃\n"
  str += "┃" + "link score" + formatSpace(formatPt(result.linkScore), width - 12, "right") + "┃\n"
  str += "┃" + "combo bonus" + formatSpace(formatPt(result.comboBonus), width - 13, "right") + "┃\n"
  str += "┃" + "match bonus" + formatSpace(formatPt(result.matchBonus), width - 13, "right") + "┃\n"
  str += "┃" + formatSpace(result.denco.name + "'s exp " + formatPt(result.totalScore), width - 2, "right") + "┃\n"
  str += formatLine(formatPastTime(Date.now(), result.time), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
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
  str += formatLine(result.station.name, width)
  str += formatLine(result.station.nameKana, width)

  //which === "offense"
  var leftSide: AccessSideState | undefined = result.defense
  var rightSide: AccessSideState = result.offense
  var left: DencoState | null = result.defense ? getAccessDenco(result, "defense") : null
  var right: DencoState = getAccessDenco(result, "offense")
  if (which === "defense" && result.defense) {
    right = getAccessDenco(result, "defense")
    left = getAccessDenco(result, "offense")
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
  str += formatSpace(formatPastTime(Date.now(), result.time), width - iconWidth * 2 - 2)
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
  str += "┃" + formatSpace(formatAccessLinkTime(result.station, leftSide), tableLeft, "left")
  str += " link "
  str += formatSpace(formatAccessLinkTime(result.station, rightSide), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatPt(leftSide?.score), tableLeft, "left")
  str += " score"
  str += formatSpace(formatPt(rightSide.score), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatPt(leftSide?.exp), tableLeft, "left")
  str += "  exp "
  str += formatSpace(formatPt(rightSide.exp), tableRight, "right") + "┃\n"

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
  str += formatLine(result.station.name, width)
  str += formatLine(result.station.nameKana, width)

  //which === "offense"
  var left = result.defense ? getAccessDenco(result, "defense") : null
  var right = getAccessDenco(result, "offense")
  if (which === "defense" && result.defense) {
    right = getAccessDenco(result, "defense")
    left = getAccessDenco(result, "offense")
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
  str += formatSpace(formatPastTime(Date.now(), result.time), width - iconWidth * 2 - 2)
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

function formatDamage(state?: AccessSideState | null): string {
  if (!state) return ""
  const d = state.damage
  if (!d) return "-"
  return d.value.toString()
}

function formatPt(pt: number | undefined): string {
  if (!pt && pt !== 0) return ""
  return new Intl.NumberFormat().format(pt) + "pt"
}

function formatLinkTime(link?: StationLink | null): string {
  if (!link) return ""
  let duration = Date.now() - link.start
  if (duration < 0) return ""
  duration = Math.floor(duration / 1000)
  let str = `${duration % 60}秒`
  duration = Math.floor(duration / 60)
  if (duration === 0) return str
  str = `${duration % 60}分` + str
  duration = Math.floor(duration / 60)
  if (duration === 0) return str
  str = `${duration % 24}時間` + str
  duration = Math.floor(duration / 24)
  if (duration === 0) return str
  str = `${duration}日` + str
  return str
}

function formatAccessLinkTime(station: Station, state?: AccessSideState | null): string {
  if (!state) return ""
  const d = state.formation[state.carIndex]
  if (d.who === "defense") {
    const link = d.link.find(link => link.name === station.name)
    if (link) return formatLinkTime(link)
  }
  return "-"
}

function formatSkills(state?: AccessSideState | null): string {
  if (!state) return ""
  const skills = state.triggeredSkills
  if (skills.length === 0) return "-"
  return skills.map(s => s.name).join(",")
}

function formatHP(state?: AccessSideState | null) {
  if (!state) return ""
  const d = state.formation[state.carIndex]
  if (d.hpAfter === d.hpBefore) {
    return `${d.hpAfter}/${d.maxHp}`
  } else {
    return `${d.hpBefore}>>${d.hpAfter}/${d.maxHp}`
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