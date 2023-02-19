import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessBeforeStart: (context, state, self) => {
    // 相手不在・足湯では発動しない
    if (state.defense && !state.pinkMode) {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "invalidate_skill",
        isTarget: (d) => d.attr === "heat"
      }
    }
  },
}

export default skill