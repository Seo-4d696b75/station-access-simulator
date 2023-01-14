import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  triggerOnAccess: (context, state, step, self) => {
    if (step === "pink_check" && !state.pinkMode) {
      return {
        probability: "probability",
        recipe: (state) => {
          state.pinkMode = true
        }
      }
    }
  }
}

export default skill