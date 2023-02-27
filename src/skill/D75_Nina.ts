import { hasSkillTriggered } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessStart: (context, state, self) => {
    // 経験値追加
    if (self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "exp_delivery",
        exp: (d) => d.who === "defense"
          ? self.skill.property.readNumber("EXP")
          : 0
      }
    }
  },
  onAccessDamagePercent: (context, state, self) => {
    // 経験値追加と同時
    if (hasSkillTriggered(state, "offense", self)) {
      return {
        probability: 100,
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  }
}

export default skill