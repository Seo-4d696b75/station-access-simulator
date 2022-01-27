import { getCurrentTime } from "../core/context"
import { SkillLogic } from "../core/skill"
import { enqueueSkillEvent, EventSkillEvaluate, randomeAccess } from "../core/skillEvent"

const skill: SkillLogic = {
  disactivateAt: (context, state, self) => {
    const time = getCurrentTime(context)
    const active = self.skillPropertyReader("active")
    const wait = self.skillPropertyReader("wait")
    return {
      activeTimeout: time + active * 1000,
      cooldownTimeout: time + (active + wait) * 1000,
    }
  },
  onActivated: (context, state, self) => {
    const timer = self.skillPropertyReader("timer")
    const evaluate: EventSkillEvaluate = (context, state, self) => randomeAccess(context, state)
    return enqueueSkillEvent(context, state, {
      time: getCurrentTime(context) + timer * 1000,
      denco: self,
      probability: true,
      evaluate: evaluate
    })
  }
}

export default skill