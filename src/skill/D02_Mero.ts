import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
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