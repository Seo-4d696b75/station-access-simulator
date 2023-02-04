import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessPinkCheck: (context, state, self) => {
    if (self.who === "offense" && !state.pinkMode) {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "pink_check",
        enable: true,
      }
    }
  }
}

export default skill