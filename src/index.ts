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
  let charlotte = DencoManager.getDenco(context, "6", 80)
  let state = initUser(context, "とあるマスター", [charlotte])
  const now = Date.now()
  context.clock = now
  charlotte = state.formation[0]
  state = activateSkill(context, {...state, carIndex:0})

  context.clock = now + 5400 * 1000
  state = refreshCurrentTime(context, state)
  
  let reika = DencoManager.getDenco(context, "5", 80)
  const offense = initUser(context, "とあるマスター１", [
    reika
  ])
  const defense = initUser(context, "とあるマスター２", [
    charlotte
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
    station: charlotte.link[0],
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(context, result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(context, result.defense, true)
})