import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import skillManager from "./core/skillManager"
import dencoManager from "./core/dencoManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent } from './core/log'

async function init() {
  await skillManager.load()
  await dencoManager.load()
}

init().then(() => {
  const luna = dencoManager.getDenco("3", 50)
  const reika = dencoManager.getDenco("5", 50)
  const sheena = dencoManager.getDenco("7", 80)
  const fubu = dencoManager.getDenco("14", 50)
  const charlotte = dencoManager.getDenco("6", 30)
  const hiiru = dencoManager.getDenco("34", 80)
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
    probability: "force"
  }
  const result = startAccess(config).event[0]
  console.log(formatEvent(result, "offense", true))
  console.log(formatEvent(result, "defense", true))
})