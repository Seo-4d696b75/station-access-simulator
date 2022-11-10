import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (step === "probability_check") {
      return (state) => {
        const boost = self.skill.property.readNumber("boost")
        context.log.log(`テンション上げていこう↑↑ boost:${boost}%`)
        if (self.which === "offense") {
          state.offense.probabilityBoostPercent += boost
        } else if (state.defense) {
          state.defense.probabilityBoostPercent += boost
        }
      }
    }
  },
  triggerOnEvent: (context, state, self) => {
    return (state) => {
      const boost = self.skill.property.readNumber("boost")
      context.log.log(`テンション上げていこう↑↑ boost:${boost}%`)
      state.probabilityBoostPercent += boost
    }
  },
  deactivateAt(context, state, self) {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  },
}

export default skill