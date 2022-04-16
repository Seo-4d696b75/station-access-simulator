import { getCurrentTime } from "../core/context"
import { SkillLogic } from "../core/skill"
import { enqueueSkillEvent, SkillEventEvaluate, randomeAccess } from "../core/skillEvent"

const skill: SkillLogic = {
  disactivateAt: (context, state, self) => {
    const time = getCurrentTime(context)
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    return {
      activeTimeout: time + active * 1000,
      cooldownTimeout: time + (active + wait) * 1000,
    }
  },
  onActivated: (context, state, self) => {
    const timer = self.skill.property.readNumber("timer")
    const evaluate: SkillEventEvaluate = (context, state, self) => randomeAccess(context, state)
    const time = getCurrentTime(context) + timer * 1000
    return enqueueSkillEvent(context, state, time, {
      denco: self,
      probability: true,
      evaluate: evaluate
    })
  }
}

export default skill