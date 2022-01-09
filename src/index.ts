import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import skillManager from "./core/skillManager"
import dencoManager from "./core/dencoManager"
import staionManager from "./core/stationManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { getSkill } from './core/denco'
import { initUser } from './core/user'

async function init() {
  await skillManager.load()
  await dencoManager.load()
  await staionManager.load()
}

init().then(() => {
  const context = initContext()
  const luna = dencoManager.getDenco(context, "3", 50)
  const reika = dencoManager.getDenco(context, "5", 80)
  //const sheena = dencoManager.getDenco(context, "7", 80, 2)
  const fubu = dencoManager.getDenco(context, "14", 50)
  const charlotte = dencoManager.getDenco(context, "6", 50, 3)
  const hiiru = dencoManager.getDenco(context, "34", 80)
  const offense = initUser("とあるマスター１", [
    reika
  ])
  const defense = initUser("とあるマスター２", [
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
  printEvents(result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(result.defense, true)
})