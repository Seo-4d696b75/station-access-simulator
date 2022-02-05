import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import SkillManager from "./core/skillManager"
import DencoManager from "./core/dencoManager"
import StationManager from "./core/stationManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { getSkill } from './core/denco'
import { initUser, refreshCurrentTime, UserState } from './core/user'
import { activateSkill, refreshSkillState } from './core/skill'

export async function init() {
  await SkillManager.load()
  await DencoManager.load()
  await StationManager.load()
}

export {default as SkillManager} from "./core/skillManager"
export {default as DencoManager} from "./core/dencoManager"
export {default as StationManager} from "./core/stationManager"
export * from "./core/access"
export * from "./core/format"
export * from "./core/context"
export * from "./core/denco"
export * from "./core/user"
export * from "./core/skill"
export * from "./core/station"
export * from "./core/event"
export * from "./core/skillEvent"
export * from "./core/film"

init().then(() => {
  const context = initContext("test", "test", true)
  const now = Date.parse("2020-01-01T12:50:00.000")
  context.clock = now
  let moe = DencoManager.getDenco(context, "9", 80)
  let charlotte = DencoManager.getDenco(context, "6", 80)
  let sheena = DencoManager.getDenco(context, "7", 50)
  let state = initUser(context, "とあるマスター", [moe, charlotte, sheena])
  moe = state.formation[0]
  charlotte = state.formation[1]
  sheena = state.formation[2]
  moe.currentHp = Math.floor(moe.maxHp * 0.9)
  charlotte.currentHp = Math.floor(charlotte.maxHp * 0.6)
  sheena.currentHp = Math.floor(sheena.maxHp * 0.2)
  state = refreshSkillState(context, state)
  // 13:00
  context.clock = now + 600 * 1000
  state = refreshCurrentTime(context, state)
  printEvents(context, state)
})