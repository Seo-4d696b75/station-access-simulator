import { SkillLogic } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    return step === "probability_check"
  },
  evaluate: (context, state, step, self) => {
    const boost = self.skill.property.readNumber("boost")
    context.log.log(`テンション上げていこう↑↑ boost:${boost}%`)
    if (self.which === "offense") {
      state.offense.probabilityBoostPercent += boost
    } else if (state.defense) {
      state.defense.probabilityBoostPercent += boost
    }
    return state
  },
  evaluateOnEvent: (context, state, self) => {
    const boost = self.skill.property.readNumber("boost")
    context.log.log(`テンション上げていこう↑↑ boost:${boost}%`)
    state.probabilityBoostPercent += boost
    return state
  }
}

export default skill