import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  canEvaluate: (context, state, step, self) => {
    if (step === "pink_check" && !state.pinkMode) {
      return self.skill.property.readNumber("probability")
    }
    return false
  },
  evaluate: (context, state, step, self) => {
    state.pinkMode = true
    return state
  }
}

export default skill