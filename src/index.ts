import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import skillManager from "./core/skillManager"
import dencoManager from "./core/dencoManager"
import staionManager from "./core/stationManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'

async function init() {
  await skillManager.load()
  await dencoManager.load()
  await staionManager.load()
}

init().then(() => {
  const context = initContext()
  const luna = dencoManager.getDenco(context, "3", 50)
  const reika = dencoManager.getDenco(context, "5", 50)
  const sheena = dencoManager.getDenco(context, "7", 80, 2)
  const fubu = dencoManager.getDenco(context, "14", 50)
  const charlotte = dencoManager.getDenco(context, "6", 30, 3)
  const hiiru = dencoManager.getDenco(context, "34", 80)
  const config: AccessConfig = {
    offense: {
      carIndex: 0,
      formation: [
        charlotte,
        luna,
        fubu
      ]
    },
    defense: {
      carIndex: 0,
      formation: [
        sheena,
        reika,
        hiiru
      ]
    },
    station: sheena.link[0],
    probability: "force"
  }
  const result = startAccess(context, config).event
  console.log("攻撃側のタイムライン")
  printEvents(result, "offense", true)
  console.log("守備側のタイムライン")
  printEvents(result, "defense", true)
})