import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    const d = getAccessDenco(state, self.which)
    const target = self.skill.property.readStringArray("target_name")
    const isTarget = target.some(t => d.firstName.includes(t))
    if (isTarget && self.which === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"), // 100%
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    } else if (isTarget && self.which === "defense") {
      return {
        probability: self.skill.property.readNumber("probability"), // 100%
        type: "damage_def",
        percent: self.skill.property.readNumber("DEF")
      }
    }
  }
}

export default skill