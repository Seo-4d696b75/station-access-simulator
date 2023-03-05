import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (self.which === "defense") {
      const targetIdx = self.carIndex === 0 ? 1 : 0
      const d = getAccessDenco(state, "defense")
      if (d.carIndex === targetIdx) {
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