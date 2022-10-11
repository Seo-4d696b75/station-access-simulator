import { accessRandomStation, enqueueSkillEvent } from "../core/event"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  deactivateAt: (context, state, self) => {
    const time = context.currentTime
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    return {
      activeTimeout: time + active * 1000,
      cooldownTimeout: time + (active + wait) * 1000,
    }
  },
  onActivated: (context, state, self) => {
    const timer = self.skill.property.readNumber("timer")
    const time = context.currentTime + timer * 1000
    return enqueueSkillEvent(context, state, time, self, (state) => {
      return accessRandomStation(context, state)
    })
  }
}

export default skill