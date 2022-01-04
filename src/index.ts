import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import skill_manager from "./core/skill_manager"
import denco_manager from "./core/denco_manager"
import { AccessConfig, executeAccess } from './core/access'
import { formatAccessDetail, formatAccessEvent } from './core/log'

async function init() {
  await skill_manager.load()
  await denco_manager.load()
}

init().then(() => {
  const luna = denco_manager.getDenco("3", 50)
  const reika = denco_manager.getDenco("5", 50)
  const sheena = denco_manager.getDenco("7", 80)
  const fubu = denco_manager.getDenco("14", 50)
  const charlotte = denco_manager.getDenco("6", 30)
  const config: AccessConfig = {
    offense: {
      car_index: 1,
      formation: [
        reika,
        sheena
      ]
    },
    defense: {
      car_index: 0,
      formation: [
        charlotte,
        luna,
        fubu
      ]
    },
    probability: "force"
  }
  const result = executeAccess(config)
  console.log(formatAccessEvent(result, "offense"))
  console.log(formatAccessEvent(result, "defense"))
  console.log(formatAccessDetail(result, "offense"))
  console.log(formatAccessDetail(result, "defense"))
})