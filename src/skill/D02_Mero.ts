import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    if (step === "pink_check" && !state.pinkMode) {
      return {
        probability: self.skill.property.readNumber("probability"),
        recipe: (state) => {
          state.pinkMode = true
        }
      }
    }
  }
}

export default skill