import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessBeforeStart: (context, state, self) => {
    if (
      self.who === "offense"
      && state.defense
      && !state.pinkMode
    ) {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "invalidate_skill",
        isTarget: (d) => d.type === "supporter"
      }
    }
  }
}

export default skill