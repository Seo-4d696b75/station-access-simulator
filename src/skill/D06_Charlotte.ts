import { accessRandomStation, enqueueSkillEvent } from "../core/event"
import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onActivated: (context, state, self) => {
    const timer = self.skill.property.readNumber("timer")
    const time = context.currentTime + timer * 1000
    return enqueueSkillEvent(context, state, time, self, (state) => {
      return accessRandomStation(context, state)
    })
  }
}

export default skill