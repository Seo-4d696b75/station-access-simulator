import { getAccessDenco } from "../core/access";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessDamagePercent: (context, state, self) => {
    if (
      self.which === "offense"
      && self.who === "other"
      && getAccessDenco(state, "offense").type === "defender"
    ) {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  }
}

export default skill