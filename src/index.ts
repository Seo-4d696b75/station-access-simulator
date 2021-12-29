import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import skill_manager from "./core/skill_manager"
import denco_manager from "./core/denco_manager"

async function init() {
  await skill_manager.load()
  await denco_manager.load()
}

init().then(() => {
  const luna = denco_manager.getDenco("3", 50)
  const reika = denco_manager.getDenco("5", 50)
  const sheena = denco_manager.getDenco("7", 50)
  const fubu = denco_manager.getDenco("14", 50)
  console.log(luna, reika, sheena, fubu)
})