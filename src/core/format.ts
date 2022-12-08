import { computeWidth } from "meaw"
import { AccessDencoState, AccessSide, getAccessDenco } from "./access/index"
import { Context, SimulatorError } from "./context"
import { formatDuration } from "./date"
import { DencoAttribute } from "./denco"
import { EventTriggeredSkill } from "./event"
import { AccessEventData, AccessEventUser, Event, LevelupDenco } from "./event/type"
import { ReadonlyState } from "./state"
import { LinksResult, Station, StationLink } from "./station"
import { UserState } from "./user"

const percentFormatter = new Intl.NumberFormat(
  "default",
  {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    signDisplay: "always",
  }
)

export function formatPercent(percent: number): string {
  return percentFormatter.format(percent / 100)
}

export function printEvents(context: Context, user: ReadonlyState<UserState> | undefined, detail: boolean = true, colored: boolean = true) {
  if (!user) return
  user.event.forEach(event => {
    console.log(formatEvent(context, event, detail, colored))
  })
}

export function formatEvents(context: Context, user: ReadonlyState<UserState> | undefined, detail: boolean = true, colored: boolean = true): string {
  if (!user) return ""
  return user.event.map(e => formatEvent(context, e, detail, colored)).join("\n")
}

export function formatEvent(context: Context, event: ReadonlyState<Event>, detail: boolean = true, colored: boolean = true): string {
  const time = context.currentTime.valueOf()
  switch (event.type) {
    case "access":
      return detail ? formatAccessDetail(event.data, event.data.which, time, colored) : formatAccessEvent(event.data, event.data.which, time, colored)
    case "reboot":
      return detail ? formatRebootDetail(event.data, time, colored) : formatReboot(event.data, time, colored)
    case "skill_activated":
      // 実際にはスキルが発動したわけでは無いが「スキルが発動」と表示される
      return formatSkillTriggerEvent({ ...event.data, step: "self" }, time, colored)
    case "skill_trigger":
      return formatSkillTriggerEvent(event.data, time, colored)
    case "levelup":
      return detail ? formatLevelupDetail(event.data, time, colored) : formatLevelup(event.data, time, colored)
  }
}

function formatLevelupDetail(event: ReadonlyState<LevelupDenco>, time: number, colored: boolean, width: number = 60): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine(color("level up!", "yellow", colored), width)
  str += formatLine(`${event.after.name}がレベルアップ！`, width, "left")
  str += formatLine(`Lv: ${event.before.level} >> ${event.after.level}`, width, "left")
  str += formatLine(`HP: ${event.before.maxHp} >> ${event.after.maxHp}`, width, "left")
  str += formatLine(`AP: ${event.before.ap} >> ${event.after.ap}`, width, "left")
  if (event.before.skill.type !== "possess" && event.after.skill.type === "possess") {
    str += formatLine("スキルを獲得！", width, "left")
    str += formatLine(color(event.after.skill.name, "blue", colored), width, "left")
  }
  if (event.before.skill.type === "possess" && event.after.skill.type === "possess" && event.before.skill.level !== event.after.skill.level) {
    str += formatLine("スキルがパワーアップ！", width, "left")
    str += formatLine(color(event.before.skill.name, "white", colored), width, "left")
    str += formatLine(color(`>> ${event.after.skill.name}`, "blue", colored), width, "left")
  }
  str += formatLine(color(formatPastTime(time, event.time), "yellow", colored), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}

function formatLevelup(event: ReadonlyState<LevelupDenco>, time: number, colored: boolean, width: number = 40): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine(color("level up!", "yellow", colored), width)
  str += formatLine(event.after.name, width)
  str += formatLine(`Lv.${event.after.level}`, width)
  str += formatLine(`${event.after.name}がレベルアップ！`, width)
  str += formatLine(`Lv: ${event.before.level} >> ${event.after.level}`, width)
  if (event.before.skill.type !== "possess" && event.after.skill.type === "possess") {
    str += formatLine(color("スキルを獲得した！", "blue", colored), width)
  }
  if (event.before.skill.type === "possess" && event.after.skill.type === "possess" && event.before.skill.level !== event.after.skill.level) {
    str += formatLine(color("スキルがパワーアップした！", "blue", colored), width)
  }
  str += formatLine(color(formatPastTime(time, event.time), "yellow", colored), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}

