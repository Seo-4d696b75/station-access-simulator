import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import SkillManager from "./core/skillManager"
import DencoManager from "./core/dencoManager"
import StationManager from "./core/stationManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { getSkill } from './core/denco'
import { initUser } from './core/user'
import { activateSkill } from './core/skill'

async function init() {
  await SkillManager.load()
  await DencoManager.load()
  await StationManager.load()
}

init().then(() => {
  const context = initContext()
  let reika = DencoManager.getDenco(context, "5", 50, 1)
  let sheena = DencoManager.getDenco(context, "7", 80, 3)
  let offense = initUser("とあるマスター１", [
    reika
  ])
  let defense = initUser("とあるマスター２", [
    sheena
  ])
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
    probability: "force"
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(result.defense, true)
})