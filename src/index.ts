import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import manager from "./core/skill_manager"

manager.load().then( () => {
  console.log("load fin.")
  const skill = manager.getSkill("5", 70)
  console.log(skill, skill?.skill?.property_reader("ATK"))
}).catch( e => {
  console.log(e)
})