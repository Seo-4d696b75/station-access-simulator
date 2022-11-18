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
  deactivate: "default_timeout"
}

export default skill