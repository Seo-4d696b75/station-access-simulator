import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessBeforeStart: (context, state, self) => {
    // 足湯対象外
    if (
      !state.pinkMode
      && state.defense
      && self.which === "offense"
      && state.offense.carIndex === 0
    ) {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "invalidate_skill",
        isTarget: (d) => d.who === "defense" && d.type === "trickster"
      }
    }
  },
}

export default skill