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
import { activateSkill } from './core/skill'

async function init() {
  await SkillManager.load()
  await DencoManager.load()
  await StationManager.load()
}

init().then(() => {
  const context = initContext("test", "test", true)
  context.random.mode = "ignore"
  let sheena = DencoManager.getDenco(context, "7", 50, 1)
  let hiiru = DencoManager.getDenco(context, "34", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50)
  const offense = initUser(context, "とあるマスター１", [
    charlotte
  ])
  let defense = initUser(context, "とあるマスター２", [
    sheena, hiiru
  ])
  defense = activateSkill(context, { ...defense, carIndex: 1 })
  const config: AccessConfig = {
    offense: {
      carIndex: 0,
      ...offense
    },
    defense: {
      carIndex: 0,
      ...defense
    },
    station: sheena.link[0],
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(context, result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(context, result.defense, true)
})