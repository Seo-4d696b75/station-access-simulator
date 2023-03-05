import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "defense") {
      // 相手がheat属性の場合のみ
      const d = getAccessDenco(state, "offense")
      if (d.attr === "heat") {
        return {
          probability: self.skill.property.readNumber("probability"),
          type: "damage_def",
          percent: self.skill.property.readNumber("DEF")
        }
      }
    }
  }
}

export default skill