function formatSkillTriggerEvent(event: ReadonlyState<EventTriggeredSkill>, time: number, colored: boolean, width: number = 40): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine(color("skill", "blue", colored), width)
  str += formatLine(event.denco.name, width)
  str += formatLine(`Lv.${event.denco.level}`, width)
  str += formatLine(`「${event.skillName}」`, width)
  str += formatLine(`${event.denco.name}のスキルが発動！`, width)
  str += formatLine(color(formatPastTime(time, event.time), "blue", colored), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}

function formatReboot(result: ReadonlyState<LinksResult>, time: number, colored: boolean, width: number = 40): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine(color("reboot", "red", colored), width)
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
  str += formatLine(color(formatPastTime(time, result.time), "red", colored), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}


function formatRebootDetail(result: ReadonlyState<LinksResult>, time: number, colored: boolean, width: number = 60): string {
  if (result.link.length === 0) {
    // リンク無しの場合は簡易表示のみ
    return formatReboot(result, time, colored, width)
  }
  var str = "┏" + "━".repeat(width - 2) + "┓\n"
  str += formatLine(color("reboot", "red", colored), width)
  str += formatLine(`${result.denco.name}がリンクしていた駅のスコアが加算されました`, width)
  str += "┠" + "─".repeat(width - 2) + "┨\n"
  result.link.forEach(link => {
    str += "┃" + color(formatSpace(link.name, width - 10, "left"), "green", colored)
    str += link.matchBonus ? formatAttr(result.denco.attr, 8) : " ".repeat(8)
    str += "┃\n"
    let duration = formatDuration(link.duration)
    let pt = formatSpace(formatPt(link.totalScore, colored), width - 2 - len(duration), "right")
    str += "┃" + color(duration + pt, "green", colored) + "┃\n"
    str += "┠" + "─".repeat(width - 2) + "┨\n"
  })
  str += "┃" + color("total score" + formatSpace(formatPt(result.totalScore, colored), width - 13, "right"), "green", colored) + "┃\n"
  str += "┃" + "link score" + formatSpace(`${result.link.length}駅 ` + formatPt(result.linkScore, false), width - 12, "right") + "┃\n"
  str += "┃" + "combo bonus" + formatSpace(formatPt(result.comboBonus, false), width - 13, "right") + "┃\n"
  str += "┃" + "match bonus" + formatSpace(`${result.matchCnt}駅 ` + formatPt(result.matchBonus, false), width - 13, "right") + "┃\n"
  str += "┃" + color(formatSpace(result.denco.name + "'s exp " + formatPt(result.totalScore, false), width - 2, "right"), "green", colored) + "┃\n"
  str += formatLine(color(formatPastTime(time, result.time), "red", colored), width)

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}

function formatAccessDetail(result: ReadonlyState<AccessEventData>, which: AccessSide, time: number, colored: boolean, width: number = 60): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"

  // アクセス結果の表示
  var title = "access"
  if (which === "offense" && result.linkSuccess) {
    title += "/connect"
  } else if (which === "defense" && result.linkDisconnected) {
    title += "/disconnect"
  }
  var titleColor = which === "offense" ? "green" : "red" as ConsoleColor
  str += formatLine(color(title, titleColor, colored), width)
  str += formatLine(result.station.name, width)
  str += formatLine(result.station.nameKana, width)

  //which === "offense"
  var leftSide = result.defense
  var rightSide = result.offense
  var left = result.defense ? getAccessDenco(result, "defense") : null
  var right = getAccessDenco(result, "offense")
  if (which === "defense" && result.defense) {
    right = getAccessDenco(result, "defense")
    left = getAccessDenco(result, "offense")
    rightSide = result.defense
    leftSide = result.offense
  }
  const iconWidth = 14
  str += "┃" + formatSpace(left ? left.name : "不在", iconWidth)
  const arrowColor = result.pinkMode ? "magenta" : "green"
  if (which === "offense") {
    str += color("╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐", arrowColor, colored)
  } else {
    str += color("┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲", arrowColor, colored)
  }
  str += formatSpace(right.name, iconWidth) + "┃\n"

  str += "┃" + formatSpace(left ? `Lv.${left.levelBefore}` : "", iconWidth)
  if (which === "offense") {
    str += color("╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘", arrowColor, colored)
  } else {
    str += color("└" + "─".repeat(width - 4 - iconWidth * 2) + "╱", arrowColor, colored)
  }
  str += formatSpace(`Lv.${right.levelBefore}`, iconWidth) + "┃\n"

  str += "┃" + (left ? formatAttr(left.attr, iconWidth) : " ".repeat(iconWidth))
  str += formatSpace(formatPastTime(time, result.time), width - iconWidth * 2 - 2)
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
  str += "┃" + formatSpace(formatDamage(left, colored), tableLeft, "left")
  str += "damage"
  str += formatSpace(formatDamage(right, colored), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatHP(leftSide, colored), tableLeft, "left")
  str += "  hp  "
  str += formatSpace(formatHP(rightSide, colored), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatAccessLinkTime(result.station, result.time, leftSide), tableLeft, "left")
  str += " link "
  str += formatSpace(formatAccessLinkTime(result.station, result.time, rightSide), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatPt(leftSide?.displayedScore, colored, "pt"), tableLeft, "left")
  str += " score"
  str += formatSpace(formatPt(rightSide.displayedScore, colored, "pt"), tableRight, "right") + "┃\n"

  str += "┠" + "─".repeat(width - 2) + "┨\n"
  str += "┃" + formatSpace(formatPt(leftSide?.displayedExp, colored, "exp"), tableLeft, "left")
  str += "  exp "
  str += formatSpace(formatPt(rightSide.displayedExp, colored, "exp"), tableRight, "right") + "┃\n"

  if (which === "offense" && result.linkSuccess) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine(color(`${right.name}がリンクを開始`, "green", colored), width)
  } else if (which === "defense" && result.linkDisconnected) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine(color(`${right.name}のリンクが解除`, "red", colored), width)
  } else if (which === "defense" && !result.linkDisconnected) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine(color("リンク継続中", "green", colored), width)
  }

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str

}

