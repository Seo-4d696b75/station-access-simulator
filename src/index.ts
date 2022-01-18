import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import SkillManager from "./core/skillManager"
import DencoManager from "./core/dencoManager"
import StationManager from "./core/stationManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { getSkill } from './core/denco'
import { initUser, UserState } from './core/user'
import { activateSkill } from './core/skill'

async function init() {
  await SkillManager.load()
  await DencoManager.load()
  await StationManager.load()
}

init().then(() => {
  const context = initContext()
  context.random.mode = "force"
  context.clock = Date.parse('2022-01-01T23:00:00+0900')
  let luna = DencoManager.getDenco(context, "3", 80, 1)
  let miroku = DencoManager.getDenco(context, "4", 50, 1)
  let reika = DencoManager.getDenco(context, "5", 50)
  let defense = initUser(context, "とあるマスター", [luna])
  let offense = initUser(context, "とあるマスター２", [miroku, reika])
  offense = activateSkill(context, { ...offense, carIndex: 1 })
  const config = {
    offense: {
      carIndex: 0,
      ...offense
    },
    defense: {
      carIndex: 0,
      ...defense
    },
    station: luna.link[0],
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(context, result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(context, result.defense, true)
})