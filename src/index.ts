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
  context.random.mode = "ignore"
  let mero = DencoManager.getDenco(context, "2", 50)
  let reika = DencoManager.getDenco(context, "5", 50, 1)
  let defense = initUser(context, "とあるマスター", [reika])
  let offense = initUser(context, "とあるマスター２", [mero])
  const config = {
    offense: {
      carIndex: 0,
      ...offense
    },
    defense: {
      carIndex: 0,
      ...defense
    },
    station: reika.link[0],
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(result.defense, true)
})