function formatAccessEvent(result: ReadonlyState<AccessEventData>, which: AccessSide, time: number, colored: boolean, width: number = 50): string {
  var str = "┏" + "━".repeat(width - 2) + "┓\n"

  // アクセス結果の表示
  var title = "access"
  if (which === "offense" && result.linkSuccess) {
    title += "/connect"
  } else if (which === "defense" && result.linkDisconnected) {
    title += "/disconnect"
  }
  var titleColor = which === "offense" ? "green" : "red" as ConsoleColor
  str += formatLine(color(title, titleColor, colored), width)
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
  const arrowColor = result.pinkMode ? "magenta" : "green"
  if (which === "offense") {
    str += color("╱" + "─".repeat(width - 4 - iconWidth * 2) + "┐", arrowColor, colored)
  } else {
    str += color("┌" + "─".repeat(width - 4 - iconWidth * 2) + "╲", arrowColor, colored)
  }
  str += formatSpace(right.name, iconWidth) + "┃\n"

  str += "┃" + formatSpace(left ? `Lv.${left.levelBefore}` : "", iconWidth)
  if (which === "offense") {
    str += color("╲" + "─".repeat(width - 4 - iconWidth * 2) + "┘", arrowColor, colored)
  } else {
    str += color("└" + "─".repeat(width - 4 - iconWidth * 2) + "╱", arrowColor, colored)
  }
  str += formatSpace(`Lv.${right.levelBefore}`, iconWidth) + "┃\n"

  str += "┃" + formatSpace(left ? `${left.name}のマスター` : "", iconWidth)
  str += formatSpace(formatPastTime(time, result.time), width - iconWidth * 2 - 2)
  str += formatSpace(`${right.name}のマスター`, iconWidth) + "┃\n"

  if (which === "offense" && result.linkSuccess) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine(color(`${right.name}がリンクを開始`, "green", colored), width)
  } else if (which === "defense" && result.linkDisconnected) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine(color(`${right.name}のリンクが解除`, "red", colored), width)
  } else if (which === "defense" && !result.linkDisconnected) {
    str += "┠" + "─".repeat(width - 2) + "┨\n"
    str += formatLine(color("リンク継続中", "green", colored), width)
  }

  str = str + "┗" + "━".repeat(width - 2) + "┛"
  return str
}

function formatDamage(state: ReadonlyState<AccessDencoState> | null, colored: boolean): string {
  if (!state) return ""
  const d = state.damage
  if (!d) return "-"
  if (d.value >= 0) {
    return color(d.value.toString(), "red", colored)
  } else {
    return color((-d.value).toString(), "green", colored)
  }
}

function formatPt(value: number | undefined, colored: boolean, unit: "pt" | "exp" = "pt"): string {
  if (!value && value !== 0) return ""
  if (value === 0) return "0pt"
  let str = `${value}${unit}`
  return color(str, "green", colored)
}

