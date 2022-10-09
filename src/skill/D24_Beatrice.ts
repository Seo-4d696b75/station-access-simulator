import { getAccessDenco } from "../core/access";
import { getCurrentTime } from "../core/context";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "defense") {
      const offense = getAccessDenco(state, "offense")
      if (offense.ap > self.ap) {
        return (state) => {
          const maxDEF = self.skill.property.readNumber("DEF")
          const def = Math.floor(maxDEF * (offense.ap - self.ap) / offense.ap)
          state.defendPercent += def
          context.log.log(`DEF:${def}% = Max:${maxDEF}% * (offenseAP:${offense.ap} - selfAP:${self.ap}) / ${offense.ap}`)
        }
      }
    }
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill