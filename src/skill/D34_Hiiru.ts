import { AccessState, ActiveSkillDenco, SkillEvaluationStep } from "../core/access"
import { SkillLogic, SkillTrigger } from "../core/skill"

const skill: SkillLogic = {
  canEvaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): SkillTrigger => {
    return step === "probability_check"
  },
  evaluate: (state: AccessState, step: SkillEvaluationStep, self: ActiveSkillDenco): AccessState => {
    const boost = self.propertyReader("boost")
    state.log.log(`テンション上げていこう↑↑ boost:${boost}%`)
    if (self.which === "offense") {
      state.offense.probabilityBoostPercent += boost
    } else if (state.defense) {
      state.defense.probabilityBoostPercent += boost
    }
    return state
  },
  evaluateOnEvent: (state, self) => {
    const boost = self.propertyReader("boost")
    state.log.log(`テンション上げていこう↑↑ boost:${boost}%`)
    state.probabilityBoostPercent += boost
    return state
  }
}

export default skill