/**
 * リンク時間を文字列にフォーマットする
 * 
 * **継続中のリンクを対象としています**  
 * 解除されたリンクの時間は{@link LinksResult duration}を参照します
 * @param time リンク時間を参照する時刻[ms]
 * @param link 対象のリンク
 * @returns リンクが`null`の場合は空文字
 */
export function formatLinkTime(time: number, link?: ReadonlyState<StationLink> | null): string {
  if (!link) return ""
  const duration = time - link.start
  return formatDuration(duration)
}

function formatAccessLinkTime(station: ReadonlyState<Station>, accessTime: number, state?: ReadonlyState<AccessEventUser> | null): string {
  if (!state) return ""
  const d = state.formation[state.carIndex]
  if (d.who === "defense") {
    if (d.disconnectedLink) {
      const link = d.disconnectedLink.link.find(link => link.name === station.name)
      if (link) return formatDuration(link.duration)
    } else {
      const link = d.link.find(link => link.name === station.name)
      if (link) return formatLinkTime(accessTime, link)
    }
  }
  return "-"
}

function formatSkills(state?: ReadonlyState<AccessEventUser> | null): string {
  if (!state) return ""
  const skills = state.triggeredSkills
  if (skills.length === 0) return "-"
  return skills.map(s => s.name).join(",")
}

function formatHP(state: ReadonlyState<AccessEventUser> | undefined, colored: boolean) {
  if (!state) return ""
  const d = state.formation[state.carIndex]
  if (d.damage === undefined) {
    return `${d.hpAfter}/${d.maxHpBefore}`
  } else {
    let c = d.damage.value >= 0 ? "red" : "green" as ConsoleColor
    return `${d.hpBefore}>>${color(d.hpAfter.toString(), c, colored)}/${d.maxHpBefore}`
  }
}

function formatAttr(attr: DencoAttribute, width: number): string {
  if (attr === "eco") {
    return formatSpace("eco🌳", width)
  } else if (attr === "heat") {
    return formatSpace("heat🔥", width)
  } else if (attr === "cool") {
    return formatSpace("cool💧", width)
  } else {
    return formatSpace("flat💿", width)
  }
}

function len(value: string): number {
  value = value.replace(/\x1b\[[0-9]+m/g, "")
  return computeWidth(value)
}

/**
 * 文字列を指定した幅長以下にする
 * @returns 指定した幅長を超える場合は末尾を省略する
 */
function subString(value: string, width: number): string {
  if (width < 0) return ""
  const suffix = "…"
  const suffixLen = len(suffix)
  const origin = value
  value = origin.replace(/\x1b\[[0-9]+m/g, "")
  var str = ""
  var length = 0
  for (let i = 0; i < value.length; i++) {
    let c = value.charAt(i)
    let v = len(c)
    if (length + v > width) {
      while (length + suffixLen > width) {
        c = str.charAt(str.length - 1)
        v = len(c)
        length -= v
        str = str.slice(0, -1)
      }
      return str + suffix
    }
    str += value.charAt(i)
    length += v
  }
  const controls = origin.match(/\x1b\[[0-9]+m/g)
  if (!controls) return str

  var result = ""
  for (let i = 0; i < origin.length && str.length > 0;) {
    let char = str.charAt(0)
    let originChar = origin.charAt(i)
    if (char === originChar) {
      result += char
      str = str.substring(1)
      i++
    } else if (originChar === "\x1b") {
      let control = controls[0]
      controls.splice(0, 1)
      result += control
      i += control.length
    } else if (char === suffix) {
      result += "…"
      str = str.substring(1)
    } else {
      throw new SimulatorError()
    }
  }
  result = controls.reduce((a, b) => a + b, result)
  return result
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

type TextGravity = "left" | "right" | "center"

function formatSpace(value: string, width: number, gravity: TextGravity = "center"): string {
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

function formatLine(value: string, width: number, gravity: TextGravity = "center", end: string = "┃"): string {
  const length = width - 2
  return end + formatSpace(value, length, gravity) + end + "\n"
}

const COLOR_CONTROLS = {
  black: '\u001b[30m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m'
}

type ConsoleColor = keyof (typeof COLOR_CONTROLS)

function color(value: string, color: ConsoleColor, enabled: boolean): string {
  if (!enabled) return value
  return `${COLOR_CONTROLS[color]}${value}\u001b[00m`
}