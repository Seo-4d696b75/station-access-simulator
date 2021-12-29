import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import skill_manager from "./core/skill_manager"
import denco_manager from "./core/denco_manager"

async function init() {
  await skill_manager.load()
  await denco_manager.load()
}

init().then(() => {
  const reika = denco_manager.getDenco("5", 50)
  console.log(reika)
})